
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { isEmpty } from 'lodash';
import { ComponentSize, Margin } from '../types';
import './Dashboard.css';

interface MedalData {
  country_code: string;
  country: string;
  country_long: string;
  "Gold Medal": number;
  "Silver Medal": number;
  "Bronze Medal": number;
  Total: number;
}

interface DetailedMedal {
  medal_type: string;
  discipline: string;
  event: string;
  country_code: string;
  country: string;
}

const MedalDashboard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<SVGSVGElement>(null);
  const chordRef = useRef<SVGSVGElement>(null);
  const statsRef = useRef<SVGSVGElement>(null);
  
  const [size, setSize] = useState<ComponentSize>({ width: 800, height: 600 });
  const [medalData, setMedalData] = useState<MedalData[]>([]);
  const [detailedData, setDetailedData] = useState<DetailedMedal[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  
  const margin: Margin = { top: 20, right: 20, bottom: 40, left: 40 };
  
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);
  useResizeObserver({ ref: containerRef, onResize });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load data files
        const [medalsTotal, medalsCSV, worldMap] = await Promise.all([
          d3.csv('/data/medals_total.csv'),
          d3.csv('/data/medals.csv'),
          fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
            .then(res => res.json())
        ]);

        // Process medals data
        const processedMedals = medalsTotal.map(d => ({
          ...d,
          "Gold Medal": +d["Gold Medal"],
          "Silver Medal": +d["Silver Medal"], 
          "Bronze Medal": +d["Bronze Medal"],
          Total: +d.Total
        }));

        setMedalData(processedMedals);
        setDetailedData(medalsCSV);
        
        // Initialize visualizations
        if (mapRef.current) {
          drawMap(processedMedals, worldMap);
        }
        if (chordRef.current) {
            drawChordDiagram(medalsCSV);
          }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      updateMedalChart(selectedCountry);
      updateStatsPanel(selectedCountry);
    }
  }, [selectedCountry, size]); // Add size dependency to update on resize

  const drawMap = (data: MedalData[], worldGeoJson: any) => {
    if (!mapRef.current) return;
  
    // Get the container dimensions
    const mapContainer = mapRef.current.closest('.map-container');
    if (!mapContainer) return;
  
    const containerRect = mapContainer.getBoundingClientRect();
    const width = containerRect.width - 40;
    const height = containerRect.height - 40;
  
    // Create a mapping of different country code formats
    const countryCodeMap: { [key: string]: string } = {
      // Common variations between ISO codes
      'USA': 'USA', 'GBR': 'GBR', 'CHN': 'CHN',
      'RUS': 'RUS', 'GER': 'DEU', 'FRA': 'FRA',
      'JPN': 'JPN', 'AUS': 'AUS', 'ITA': 'ITA',
      'CAN': 'CAN', 'KOR': 'KOR', 'NED': 'NLD',
      'NZL': 'NZL', 'BRA': 'BRA', 'ESP': 'ESP',
      'UKR': 'UKR', 'HUN': 'HUN', 'ROC': 'RUS',
      'SUI': 'CHE', 'POL': 'POL', 'CZE': 'CZE',
      'DEN': 'DNK', 'NOR': 'NOR', 'SWE': 'SWE',
      'RSA': 'ZAF', 'JAM': 'JAM', 'CUB': 'CUB',
      'KAZ': 'KAZ', 'IRL': 'IRL', 'MEX': 'MEX',
      'BEL': 'BEL', 'TUR': 'TUR', 'AUT': 'AUT',
      // Add more mappings as needed
    };
  
    // Clear previous content
    d3.select(mapRef.current).selectAll("*").remove();
  
    const svg = d3.select(mapRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);
  
    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('padding', '10px')
      .style('border', '1px solid #ccc')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('opacity', 0);
  
    const margin = { top: 20, right: 20, bottom: 60, left: 20 };
    const mapWidth = width - margin.left - margin.right;
    const mapHeight = height - margin.top - margin.bottom;
  
    const projection = d3.geoMercator()
      .fitSize([mapWidth, mapHeight], worldGeoJson)
      .translate([width / 2, (height - margin.bottom) / 2]);
  
    const path = d3.geoPath().projection(projection);
  
    const COLORS = {
        background: '#e2e8f0',  // Darker background gray
        map: {
          base: '#1a365d',      // Dark blue base for countries
          noData: '#334155',    // Darker gray for countries without medals
          gradient: {
            start: '#3b82f6',   // Bright blue
            middle: '#1d4ed8',  // Medium blue
            end: '#1e3a8a'      // Dark blue
          }
        },
        border: '#475569'       // Darker border color
      };

    // Create color scale
    const colorScale = d3.scaleSequential()
    .domain([0, d3.max(data, d => d.Total) || 0])
    .interpolator(t => d3.interpolate(
      COLORS.map.gradient.start,
      COLORS.map.gradient.end
    )(t));

    
    
  
    // Draw map
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    // Add debug logging to identify country code mismatches
    console.group('Country Code Mapping Debug');
    const unmappedCountries = new Set();
  
    g.selectAll('path')
      .data(worldGeoJson.features)
      .join('path')
      .attr('d', path)
      .attr('fill', d => {
        const iso3Code = d.properties.ISO_A3;
        const countryData = data.find(m => {
          // Try direct match first
          if (m.country_code === iso3Code) return true;
          // Try mapped code next
          const mappedCode = countryCodeMap[m.country_code];
          return mappedCode === iso3Code;
        });
  
        if (!countryData && data.some(m => m.country === d.properties.NAME)) {
          unmappedCountries.add({
            name: d.properties.NAME,
            iso3: iso3Code,
            found: data.find(m => m.country === d.properties.NAME)?.country_code
          });
        }
        return countryData ? colorScale(countryData.Total) : '#f0f0f0';
    })
    .attr('stroke', COLORS.border)
    .attr('stroke-width', 0.5)
    .on('mouseover', function(event, d) {
      const countryData = data.find(m => m.country_code === d.properties.ISO_A3);
      
      d3.select(this)
        .attr('stroke-width', 1.5)
        .attr('stroke', '#fff');

        if (countryData) {
            tooltip.transition()
              .duration(200)
              .style('opacity', .9);
            
            tooltip.html(`
              <div style="background-color: ${COLORS.map.base}; color: white; padding: 8px; border-radius: 4px;">
                <strong>${countryData.country}</strong><br/>
                Total Medals: ${countryData.Total}<br/>
                Gold: ${countryData["Gold Medal"]}<br/>
                Silver: ${countryData["Silver Medal"]}<br/>
                Bronze: ${countryData["Bronze Medal"]}
              </div>
            `)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 28) + 'px');
          }
        })
        .on('mouseout', function() {
          d3.select(this)
            .attr('stroke-width', 0.5)
            .attr('stroke', COLORS.border);
          
          tooltip.transition()
            .duration(500)
            .style('opacity', 0);
        })
    .on('click', (event, d) => {
      const iso3Code = d.properties.ISO_A3;
      const countryData = data.find(m => 
        m.country_code === iso3Code || countryCodeMap[m.country_code] === iso3Code
      );
      if (countryData) {
        setSelectedCountry(countryData.country_code);
      }
    });

  // Log unmapped countries to help identify missing mappings
  if (unmappedCountries.size > 0) {
    console.log('Unmapped Countries:', Array.from(unmappedCountries));
  }
  console.groupEnd();

  const legendWidth = Math.min(300, width - margin.left - margin.right);
  const legendHeight = 15;
  
  const legendGroup = svg.append('g')
    .attr('class', 'map-legend')
    .attr('transform', `translate(${(width - legendWidth) / 2},${height - margin.bottom + 10})`);

  // Create darker gradient for legend
  const gradient = legendGroup.append('defs')
    .append('linearGradient')
    .attr('id', 'medal-gradient')
    .attr('x1', '0%')
    .attr('x2', '100%');

  gradient.selectAll('stop')
    .data([
      { offset: '0%', color: COLORS.map.gradient.start },
      { offset: '50%', color: COLORS.map.gradient.middle },
      { offset: '100%', color: COLORS.map.gradient.end }
    ])
    .join('stop')
    .attr('offset', d => d.offset)
    .attr('stop-color', d => d.color);

  // Draw legend rectangle
  legendGroup.append('rect')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .attr('fill', 'url(#medal-gradient)')
    .attr('rx', 4);

  // Update legend text colors
  legendGroup.append('text')
    .attr('x', legendWidth / 2)
    .attr('y', -5)
    .attr('text-anchor', 'middle')
    .attr('class', 'map-legend-title')
    .style('fill', COLORS.map.base)
    .style('font-weight', '600')
    .text('Total Medals');

  // Add legend scale with darker text
  const legendScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.Total)!])
    .range([0, legendWidth]);

  const legendAxis = legendGroup.append('g')
    .attr('transform', `translate(0,${legendHeight})`)
    .call(d3.axisBottom(legendScale)
      .ticks(5)
      .tickSize(5))
    .style('color', COLORS.map.base);

  legendAxis.select('.domain').remove();
};

  const drawChordDiagram = (medals: DetailedMedal[]) => {
    if (!chordRef.current) return;

    // Get container dimensions
    const container = chordRef.current.closest('.chart-container');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width - 40;
    const height = containerRect.height - 40;
    const radius = Math.min(width, height) / 2;

    // Process data for chord diagram
    const countries = Array.from(new Set(medals.map(m => m.country)))
      .sort((a, b) => d3.ascending(a, b))
      .slice(0, 10); // Take top 10 countries for clarity
    
    const disciplines = Array.from(new Set(medals.map(m => m.discipline)))
      .sort((a, b) => d3.ascending(a, b))
      .slice(0, 10); // Take top 10 disciplines

    const names = [...countries, ...disciplines];

    // Create matrix
    const size = names.length;
    const matrix = Array(size).fill(0).map(() => Array(size).fill(0));

    // Fill matrix
    medals.forEach(medal => {
      if (countries.includes(medal.country) && disciplines.includes(medal.discipline)) {
        const sourceIndex = names.indexOf(medal.country);
        const targetIndex = names.indexOf(medal.discipline);
        matrix[sourceIndex][targetIndex]++;
        matrix[targetIndex][sourceIndex]++; // Symmetric relationship
      }
    });

    // Clear previous content
    d3.select(chordRef.current).selectAll('*').remove();

    const svg = d3.select(chordRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);

    // Create chord layout
    const chord = d3.chord()
      .padAngle(0.05)
      .sortSubgroups(d3.descending);

    const chordData = chord(matrix);

    // Color scale
    const colorScale = d3.scaleOrdinal()
      .domain(names)
      .range(d3.schemeTableau10);

    // Create arcs
    const arc = d3.arc()
      .innerRadius(radius * 0.9)
      .outerRadius(radius);

    // Create ribbons
    const ribbon = d3.ribbon()
      .radius(radius * 0.9);

    // Add tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)');

    // Draw groups
    const group = svg.append('g')
      .selectAll('g')
      .data(chordData.groups)
      .join('g');

    group.append('path')
      .attr('d', arc as any)
      .style('fill', d => colorScale(names[d.index]))
      .style('stroke', '#fff')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).style('opacity', 0.8);
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
        tooltip.html(`${names[d.index]}<br/>Total: ${d3.sum(matrix[d.index])}`)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).style('opacity', 1);
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Add labels
    group.append('text')
      .each(d => { (d as any).angle = (d.startAngle + d.endAngle) / 2; })
      .attr('dy', '.35em')
      .attr('transform', d => `
        rotate(${((d as any).angle * 180 / Math.PI - 90)})
        translate(${radius + 10})
        ${(d as any).angle > Math.PI ? 'rotate(180)' : ''}
      `)
      .attr('text-anchor', d => (d as any).angle > Math.PI ? 'end' : 'start')
      .text(d => names[d.index])
      .style('font-size', '10px');

    // Draw ribbons
    svg.append('g')
      .attr('fill-opacity', 0.67)
      .selectAll('path')
      .data(chordData)
      .join('path')
      .attr('d', ribbon as any)
      .style('fill', d => colorScale(names[d.source.index]))
      .style('stroke', '#fff')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).style('opacity', 1);
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
        tooltip.html(`
          ${names[d.source.index]} → ${names[d.target.index]}<br/>
          Medals: ${d.source.value}
        `)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).style('opacity', 0.67);
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });
  };
  const updateMedalChart = (countryCode: string) => {
    if (!chartRef.current) return;
  
    const chartContainer = chartRef.current.closest('.chart-container');
    if (!chartContainer) return;
  
    const containerRect = chartContainer.getBoundingClientRect();
    const width = containerRect.width - 40;
    const height = containerRect.height - 60;
  
    const margin = { top: 20, right: 80, bottom: 60, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
  
    // Process data
    const countryMedals = detailedData.filter(d => d.country_code === countryCode);
    const sportsMedals = d3.group(countryMedals, d => d.discipline);
  
    const chartData = Array.from(sportsMedals, ([sport, medals]) => ({
      sport: sport.length > 15 ? sport.substring(0, 12) + '...' : sport,
      "Gold Medal": medals.filter(m => m.medal_type === "Gold Medal").length,
      "Silver Medal": medals.filter(m => m.medal_type === "Silver Medal").length,
      "Bronze Medal": medals.filter(m => m.medal_type === "Bronze Medal").length
    }))
    .sort((a, b) => 
      (b["Gold Medal"] + b["Silver Medal"] + b["Bronze Medal"]) - 
      (a["Gold Medal"] + a["Silver Medal"] + b["Bronze Medal"])
    )
    .slice(0, 8);
  
    // Clear previous content
    d3.select(chartRef.current).selectAll('*').remove();
  
    const svg = d3.select(chartRef.current)
      .attr('width', width)
      .attr('height', height);
  
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    // Set up scales
    const xScale = d3.scaleBand()
      .domain(chartData.map(d => d.sport))
      .range([0, chartWidth])
      .padding(0.2);
  
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => 
        d["Gold Medal"] + d["Silver Medal"] + d["Bronze Medal"]
      ) || 0])
      .range([chartHeight, 0]);
  
    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .attr('dx', '-0.8em')
      .attr('dy', '0.5em')
      .attr('text-anchor', 'end');
  
    g.append('g')
      .call(d3.axisLeft(yScale));
  
    // Create and animate stacked bars
    const stack = d3.stack()
      .keys(["Gold Medal", "Silver Medal", "Bronze Medal"]);
  
    const colorScale = d3.scaleOrdinal()
      .domain(["Gold Medal", "Silver Medal", "Bronze Medal"])
      .range(['#FFD700', '#C0C0C0', '#CD7F32']);
  
    g.selectAll('g.medal-type')
      .data(stack(chartData))
      .join('g')
      .attr('class', 'medal-type')
      .attr('fill', d => colorScale(d.key))
      .selectAll('rect')
      .data(d => d)
      .join('rect')
      .attr('x', d => xScale(d.data.sport)!)
      .attr('y', chartHeight) // Start from bottom
      .attr('height', 0) // Start with height 0
      .attr('width', xScale.bandwidth())
      .transition() // Add transition
      .duration(1000) // 1 second duration
      .delay((d, i) => i * 100) // Stagger the animations
      .attr('y', d => yScale(d[1]))
      .attr('height', d => yScale(d[0]) - yScale(d[1]));
  
    // Add legend with animation
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 10},${margin.top})`);
  
    ["Gold Medal", "Silver Medal", "Bronze Medal"].forEach((medal, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0,${i * 20})`);
  
      legendRow.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', colorScale(medal))
        .style('opacity', 0)
        .transition()
        .duration(500)
        .delay(i * 100)
        .style('opacity', 1);
  
      legendRow.append('text')
        .attr('x', 24)
        .attr('y', 12)
        .text(medal.replace(' Medal', ''))
        .style('opacity', 0)
        .transition()
        .duration(500)
        .delay(i * 100)
        .style('opacity', 1);
    });
  };

  const updateStatsPanel = (countryCode: string) => {
    if (!statsRef.current) return;

    const width = size.width / 3;
    const height = size.height;

    const countryData = medalData.find(d => d.country_code === countryCode);
    if (!countryData) return;

    // Clear previous content
    d3.select(statsRef.current).selectAll("*").remove();

    const svg = d3.select(statsRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add country name
    g.append('text')
      .attr('x', (width - margin.left - margin.right) / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('class', 'country-name')
      .text(countryData.country);

    // Add medal counts
    const medalTypes = [
      { type: 'Gold', count: countryData["Gold Medal"], color: '#FFD700' },
      { type: 'Silver', count: countryData["Silver Medal"], color: '#C0C0C0' },
      { type: 'Bronze', count: countryData["Bronze Medal"], color: '#CD7F32' }
    ];

    medalTypes.forEach((medal, i) => {
      const medalG = g.append('g')
        .attr('transform', `translate(${(width - margin.left - margin.right) / 2},${80 + i * 60})`);

      medalG.append('circle')
        .attr('r', 25)
        .attr('fill', medal.color);

      medalG.append('text')
        .attr('y', 8)
        .attr('text-anchor', 'middle')
        .attr('class', 'medal-count')
        .text(medal.count);

      medalG.append('text')
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .attr('class', 'medal-type')
        .text(medal.type);
    });
  };

  return (
    <div ref={containerRef} className="dashboard-container">
      <div className="dashboard-header">
        <h1>Olympic Medals Dashboard</h1>
        <h2>Paris 2024 Olympic Games Medal Tracker</h2>
      </div>
      
      <div className="dashboard-content">
        <div className="map-container">
          <svg ref={mapRef} />
          <div className="map-legend">
            <div className="map-legend-title">Total Medals</div>
            <div className="map-legend-gradient"></div>
            <div className="map-legend-labels"></div>
          </div>
        </div>
        <div className="charts-sidebar">
          <div className="chart-container">
            <h3>Medal Distribution by Sport</h3>
            <svg ref={chartRef} />
          </div>
          <div className="chart-container">
            <h3>Medal Distribution Network</h3>
            <svg ref={chordRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedalDashboard;