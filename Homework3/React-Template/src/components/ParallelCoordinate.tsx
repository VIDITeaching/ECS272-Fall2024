import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useDebounceCallback, useResizeObserver } from 'usehooks-ts';
import { Margin, PlotProps, VehicleData } from '../types';

interface ParallelData extends VehicleData {
  profit: number;
  condition: number;
  odometer: number;
}
const ParallelCoordinates: React.FC<PlotProps> = ({ data }) => {
  const svgRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  const onResize = useDebounceCallback((size: { width: number; height: number }) => setSize(size), 200);

  useResizeObserver({ ref: svgRef, onResize });

  useEffect(() => {
    if (!data.length) return;

    const margin: Margin = { top: 100, right: 130, bottom: 50, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Clear previous SVG content
    d3.select('#parallel-coordinates-svg').selectAll('*').remove();

    // Create the SVG container
    const svg = d3.select('#parallel-coordinates-svg')
      .attr('width', size.width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define dimensions for each axis
    const dimensions = ['profit', 'condition', 'odometer'];
    const yScales = new Map<string, d3.ScaleLinear<number, number>>();

    dimensions.forEach(dim => {
      const values = data.map(d => d[dim as keyof ParallelData] as number);
      yScales.set(dim, d3.scaleLinear()
        .domain([d3.min(values) as number, d3.max(values) as number])
        .range([height, 0]));
    });

    // X Scale for positioning each dimension axis
    const xScale = d3.scalePoint()
      .domain(dimensions)
      .range([0, width]);

    // Draw lines for each vehicle
    svg.selectAll('path')
      .data(data)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', d => d.profit > 0 ? 'green' : 'red')
      .attr('opacity', 0.7)
      .attr('d', d => {
        return d3.line<string>()
          .x(dim => xScale(dim) as number)
          .y(dim => yScales.get(dim)?.(d[dim as keyof ParallelData] as number) as number)
          (dimensions as string[])!;
      });

    // Draw axes for each dimension
    dimensions.forEach(dim => {
      const axisGroup = svg.append('g')
        .attr('transform', `translate(${xScale(dim)},0)`);

      axisGroup.call(d3.axisLeft(yScales.get(dim)!));

      // Label for each axis
      axisGroup.append('text')
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('fill', 'black')
        .style('font-weight', 'bold')
        .text(dim.charAt(0).toUpperCase() + dim.slice(1));
    });
  }, [data, size]);

  return (
    <div ref={svgRef} className='chart-container'>
      <svg id="parallel-coordinates-svg" width="100%" height="100%"></svg>
    </div>
  );
};

export default ParallelCoordinates;
