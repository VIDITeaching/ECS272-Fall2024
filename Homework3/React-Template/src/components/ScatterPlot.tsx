import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ComponentSize, Margin, PlotProps, VehicleData } from '../types';
import { useDebounceCallback, useResizeObserver } from 'usehooks-ts';

const ScatterPlot: React.FC<PlotProps> = ({ data }) => {
  const [hoveredCar, setHoveredCar] = useState<VehicleData | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);

  useResizeObserver({ ref: svgRef, onResize });

  useEffect(() => {
    const margin: Margin = { top: 50, right: 30, bottom: 50, left: 100 };
    const width = size.width - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous SVG content
    d3.select('#scatter-svg').selectAll('*').remove();

    // Create the SVG container
    const svg = d3.select('#scatter-svg')
      .attr('width', size.width)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year) as [number, number])
      .range([0, width]);

    // Y Scale
    const yScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.profit) as number, d3.max(data, d => d.profit) as number])
      .range([height, 0]);

    // Add the scatter plot points with hover functionality
    svg.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d.profit))
      .attr('r', 3)
      .attr('fill', d => d.profit > 0 ? 'green' : 'red')
      .on('mouseover', (event, d) => {
        setHoveredCar(d);
        setHoverPosition({ x: event.pageX, y: event.pageY });
      })
      .on('mousemove', (event) => {
        setHoverPosition({ x: event.pageX, y: event.pageY });
      })
      .on('mouseout', () => {
        setHoveredCar(null);
        setHoverPosition(null);
      });

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
      .text('Profit Over the Manufacturing Year of Vehicle');
  }, [data, size]);

  return (
    <>
      <div ref={svgRef} className="chart-container">
        <svg id="scatter-svg" width="100%" height="100%"></svg>
        {hoveredCar && hoverPosition && (
          <div
            className="tooltip"
            style={{
              position: 'absolute',
              left: hoverPosition.x + 10,
              top: hoverPosition.y - 28,
              backgroundColor: 'white',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              pointerEvents: 'none',
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            <strong>{hoveredCar.make}</strong><br />
            Year: {hoveredCar.year}<br />
            Profit: ${hoveredCar.profit.toFixed(2)}
          </div>
        )}
      </div>
    </>
  );
};

export default ScatterPlot;
