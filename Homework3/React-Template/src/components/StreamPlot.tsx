import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ComponentSize, Margin, PlotProps, VehicleData } from '../types';
import { useDebounceCallback, useResizeObserver } from 'usehooks-ts';


const StreamPlot: React.FC<PlotProps> = ({ data }) => {
  const [hoveredMake, setHoveredMake] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 800, height: 600 });
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);

  useResizeObserver({ ref: svgRef, onResize });

  useEffect(() => {
    if (!data.length) return;

    const margin: Margin = { top: 100, right: 10, bottom: 50, left: 310 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Clear previous SVG content
    d3.select('#stream-svg').selectAll('*').remove();

    // Create the SVG container
    const svg = d3.select('#stream-svg')
      .attr('width', size.width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Prepare data for plotting
    const years = Array.from(new Set(data.map(d => d.year)));
    const makes = Array.from(new Set(data.map(d => d.make)));

    const dataByYearMake = years.map(year => {
      const entry: { year: number; [key: string]: number } = { year };
      makes.forEach(make => {
        entry[make] = data.find(d => d.year === year && d.make === make)?.profit || 0;
      });
      return entry;
    });

    // X Scale
    const xScale = d3.scaleLinear()
      .domain([d3.min(years) as number, d3.max(years) as number])
      .range([0, width]);

    // Y Scale based on max profit
    const yMax = d3.max(dataByYearMake, d => d3.max(makes, make => d[make])) as number;
    const yMin = d3.min(dataByYearMake, d => d3.min(makes, make => d[make])) as number;
    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([height, 0]);

    // Color scale for each make
    const colorScale = d3.scaleOrdinal<string>()
      .domain(makes)
      .range(d3.schemeCategory10);

    console.log(dataByYearMake);

    // Plot each make as a separate area
    makes.forEach(make => {
      const area = d3.area<{ year: number; [key: string]: number }>()
        .x(d => xScale(d.year))
        .y0(yScale(0))
        .y1(d => yScale(d[make]))
        .curve(d3.curveBasis);

      svg.append('path')
        .datum(dataByYearMake)
        .attr('d', area as any)
        .attr('fill', colorScale(make) as string)
        .attr('opacity', 0.6)
        .on('mouseover', function (event) {
          setHoveredMake(make);
          setHoverPosition({ x: event.pageX, y: event.pageY });
          svg.selectAll('path')
            .attr('opacity', 0.2);
          d3.select(this).attr('opacity', 0.8);
        })
        .on('mousemove', function (event) {
          setHoverPosition({ x: event.pageX, y: event.pageY });
        })
        .on('mouseout', function () {
          setHoveredMake(null);
          setHoverPosition(null);
          svg.selectAll('path')
            .attr('opacity', 0.6);
        });
    });

    // X Axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')));

    // Y Axis
    svg.append('g')
      .call(d3.axisLeft(yScale));

    // X label
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .text('Manufacturing Year');

    // Y label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 260)
      .attr('text-anchor', 'middle')
      .text('Profit');

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Vehicle Profit by Make Over Years');
  }, [data, size]);

  return (
    <div>
      {hoveredMake && hoverPosition && (
        <div style={{
          position: 'absolute',
          top: hoverPosition.y + 10,
          left: hoverPosition.x + 10,
          fontWeight: 'bold',
          fontSize: '14px',
          backgroundColor: 'white',
          padding: '5px',
          border: '1px solid black',
          pointerEvents: 'none',
        }}>
          {hoveredMake}
        </div>
      )}
      <div ref={svgRef} className='chart-container'>
        <svg id='stream-svg' width='100%' height='100%'></svg>
      </div>
    </div>
  );
};

export default StreamPlot;
