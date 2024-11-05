import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { ComponentSize, Margin } from '../types';

interface SportEventPie {
  sport: string;
  total: number;
}

interface CountryMedal {
  country: string;
  gold: number;
  silver: number;
  bronze: number;
}

const MEDAL_TYPES = {
  Gold: 'Gold Medal',
  Silver: 'Silver Medal',
  Bronze: 'Bronze Medal',
};

const TOP_N_SPORTS = 15;

export default function Pie() {
  const [data, setData] = useState<SportEventPie[]>([]);
  const [countryData, setCountryData] = useState<any[]>([]);
  const [isCountryView, setIsCountryView] = useState<boolean>(false);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 40, right: 20, bottom: 80, left: 60 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);

  useResizeObserver({ ref: svgRef, onResize });

  const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('position', 'absolute')
    .style('padding', '5px')
    .style('background', 'rgba(0, 0, 0, 0.7)')
    .style('color', 'white')
    .style('border-radius', '5px')
    .style('pointer-events', 'none')
    .style('opacity', 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsData = await d3.csv('../../data/olymic/events.csv', d => ({
          sport: d.sport,
        }));

        const medalsData = await d3.csv('../../data/olymic/medals.csv');
        setCountryData(medalsData);

        const sportsData = d3.rollups(
          eventsData,
          v => v.length,
          d => d.sport
        ).map(([sport, total]) => ({ sport, total }));

        sportsData.sort((a, b) => b.total - a.total);
        const topSports = sportsData.slice(0, TOP_N_SPORTS);
        const othersTotal = sportsData.slice(TOP_N_SPORTS).reduce((acc, d) => acc + d.total, 0);

        if (othersTotal > 0) {
          topSports.push({ sport: 'Others', total: othersTotal });
        }

        setData(topSports);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!data.length || size.width === 0 || size.height === 0) return;
    d3.select(svgRef.current).selectAll('*').remove();
    renderPieChart(data);
  }, [data, size]);

  function renderPieChart(dataToRender: SportEventPie[]) {
    const radius = Math.min(size.width, size.height) / 2 - Math.max(margin.top, margin.bottom);
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const pie = d3.pie<SportEventPie>().value(d => d.total);
    const arc = d3.arc<d3.PieArcDatum<SportEventPie>>().outerRadius(radius).innerRadius(0);
    const expandedArc = d3.arc<d3.PieArcDatum<SportEventPie>>().outerRadius(radius + 20).innerRadius(0);

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${size.width} ${size.height}`)
      .attr('width', size.width)
      .attr('height', size.height);

    const chartContainer = svg.append('g')
      .attr('transform', `translate(${size.width / 2}, ${size.height / 2})`);

    chartContainer.selectAll('path')
      .data(pie(dataToRender))
      .join('path')
      .attr('d', arc)
      .attr('fill', (d, i) => color(i.toString()))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(200).attr('d', expandedArc);
        tooltip.style('opacity', 1).html(`<strong>${d.data.sport}</strong>: ${d.data.total}`);
      })
      .on('mousemove', function (event) {
        tooltip.style('left', `${event.pageX + 10}px`).style('top', `${event.pageY - 20}px`);
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(200).attr('d', arc);
        tooltip.style('opacity', 0);
      })
      .on('click', function (event, d) {
        const selectedSport = d.data.sport;
        const filteredCountries = countryData.filter(row => 
          row.discipline === selectedSport || row.event === selectedSport
        );

        const countryMedals = d3.rollups(
          filteredCountries,
          v => {
            const medals = { gold: 0, silver: 0, bronze: 0 };
            v.forEach(item => {
              if (item.medal_type === MEDAL_TYPES.Gold) medals.gold++;
              else if (item.medal_type === MEDAL_TYPES.Silver) medals.silver++;
              else if (item.medal_type === MEDAL_TYPES.Bronze) medals.bronze++;
            });
            return medals;
          },
          d => d.country
        ).map(([country, medals]) => ({
          country,
          gold: medals.gold,
          silver: medals.silver,
          bronze: medals.bronze,
        }));

        if (countryMedals.length > 0) {
          chartContainer.selectAll('*').remove();
          setIsCountryView(true);
          setSelectedSport(selectedSport);
          renderCountryPieChart(selectedSport, countryMedals);
        } else {
          console.warn('No data available for the selected sport:', selectedSport);
        }
      });

    const legendContainer = svg.append('g')
      .attr('transform', `translate(${size.width - margin.right - 100}, ${margin.top})`);

    legendContainer.selectAll('.legend-item')
      .data(dataToRender)
      .join('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`)
      .append('rect')
      .attr('x', 0)
      .attr('width', 18)
      .attr('height', 18)
      .attr('fill', (d, i) => color(i.toString()));

    legendContainer.selectAll('.legend-item')
      .append('text')
      .attr('x', 25)
      .attr('y', 9)
      .attr('dy', '0.35em')
      .text(d => d.sport);
  }

  function renderCountryPieChart(selectedSport: string, countries: CountryMedal[]) {
    const radius = Math.min(size.width, size.height) / 2 - Math.max(margin.top, margin.bottom);
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const pie = d3.pie<CountryMedal>().value(d => d.gold + d.silver + d.bronze);
    const arc = d3.arc<d3.PieArcDatum<CountryMedal>>().outerRadius(radius).innerRadius(0);

    const chartContainer = d3.select(svgRef.current).select('g')
      .attr('transform', `translate(${size.width / 2}, ${size.height / 2})`);

    chartContainer.selectAll('path')
      .data(pie(countries))
      .join('path')
      .attr('d', arc)
      .attr('fill', (d, i) => color(i.toString()))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(200).attr('d', d3.arc().outerRadius(radius + 10).innerRadius(0));
        const medalCounts = `Gold: ${d.data.gold}, Silver: ${d.data.silver}, Bronze: ${d.data.bronze}`;
        tooltip.style('opacity', 1).html(`<strong>${d.data.country}</strong><br>${medalCounts}`);
      })
      .on('mousemove', function (event) {
        tooltip.style('left', `${event.pageX + 10}px`).style('top', `${event.pageY - 20}px`);
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(200).attr('d', arc);
        tooltip.style('opacity', 0);
      });
  }

  const handleBackToEventPie = () => {
    setIsCountryView(false);
    setSelectedSport('');
    d3.select(svgRef.current).selectAll('*').remove();
    renderPieChart(data);
  };

  return (
    <>
      <div className='chart-container' style={{ width: '100%', height: '360px' }}>
        <svg ref={svgRef} width='100%' height='100%'></svg>
      </div>
      {isCountryView && (
        <button onClick={handleBackToEventPie} style={{ marginTop: '20px' }}>
          Back to Event Pie
        </button>
      )}
    </>
  );
}
