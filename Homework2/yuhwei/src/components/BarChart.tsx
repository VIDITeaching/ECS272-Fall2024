import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { ComponentSize, Margin } from '../types';

export default function Example() {
  const [bars, setBars] = useState([]);
  const barRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 20, right: 150, bottom: 100, left: 100 }; 
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 20);

  useResizeObserver({ ref: barRef, onResize });

  useEffect(() => {
    // 加载CSV文件
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/student-por.csv', d => ({
          totalEdu: +d.Medu + +d.Fedu, 
          Dalc: +d.Dalc, 
          Walc: +d.Walc 
        }));
        setBars(csvData);
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
    const chartContainer = d3.select('#bar-svg');

    const groupedData = d3.rollups(
      bars,
      v => ({
        DalcPerCapita: d3.sum(v, d => d.Dalc) / v.length,
        WalcPerCapita: d3.sum(v, d => d.Walc) / v.length,
      }),
      d => {
        const totalEdu = d.totalEdu;
        if (totalEdu <= 2) return '0-2';
        if (totalEdu <= 5) return '3-5';
        if (totalEdu <= 8) return '6-8';
        return '9+';
      }
    ).map(([key, value]) => ({ key, ...value }))
     .sort((a, b) => ['0-2', '3-5', '6-8', '9+'].indexOf(a.key) - ['0-2', '3-5', '6-8', '9+'].indexOf(b.key));

    const minValue = d3.min(groupedData, d => Math.min(d.DalcPerCapita, d.WalcPerCapita));
    const maxValue = d3.max(groupedData, d => Math.max(d.DalcPerCapita, d.WalcPerCapita));

    const xScale = d3.scaleLinear()
      .domain([0, maxValue]) 
      .range([margin.left, size.width - margin.right]);

    const yScale = d3.scaleBand()
      .domain(groupedData.map(d => d.key))
      .range([size.height - margin.bottom, margin.top])
      .padding(0.4);

    chartContainer.append('g')
      .attr('transform', `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    chartContainer.append('text')
      .attr('transform', `translate(${(size.width - margin.left) / 2 + margin.left}, ${size.height - margin.bottom + 40})`)
      .style('text-anchor', 'middle')
      .text('Alcohol Consumption');

    chartContainer.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));

    chartContainer.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', margin.left - 60)
      .attr('x', -(size.height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Parental Education Levels');

    chartContainer.selectAll('.bar-dalc')
      .data(groupedData)
      .enter().append('rect')
      .attr('class', 'bar-dalc')
      .attr('x', d => xScale(0)) 
      .attr('y', d => yScale(d.key) + yScale.bandwidth() / 4)
      .attr('width', d => xScale(d.DalcPerCapita) - xScale(0)) 
      .attr('height', yScale.bandwidth() / 2)
      .attr('fill', '#98abc5');

    chartContainer.selectAll('.bar-walc')
      .data(groupedData)
      .enter().append('rect')
      .attr('class', 'bar-walc')
      .attr('x', d => xScale(0)) 
      .attr('y', d => yScale(d.key) - yScale.bandwidth() / 4)
      .attr('width', d => xScale(d.WalcPerCapita) - xScale(0)) 
      .attr('height', yScale.bandwidth() / 2)
      .attr('fill', '#8a89a6');

    chartContainer.append('text')
      .attr('x', size.width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Parental Education vs Alcohol Consumption');

    const legend = chartContainer.append('g')
      .attr('transform', `translate(${size.width - 100}, 20)`);

    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', '#98abc5');
    legend.append('text')
      .attr('x', 20)
      .attr('y', 10)
      .text('Dalc/p');

    legend.append('rect')
      .attr('x', 0)
      .attr('y', 20)
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', '#8a89a6');
    legend.append('text')
      .attr('x', 20)
      .attr('y', 30)
      .text('Walc/p');
  }

  return (
    <>
      <div ref={barRef} className='chart-container'>
        <svg id='bar-svg' width='100%' height='300'></svg>
      </div>
    </>
  );
} 