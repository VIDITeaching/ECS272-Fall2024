import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

import { Bar, ComponentSize, Margin } from '../types';

interface StateSalesBar extends Bar {
  state: string;
  value: number;
}

export default function Example() {
  const [bars, setBars] = useState<StateSalesBar[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 40, right: 20, bottom: 80, left: 100 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);

  useResizeObserver({ ref: barRef, onResize });

  useEffect(() => {
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/demo.csv', d => {
          if (!d.state || !d.sellingprice) {
            return null;
          }
          return {
            state: d.state,
            sellingprice: +d.sellingprice || 0,
          };
        });

        const filteredData = csvData.filter(d => d !== null) as { state: string; sellingprice: number }[];

        const salesByState = d3.rollups(
          filteredData,
          v => v.length,
          d => d.state
        ).map(([state, salesCount]) => ({ state, value: salesCount }));

        const topNStates = salesByState.sort((a, b) => b.value - a.value).slice(0, 10);

        setBars(topNStates);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };
    dataFromCSV();
  }, []);

  useEffect(() => {
    if (isEmpty(bars)) return;
    if (size.width === 0 || size.height === 0) return;
    d3.select('#bar-svg').selectAll('*').remove();
    initChart();
  }, [bars, size]);

  function initChart() {
    let chartContainer = d3.select('#bar-svg');

    // Create the tooltip element
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('border', '1px solid #d3d3d3')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('font-size', '0.8rem');

    let states = bars.map(d => d.state);

    let xScale = d3.scaleBand()
      .range([margin.left, size.width - margin.right])
      .domain(states)
      .padding(0.2);

    let yScale = d3.scaleLinear()
      .range([size.height - margin.bottom, margin.top])
      .domain([0, d3.max(bars, d => d.value)!]);

    const xAxis = chartContainer.append('g')
      .attr('transform', `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      
      .style('text-anchor', 'end')
      .style('font-size', '0.7rem')
      .attr('dy', '0.5rem');

    const yAxis = chartContainer.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));

    chartContainer.append('g')
      .selectAll('rect')
      .data(bars)
      .join('rect')
      .attr('x', d => xScale(d.state)!)
      .attr('y', d => yScale(d.value))
      .attr('height', d => yScale(0) - yScale(d.value))
      .attr('width', xScale.bandwidth())
      .attr('fill', 'teal')
      .on('mouseover', (event, d) => {
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip.html(`<strong>${d.state}</strong><br/>Total Sales: ${d.value}`) // Show full state name and total sales
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 20) + 'px');
      })
      .on('mousemove', (event) => {
        tooltip.style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 20) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
      });

    const yLabel = chartContainer.append('g')
      .attr('transform', `translate(${margin.left / 2}, ${size.height / 2}) rotate(-90)`)
      .append('text')
      .text('Total Sales')
      .style('font-size', '.8rem');

    const xLabel = chartContainer.append('g')
      .attr('transform', `translate(${(size.width - margin.left) / 2}, ${size.height - margin.bottom + 50})`)
      .append('text')
      .text('Top 10 States')
      .style('font-size', '.8rem');
  }

  return (
    <div ref={barRef} className="chart-container">
      <svg id="bar-svg" width="100%" height="100%"></svg>
    </div>
  );
}
