import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { ComponentSize, Margin } from '../types';

export default function BubbleChart() {
  const [data, setData] = useState([]);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 10, right: 50, bottom: 50, left: 150 };

  const calculateHeight = (width: number) => width * 0.6;

  const onResize = useDebounceCallback(() => {
    const parentElement = bubbleRef.current?.parentElement;
    if (parentElement) {
      const newWidth = parentElement.clientWidth;
      const newHeight = calculateHeight(newWidth);
      setSize({ width: newWidth, height: newHeight });
    }
  }, 200);

  useResizeObserver({ ref: bubbleRef, onResize });

  useEffect(() => {
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/student-por.csv', d => ({
          Medu: +d.Medu,
          Fedu: +d.Fedu,
          G3: +d.G3,
        }));

        const groupedData = d3.rollups(
          csvData,
          (v) => d3.mean(v, (d) => d.G3),
          (d) => d.Medu,
          (d) => d.Fedu
        ).map(([Medu, values]) => ({
          Medu,
          values: values.map(([Fedu, avgG3]) => ({ Fedu, avgG3 })),
        }));

        const flattenedData = groupedData.flatMap((group) =>
          group.values.map((v) => ({ Medu: group.Medu, Fedu: v.Fedu, avgG3: v.avgG3 }))
        );

        setData(flattenedData);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };
    dataFromCSV();
  }, []);

  useEffect(() => {
    if (isEmpty(data)) {
      console.log('Data is empty or still loading.');
      return;
    }
    if (size.width === 0 || size.height === 0) {
      console.log('Chart size not ready yet.');
      return;
    }
    d3.select('#bubble-svg').selectAll('*').remove();
    initChart();
  }, [data, size]);

  function initChart() {
    const svg = d3.select('#bubble-svg')
      .attr('viewBox', `0 0 ${size.width} ${size.height}`)
      .attr('preserveAspectRatio', 'xMinYMin meet');

    const xScale = d3.scaleLinear()
      .domain([d3.min(data, (d) => d.Medu) - 0.5, d3.max(data, (d) => d.Medu) + 0.5])
      .range([margin.left, size.width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([d3.min(data, (d) => d.Fedu) - 0.5, d3.max(data, (d) => d.Fedu) + 0.5])
      .range([size.height - margin.bottom, margin.top]);

    const rScale = d3.scaleSqrt()
      .domain([d3.min(data, (d) => d.avgG3), d3.max(data, (d) => d.avgG3)])
      .range([5, 20]);

    svg.append('g')
      .attr('transform', `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5));

    svg.append('text')
      .attr('x', size.width / 2)
      .attr('y', size.height - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .text('Mother Education Level');

    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale).ticks(5));

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(size.height / 2))
      .attr('y', 120)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .text('Father Education Level');

    svg.selectAll('.bubble')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'bubble')
      .attr('cx', (d) => xScale(d.Medu))
      .attr('cy', (d) => yScale(d.Fedu))
      .attr('r', (d) => rScale(d.avgG3))
      .attr('fill', '#69b3a2')
      .attr('opacity', 0.7);

    const legendPadding = 10;
    const legendWidth = 80; // Width for legend box, adjust as necessary
    const legendHeight = 80; // Height for legend box, adjust as necessary
    const maxLegendRadius = Math.min(20, size.width * 0.05); // Dynamically adjust circle radius

    // Adjust legend position to avoid overlap with the chart
    const legendX = size.width - legendWidth - margin.right; // Shift to the right corner
    const legendY = margin.top; // Top position for legend

    const legend = svg.append('g')
      .attr('transform', `translate(${legendX}, ${legendY})`);

    const legendData = [d3.min(data, (d) => d.avgG3), d3.max(data, (d) => d.avgG3)];
    
    legend.selectAll('.legend-bubble')
      .data(legendData)
      .enter()
      .append('circle')
      .attr('cx', 40)
      .attr('cy', (d, i) => 30 + i * 30)
      .attr('r', (d) => Math.min(rScale(d), maxLegendRadius)) // Cap the circle size to avoid overflow
      .attr('fill', 'orange')
      .attr('opacity', 0.7);

    legend.selectAll('.legend-text')
      .data(legendData)
      .enter()
      .append('text')
      .attr('x', 60)
      .attr('y', (d, i) => 35 + i * 30)
      .style('font-size', '13px') // Adjust font size
      .text((d) => `${Math.floor(d)}`)
      .each(function () {
        const bbox = this.getBBox();
        if (bbox.width + 50 > legendWidth) {
          d3.select(this).attr('x', legendWidth - bbox.width - 10); // Adjust text to fit in legend box
        }
      });

  }

  return (
    <>
      <div ref={bubbleRef} style={{ width: '100%', height: '100%' }}>
        <svg id="bubble-svg" width="100%" height="500"></svg>
      </div>
    </>
  );
}
