import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const BumpChart = ({ selectedGender, setSelectedGender }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [data, setData] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventLabels, setEventLabels] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState("Freestyle");
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(""); // Default to all countries
  const [dimensions, setDimensions] = useState({ width: window.innerWidth * 0.4, height: window.innerHeight * 0.4 });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth * 0.4, height: window.innerHeight * 0.4 });
    };
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setSelectedCountry(""); // Reset to "All Countries"
  }, [selectedGender, selectedStyle]);

  useEffect(() => {
    Promise.all([
      d3.csv('data/archive/events.csv'),
      d3.csv('data/archive/results/Swimming.csv')
    ]).then(([eventData, swimmingData]) => {
      const eventList = eventData
        .filter(d => d.sport === "Swimming" && d.event.includes(selectedStyle) && d.event.includes(selectedGender) && !d.event.includes('Relay'))
        .map(d => d.event);
      setEvents(eventList);

      const labels = eventList.map(event => {
        const match = event.match(/\d+m/);
        return match ? match[0] : event;
      });
      setEventLabels(labels);

      const filteredData = swimmingData
        .filter(d => d.stage === "Final" && eventList.includes(d.event_name) && d.participant_type === 'Person')
        .map(d => d.rank ? { 
          event: d.event_name, 
          athlete: d.participant_name, 
          rank: +d.rank, 
          country: d.participant_country
        } : null)
        .filter(d => d !== null);

      const uniqueCountries = Array.from(new Set(filteredData.map(d => d.country)));
      setCountries(uniqueCountries);

      const groupedData = d3.group(filteredData, d => d.athlete);
      const formattedData = Array.from(groupedData, ([athlete, records]) => {
        const ranks = {};
        eventList.forEach(event => {
          const record = records.find(r => r.event === event);
          ranks[event] = record ? record.rank : null;
        });
        return { athlete, ranks, country: records[0].country };
      });

      setData(formattedData);
    });
  }, [selectedGender, selectedStyle]);

  useEffect(() => {
    if (!data.length || !events.length) return;
  
    const filteredData = selectedCountry ? data.filter(d => d.country === selectedCountry) : data;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const tooltip = d3.select(tooltipRef.current);

    const margin = { top: 50, right: 150, bottom: 50, left: 50 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;
  
    const xScale = d3.scalePoint()
      .domain(eventLabels)
      .range([0, width])
      .padding(0.5);
  
    const maxRank = d3.max(filteredData, d => d3.max(events.map(e => d.ranks[e])));
  
    const yScale = d3.scaleLinear()
      .domain([1, maxRank])
      .range([0, height]);

    const colorScale = d3.scaleOrdinal()
      .domain(countries)
      .range(d3.schemeTableau10);

    const line = d3.line()
      .defined(d => d[1] != null)
      .x(d => xScale(eventLabels[events.indexOf(d[0])]))
      .y(d => yScale(d[1]));
  
    const linesGroup = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale)
      .ticks(maxRank)
      .tickFormat(d3.format("d"));

    linesGroup.append('g')
      .attr('class', 'grid x-grid')
      .selectAll('line')
      .data(eventLabels)
      .enter()
      .append('line')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#e0e0e0');

    linesGroup.append('g')
      .attr('class', 'grid y-grid')
      .selectAll('line')
      .data(yScale.ticks(maxRank))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#e0e0e0');

    svg.append('g')
      .attr('transform', `translate(${margin.left},${height + margin.top})`)
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "middle");

    svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .call(yAxis)
      .call(g => g.select(".domain").remove())
      .append("text")
      .attr("x", -margin.left + 20)
      .attr("y", -10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Final Rank");

    linesGroup.selectAll('.line')
      .data(filteredData)
      .enter()
      .append('path')
      .attr('class', 'line')
      .attr('d', d => line(Object.entries(d.ranks)))
      .attr('fill', 'none')
      .attr('stroke', d => colorScale(d.country))
      .attr('stroke-width', 2);

    linesGroup.selectAll('.points')
      .data(filteredData)
      .enter()
      .append('g')
      .attr('class', 'points')
      .attr('fill', d => colorScale(d.country))
      .selectAll('circle')
      .data(d => 
        Object.entries(d.ranks)
          .filter(([event, rank]) => rank != null)
          .map(([event, rank]) => ({ event, rank, athlete: d.athlete, country: d.country }))
      )
      .enter()
      .append('circle')
      .attr('cx', d => xScale(eventLabels[events.indexOf(d.event)]))
      .attr('cy', d => yScale(d.rank))
      .attr('r', 4)
      .on('mouseover', (event, d) => {
        tooltip.style('opacity', 1)
          .html(`Athlete: ${d.athlete}<br>Country: ${d.country}<br>Event: ${d.event}<br>Rank: ${d.rank}`);
      })
      .on('mousemove', (event) => {
        tooltip.style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 30) + 'px');
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
      });

    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', (width + margin.left + margin.right) / 2)
      .attr('y', margin.top / 2)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text(`Final Rankings of ${selectedGender} Athletes in ${selectedStyle} Events`);

    const legend = svg.append('g')
      .attr('transform', `translate(${width + margin.left + 20}, ${margin.top})`);

    legend.selectAll('rect')
      .data(countries)
      .enter()
      .append('rect')
      .attr('x', -10)
      .attr('y', (d, i) => i * 15 - 20)
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', d => colorScale(d));

    legend.selectAll('text')
      .data(countries)
      .enter()
      .append('text')
      .attr('x', 10)
      .attr('y', (d, i) => i * 15 + 12 - 20)
      .attr('font-size', '10px')
      .text(d => d);
  }, [data, events, eventLabels, dimensions, selectedCountry]);

  return (
    <div>
      <div ref={tooltipRef} style={{
        position: 'absolute',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        padding: '8px',
        borderRadius: '4px',
        pointerEvents: 'none',
        opacity: 0
      }}></div>
      <div style={{ display: 'flex', marginBottom: '10px', marginLeft: '30px' }}>
        <label> Select Gender: </label>
        <select value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)}>
          <option value="Women">Women</option>
          <option value="Men">Men</option>
        </select>
        <label> Select Style: </label>
        <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)}>
          <option value="Freestyle">Freestyle</option>
          <option value="Butterfly">Butterfly</option>
          <option value="Backstroke">Backstroke</option>
          <option value="Breaststroke">Breaststroke</option>
        </select>
        <label> Select Country: </label>
        <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
          <option value="">All Countries</option>
          {countries.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>

      <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
    </div>
  );
};

export default BumpChart;
