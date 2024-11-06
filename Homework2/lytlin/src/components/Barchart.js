import React from 'react';
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

export default function Barchart() {
  const [bars, setBars] = useState([]);
  const barRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const margin = { top: 100, right: 200, bottom: 150, left: 100 };
  const onResize = useDebounceCallback((size) => setSize(size), 200);

  useResizeObserver({ ref: barRef, onResize });

  useEffect(() => {
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('/Student Mental health.csv', d => {
          return {
            gender: d['Choose your gender'],
            depression: d['Do you have Depression?'] === 'Yes' ? 1 : 0,
            anxiety: d['Do you have Anxiety?'] === 'Yes' ? 1 : 0,
            panicAttack: d['Do you have Panic attack?'] === 'Yes' ? 1 : 0,
          };
        });

        // Aggregating data by gender and condition to count the number of students
        const aggregatedData = [
          { gender: 'Male', condition: 'Depression', count: d3.sum(csvData.filter(d => d.gender === 'Male'), d => d.depression) },
          { gender: 'Female', condition: 'Depression', count: d3.sum(csvData.filter(d => d.gender === 'Female'), d => d.depression) },
          { gender: 'Male', condition: 'Anxiety', count: d3.sum(csvData.filter(d => d.gender === 'Male'), d => d.anxiety) },
          { gender: 'Female', condition: 'Anxiety', count: d3.sum(csvData.filter(d => d.gender === 'Female'), d => d.anxiety) },
          { gender: 'Male', condition: 'Panic Attack', count: d3.sum(csvData.filter(d => d.gender === 'Male'), d => d.panicAttack) },
          { gender: 'Female', condition: 'Panic Attack', count: d3.sum(csvData.filter(d => d.gender === 'Female'), d => d.panicAttack) },
        ];
        setBars(aggregatedData);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };
    dataFromCSV();
  }, []);

  useEffect(() => {
    if (bars.length === 0) return;
    if (size.width === 0 || size.height === 0) return;
    d3.select('#bar-svg').selectAll('*').remove();
    initChart();
  }, [bars, size]);

  function initChart() {
    const chartContainer = d3.select('#bar-svg');

    const yMax = d3.max(bars, d => d.count);
    const xCategories = bars.map(d => `${d.gender} - ${d.condition}`);

    const xScale = d3.scaleBand()
      .rangeRound([margin.left, size.width - margin.right])
      .domain(xCategories)
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .range([size.height - margin.bottom, margin.top])
      .domain([0, yMax]);

    // Draw X axis
    chartContainer.append('g')
      .attr('transform', `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Draw Y axis
    chartContainer.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));

    // Draw bars
    chartContainer.append('g')
      .selectAll('rect')
      .data(bars)
      .join('rect')
      .attr('x', d => xScale(`${d.gender} - ${d.condition}`))
      .attr('y', d => yScale(d.count))
      .attr('width', xScale.bandwidth())
      .attr('height', d => yScale(0) - yScale(d.count))
      .attr('fill', d => {
        if (d.condition === 'Depression') return 'teal';
        if (d.condition === 'Anxiety') return 'orange';
        if (d.condition === 'Panic Attack') return 'red';
      });

    // Add labels to bars
    chartContainer.append('g')
      .selectAll('.bar-label')
      .data(bars)
      .join('text')
      .attr('class', 'bar-label')
      .attr('x', d => xScale(`${d.gender} - ${d.condition}`) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.count) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', 'black')
      .text(d => d.count);

    chartContainer.append('text')
      .attr('x', size.width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .style('font-size', '1.4rem')
      .text('Distribution of Mental Health Conditions by Gender among Students');

    chartContainer.append('text')
      .attr('transform', `translate(${margin.left / 2}, ${size.height / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .style('font-size', '1.1rem')
      .text('Number of Students');

    chartContainer.append('text')
      .attr('x', size.width / 2)
      .attr('y', size.height - margin.bottom / 3)
      .attr('text-anchor', 'middle')
      .style('font-size', '1.1rem')
      .text('Mental Health Conditions by Gender');

    // Draw Legend 
    const legendData = [
      { condition: 'Depression', color: 'teal' },
      { condition: 'Anxiety', color: 'orange' },
      { condition: 'Panic Attack', color: 'red' },
    ];

    const legend = chartContainer.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${size.width - margin.right + 40}, ${margin.top})`);

    legend.selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`)
      .each(function (d) {
        const legendItem = d3.select(this);

        // Draw legend color box
        legendItem.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', d.color);

        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 10)
          .text(d.condition)
          .style('font-size', '14px')
          .attr('alignment-baseline', 'middle');
      });
  }

  return (
    <>
      <div ref={barRef} className='chart-container' style={{ height: '600px' }}>
        <svg id='bar-svg' width='100%' height='100%'></svg>
      </div>
    </>
  );
}
