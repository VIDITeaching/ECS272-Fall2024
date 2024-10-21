import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ComponentSize, Margin, VehicleData } from '../types';
import { useDebounceCallback, useResizeObserver } from 'usehooks-ts';

interface StreamData extends VehicleData {
  make: string;
}

const StreamPlot: React.FC = () => {
  const [hoveredMake, setHoveredMake] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<StreamData[]>([]);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)

  useResizeObserver({ ref: svgRef, onResize });


  useEffect(() => {
    const loadData = async () => {
      try {
        const csvData = await d3.csv('/data/car_prices.csv', d => ({
          make: d['make'],
          year: +d['year'],
          sellingprice: +d['sellingprice']
        }));

        const filteredData = csvData.filter(
          d =>
            d.make != '' &&
            d.year > 0 &&
            d.sellingprice > 0
        ) as StreamData[];

        setData(filteredData);
      } catch (error) {
        console.error('Error loading CSV file:', error);
      }
    };

    loadData();
  }, []);



  useEffect(() => {
    const margin: Margin = { top: 100, right: 10, bottom: 50, left: 220 };
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

    // Filter data to remove negative prices and clamp selling prices to 0
    const filteredData = data.map(d => ({
      ...d,
      sellingprice: Math.max(0, d.sellingprice),
    }));

    // Prepare the data: group by year and make, summing the selling prices
    const dataByMakeYear = d3.rollup(
      filteredData,
      v => d3.sum(v, d => d.sellingprice),
      d => d.year,
      d => d.make
    );

    // Convert the nested map into an array format suitable for stack layout
    const years = Array.from(new Set(filteredData.map(d => d.year)));
    const makes = Array.from(new Set(filteredData.map(d => d.make)));

    const stackedData = years.map(year => {
      const row: Record<string, number> = { year: +year };  // Convert year to number
      makes.forEach(make => {
        if (make != '') 
          row[make] = dataByMakeYear.get(year)?.get(make) || 0;
      });
      return row;
    });

    // Find the first year where there is some selling price > 0
    const minYearWithPrice = d3.min(
      stackedData.filter(d => d3.sum(makes, make => d[make]) > 0),
      d => d.year
    );

    // X Scale (year) - start from the first year that has a selling price > 0
    const xScale = d3.scaleLinear()
      .domain([minYearWithPrice || 0, d3.max(filteredData, d => d.year) as number])  // Adjusted to start with year with prices > 0
      .range([0, size.width]);

    // Y Scale (stacked price) - ensure non-negative values using stackOffsetNone
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(stackedData, d => d3.sum(makes, make => d[make])) as number])  // Domain based on stacked price
      .range([height, 0]);

    // Color scale for each make
    const colorScale = d3.scaleOrdinal()
      .domain(makes)
      .range(d3.schemeCategory10);

    // Stack generator - use stackOffsetNone to prevent symmetrical layout
    const stack = d3.stack()
      .keys(makes)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);  // Use 'None' to avoid negative stacking

    const series = stack(stackedData);

    // Area generator for the stream plot
    const area = d3.area<[number, number]>()
      .x((d, i) => xScale(stackedData[i].year))  // Using stackedData[i].year to get the correct year
      .y0(d => yScale(d[0]))  // d[0] is the lower bound of the stacked area
      .y1(d => yScale(d[1]))  // d[1] is the upper bound of the stacked area
      .curve(d3.curveBasis);  // Optional smoothing for a nicer visual

    // Add the streams to the plot with hover events
    svg.selectAll('path')
      .data(series)
      .enter()
      .append('path')
      .attr('d', area as any)  // Cast area as 'any' to avoid TypeScript issues
      .attr('fill', d => colorScale(d.key) as string)
      .attr('stroke', 'none')
      .on('mouseover', function (event, d) {
        setHoveredMake(d.key);  // Set hovered make name on mouseover
        setHoverPosition({ x: event.pageX, y: event.pageY });  // Set hover position
        d3.select(this).attr('opacity', 0.8);  // Highlight the hovered stream
      })
      .on('mousemove', function (event) {
        // Update position of hover box on mouse move
        setHoverPosition({ x: event.pageX, y: event.pageY });
      })
      .on('mouseout', function () {
        setHoveredMake(null);  // Clear the hovered make name on mouseout
        setHoverPosition(null);  // Clear hover position
        d3.select(this).attr('opacity', 1);  // Reset opacity
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
      .attr('x', size.width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .text('Year');

    // Add Y label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 140)
      .attr('text-anchor', 'middle')
      .text('Price (Sum of Selling Price)');

    // Add title
    svg.append('text')
      .attr('x', size.width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Stream Plot of Vehicle Prices by Make Over the Manu. Year');
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
