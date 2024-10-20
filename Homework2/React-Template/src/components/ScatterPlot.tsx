import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface VehicleData {
  year: number;
  sellingprice: number;
  mmr: number;
}

interface ScatterPlotProps {
  data: VehicleData[];
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const margin = { top: 50, right: 30, bottom: 50, left: 100 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create the SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Parse the data
    const parsedData = data.map(d => ({
      year: d.year,
      profit: d.sellingprice - d.mmr,
    }));

    // X Scale
    const xScale = d3.scaleLinear()
      .domain(d3.extent(parsedData, d => d.year) as [number, number])
      .range([0, width]);

    // Y Scale
    const yScale = d3.scaleLinear()
      .domain([d3.min(parsedData, d => d.profit) as number, d3.max(parsedData, d => d.profit) as number])
      .range([height, 0]);

    // Add the scatter plot points
    svg.selectAll('circle')
      .data(parsedData)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d.profit))
      .attr('r', 2)
      .attr('fill', 'steelblue');

    // Add X Axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')));

    // Add Y Axis
    svg.append('g')
      .call(d3.axisLeft(yScale));

    // Add X label
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .text('Year');

    // Add Y label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 40)
      .attr('text-anchor', 'middle')
      .text('Profit (Selling Price - MMR)');

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Profit over Year of Vehicle');
  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default ScatterPlot;
