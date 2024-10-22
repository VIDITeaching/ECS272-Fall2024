import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const ScatterPlot = ({ data, xKey, yKey, colorKey, title }) => {
  const svgRef = useRef();

  useEffect(() => {
    const margin = { top: 50, right: 100, bottom: 50, left: 50 },
      width = 500 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

    // Clear any previous chart before rendering new one
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set x and y scales
    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d[xKey])])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d[yKey])])
      .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Add x-axis
    svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x));

    // Add y-axis
    svg.append('g')
      .call(d3.axisLeft(y));

    // Add scatter points
    svg.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => x(d[xKey]))
      .attr('cy', d => y(d[yKey]))
      .attr('r', 5)
      .attr('fill', d => color(d[colorKey]));

    // Add x-axis label
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Workday Alcohol Consumption (Dalc)');

    // Add y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Final Grade (G3)');

    // Add chart title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text(title);

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width + 20}, ${10})`);

    // Add legend title
    legend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .style('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Gender');

    // Create color legend
    const categories = Array.from(new Set(data.map(d => d[colorKey])));
    categories.forEach((category, i) => {
      legend.append('rect')
        .attr('x', 0)
        .attr('y', i * 20 + 20)
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', color(category));

      legend.append('text')
        .attr('x', 20)
        .attr('y', i * 20 + 30)
        .attr('text-anchor', 'start')
        .style('font-size', '12px')
        .text(category);
    });

  }, [data, xKey, yKey, colorKey, title]);

  return <svg ref={svgRef}></svg>;
};

export default ScatterPlot;