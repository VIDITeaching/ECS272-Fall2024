import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';

interface StudentData {
  Dalc: number;
  Walc: number;
  studytime: number;
  G3: number;
}

export default function PolyChart() {
  const [data, setData] = useState<StudentData[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);

  // Define the type for the dimension names
  const dimensions: Array<keyof StudentData> = ['Dalc', 'Walc', 'studytime', 'G3'];

  useEffect(() => {
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/student-mat.csv', (d) => ({
          Dalc: +d.Dalc,        // Daily alcohol consumption
          Walc: +d.Walc,        // Weekend alcohol consumption
          studytime: +d.studytime,  // Study time
          G3: +d.G3            // Final grade
        }));

        setData(csvData);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };
    dataFromCSV();
  }, []);

  useEffect(() => {
    if (data.length === 0) return;
    drawParallelCoordinates();
  }, [data]);

  const drawParallelCoordinates = () => {
    const width = 800;
    const height = 400;
    const margin = { top: 30, right: 50, bottom: 50, left: 50 }; // Increased bottom margin for x-axis labels

    // Remove existing SVG to redraw chart
    d3.select('#parallel-coordinates-chart').selectAll('*').remove();

    const svg = d3
      .select('#parallel-coordinates-chart')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scale for each dimension
    const yScales: Record<keyof StudentData, d3.ScaleLinear<number, number>> = {
      Dalc: d3.scaleLinear().domain([1, 5]).range([height - margin.bottom, margin.top]),
      Walc: d3.scaleLinear().domain([1, 5]).range([height - margin.bottom, margin.top]),
      studytime: d3.scaleLinear().domain([1, 4]).range([height - margin.bottom, margin.top]),
      G3: d3.scaleLinear().domain([0, 20]).range([height - margin.bottom, margin.top]),
    };

    const xScale = d3.scalePoint()
      .domain(dimensions)
      .range([0, width - margin.right])
      .padding(1);

    // Line function to draw paths
    const line = d3.line<{ [key: string]: number }>()
      .x((_, i) => xScale(dimensions[i]) as number)
      .y((d, i) => yScales[dimensions[i]](d[dimensions[i]]) as number);

    // Draw axes for each dimension
    dimensions.forEach((dim) => {
      svg.append('g')
        .attr('transform', `translate(${xScale(dim)},0)`)
        .call(d3.axisLeft(yScales[dim]))
        .append('text')
        .attr('y', -9)
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text(dim);
    });

    // Draw x-axis labels for each dimension (attributes)
    svg.selectAll(".axis-label")
      .data(dimensions)
      .enter()
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", (d) => `translate(${xScale(d)}, ${height - margin.bottom + 20})`)
      .style("text-anchor", "middle")
      .text(d => d)
      .style("font-size", "12px");

    // Draw y-axis label (common for all)
    svg.append("text")
      .attr("class", "y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 10)
      .attr("x", -(height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Values")
      .style("font-size", "12px");

    // Draw lines for each student
    svg.selectAll('path')
      .data(data)
      .enter()
      .append('path')
      .attr('d', d => line(dimensions.map(dim => ({ [dim]: d[dim] }))))
      .style('fill', 'none')
      .style('stroke', (d, i) => d3.schemeCategory10[i % 10])
      .style('stroke-width', 1.5)
      .style('opacity', 0.6);
  };

  return (
    <div ref={chartRef} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <svg id='parallel-coordinates-chart'></svg>
    </div>
  );
}