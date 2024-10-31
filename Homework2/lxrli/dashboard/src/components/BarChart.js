import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const BarChart = ({ data, xKey, yKey, title }) => {
  const svgRef = useRef();

  useEffect(() => {
    // Set dimensions and margins for the chart
    const margin = { top: 50, right: 30, bottom: 50, left: 50 },
      width = 500 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

    // Clear any previous chart before rendering new one
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG element
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set x and y scales
    const x = d3.scaleBand()
      .domain(data.map(d => d[xKey]))
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d[yKey])])
      .nice()
      .range([height, 0]);

    // Add the x-axis
    svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x));

    // Add the y-axis
    svg.append('g')
      .call(d3.axisLeft(y));

    // Add the bars
    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(d[xKey]))
      .attr('y', d => y(d[yKey]))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d[yKey]))
      .attr('fill', 'steelblue');

    // Add chart title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text(title);

  }, [data, xKey, yKey, title]);

  return <svg ref={svgRef}></svg>;
};

export default BarChart;