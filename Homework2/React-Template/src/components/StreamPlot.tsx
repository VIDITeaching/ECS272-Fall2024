import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    const margin = { top: 50, right: 30, bottom: 50, left: 60 };
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

    // Prepare the data: group by year and make, summing the selling prices
    const dataByMakeYear = d3.rollup(
      data,
      v => d3.sum(v, d => d.sellingprice),
      d => d.year,
      d => d.make
    );

    // Convert the nested map into an array format suitable for stack layout
    const years = Array.from(new Set(data.map(d => d.year)));
    const makes = Array.from(new Set(data.map(d => d.make)));

    // Ensure year is a number
    const stackedData = years.map(year => {
      const row: Record<string, number> = { year: +year };  // Convert year to number
      makes.forEach(make => {
        row[make] = dataByMakeYear.get(year)?.get(make) || 0;
      });
      return row;
    });

    // X Scale (year)
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year) as [number, number]) // Domain is [min year, max year]
      .range([0, width]);

    // Y Scale (stacked price)
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(stackedData, d => d3.sum(makes, make => d[make])) as number])  // Domain based on stacked price
      .range([height, 0]);

    // Color scale for each make
    const colorScale = d3.scaleOrdinal()
      .domain(makes)
      .range(d3.schemeCategory10);

    // Stack generator
    const stack = d3.stack()
      .keys(makes)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetSilhouette);

    const series = stack(stackedData);

    // Area generator for the stream plot
    const area = d3.area<[number, number]>()
      .x((d, i) => xScale(stackedData[i].year))  // Using stackedData[i].year to get the correct year
      .y0(d => yScale(d[0]))  // d[0] is the lower bound of the stacked area
      .y1(d => yScale(d[1]))  // d[1] is the upper bound of the stacked area
      .curve(d3.curveBasis);  // Optional smoothing for a nicer visual

    // Add the streams to the plot
    svg.selectAll('path')
      .data(series)
      .enter()
      .append('path')
      .attr('d', area as any)  // Cast area as 'any' to avoid TypeScript issues
      .attr('fill', d => colorScale(d.key) as string)
      .attr('stroke', 'none');

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
      .text('Stream Plot of Price for Each Make Over Year');
  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default StreamPlot;
