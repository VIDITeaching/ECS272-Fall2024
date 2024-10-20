import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface FinancialData {
  gender: string;
  education: string;
  employment: string;
}

const ParallelCoordinatesPlot: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const width = 900;
  const height = 500;

  // Prepare the data
  const data: FinancialData[] = [
    { gender: 'Male', education: 'Bachelor', employment: 'Employed' },
    { gender: 'Female', education: 'PhD', employment: 'Unemployed' },
    { gender: 'Non-binary', education: 'Master', employment: 'Self-employed' },
    // Add more data as needed
  ];

  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const dimensions = ['gender', 'education', 'employment'];

    // Define the scale for each axis (based on unique values in the data)
    const yScale = {
      gender: d3.scalePoint<string>()
        .domain(data.map(d => d.gender))
        .range([0, height - 50]),

      education: d3.scalePoint<string>()
        .domain(data.map(d => d.education))
        .range([0, height - 50]),

      employment: d3.scalePoint<string>()
        .domain(data.map(d => d.employment))
        .range([0, height - 50]),
    };

    const xScale = d3.scalePoint()
      .domain(dimensions)
      .range([50, width - 50]);

    // Create the lines for each individual
    const line = d3.line<FinancialData>()
      .x((d, i) => xScale(dimensions[i])!)
      .y(d => yScale[dimensions[i] as keyof typeof yScale](d[dimensions[i] as keyof FinancialData])!);

    // Create the path for each individual
    svg.selectAll('path')
      .data(data)
      .enter()
      .append('path')
      .attr('d', d => line(dimensions.map(dim => ({ ...d, value: d[dim as keyof FinancialData] }))))
      .style('fill', 'none')
      .style('stroke', '#69b3a2')
      .style('opacity', 0.5);

    // Add the axes for each dimension
    dimensions.forEach(dim => {
      svg.append('g')
        .attr('transform', `translate(${xScale(dim)}, 0)`)
        .call(d3.axisLeft(yScale[dim as keyof typeof yScale]));
    });
  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default ParallelCoordinatesPlot;
