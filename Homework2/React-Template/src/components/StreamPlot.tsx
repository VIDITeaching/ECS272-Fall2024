import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface VehicleData {
  year: number;
  make: string;
  sellingprice: number;
}

interface StreamPlotProps {
  data: VehicleData[];
}

const StreamPlot: React.FC<StreamPlotProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredMake, setHoveredMake] = useState<string | null>(null);

  useEffect(() => {
    const margin = { top: 50, right: 30, bottom: 150, left: 100 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create the SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Filter data to remove negative prices
    const filteredData = data.map(d => ({
      ...d,
      sellingprice: Math.max(0, d.sellingprice), // Ensure no negative selling prices
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
        row[make] = dataByMakeYear.get(year)?.get(make) || 0;
      });
      return row;
    });

    // X Scale (year) - start from min year, not 0
    const xScale = d3.scaleLinear()
      .domain(d3.extent(filteredData, d => d.year) as [number, number]) // Domain is [min year, max year]
      .range([0, width]);

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
        d3.select(this).attr('opacity', 0.8);  // Highlight the hovered stream
      })
      .on('mouseout', function () {
        setHoveredMake(null);  // Clear the hovered make name on mouseout
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
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .text('Year');

    // Add Y label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 20)
      .attr('text-anchor', 'middle')
      .text('Price (Sum of Selling Price)');

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Stream Plot of Vehicle Prices by Make Over Year');
  }, [data]);

  return (
    <div>
      {hoveredMake && (
        <div style={{ position: 'absolute', top: 20, left: 20, fontWeight: 'bold', fontSize: '16px' }}>
          {hoveredMake}
        </div>
      )}
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default StreamPlot;
