import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

interface Bar {
  category: string;
  value: number;
}

interface ComponentSize {
  width: number;
  height: number;
}

interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export default function DistributionOfFinalGrades() {
  const [bars, setBars] = useState<Bar[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 40, right: 20, bottom: 80, left: 80 }; // Increased left margin for the y-axis label
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);

  // Increase chart height for vertical expansion
  const chartHeight = 500; // Adjust this value to make the chart taller

  useResizeObserver({ ref: barRef, onResize });

  useEffect(() => {
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/student-mat.csv', d => {
          return { category: d.G3, value: +d.G3 }; // G3 is the final grade column
        });

        const gradeCounts = d3.rollups(
          csvData,
          v => v.length,
          d => d.category
        );
        
        setBars(
          gradeCounts
            .map(([category, value]) => ({ category, value }))
            .sort((a, b) => +a.category - +b.category)
        );
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };
    dataFromCSV();
  }, []);

  useEffect(() => {
    if (bars.length === 0 || size.width === 0) return;
    d3.select('#bar-svg').selectAll('*').remove();
    initChart();
  }, [bars, size]);

  function initChart() {
    const chartContainer = d3.select('#bar-svg');

    // Extend the y-axis more to avoid squeezing
    const yMax = d3.max(bars.map(d => d.value)) ?? 0;
    const yScaleMax = yMax * 1.2; // Extend 20% above the maximum value for more vertical space

    const xCategories = bars.map(d => d.category);

    const xScale = d3
      .scaleBand()
      .rangeRound([margin.left, size.width - margin.right])
      .domain(xCategories)
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .range([chartHeight - margin.bottom, margin.top]) // Adjust to the new chartHeight
      .domain([0, yScaleMax]);

    chartContainer
      .append('g')
      .attr('transform', `translate(0, ${chartHeight - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    chartContainer
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));

    const chartBars = chartContainer
      .append('g')
      .selectAll('rect')
      .data(bars)
      .join('rect')
      .attr('x', d => xScale(d.category) as number)
      .attr('y', d => yScale(d.value))
      .attr('width', xScale.bandwidth())
      .attr('height', d => Math.abs(yScale(0) - yScale(d.value)))
      .attr('fill', 'orange');

    chartContainer
      .append('g')
      .append('text')
      .attr('transform', `translate(${size.width / 2}, ${chartHeight - margin.top + 15})`)
      .attr('dy', '0.5rem')
      .style('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .text('Distribution of Final Grades (G3)');

      // X-axis label (Final Grade)
    chartContainer
    .append('g')
    .append('text')
    .attr('transform', `translate(${size.width / 2}, ${chartHeight - margin.bottom + 40})`)
    .style('text-anchor', 'middle')
    .style('font-weight', 'bold')
    .text('Final Grade');

    // Y-axis label (Number of Students)
    chartContainer
    .append('g')
    .append('text')
    .attr('transform', `rotate(-90)`)
    .attr('x', -(chartHeight / 2))
    .attr('y', margin.left - 50)
    .style('text-anchor', 'middle')
    .style('font-weight', 'bold')
    .text('Number of Students');
  }

  return (
    <div ref={barRef} className='chart-container'>
      {/* Adjusted height to be more vertical */}
      <svg id='bar-svg' width='100%' height={chartHeight}></svg>
    </div>
  );
}