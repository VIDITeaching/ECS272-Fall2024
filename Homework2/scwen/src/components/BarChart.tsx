import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { Margin, ComponentSize } from '../types';

const BarChart: React.FC = () => {
  const chartRef = useRef(null);
  const [bars, setBars] = useState<any[]>([]);
  const [size, setSize] = useState<ComponentSize>({ width: 800, height: 500 });

  const margin: Margin = { top: 50, right: 30, bottom: 100, left: 60 };

  useEffect(() => {
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/car_prices.csv', d => {
          const make = d.make.trim();
          return make ? { make: make.toUpperCase() } : null;
        });

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

    d3.select(chartRef.current).selectAll('*').remove();
    initChart();
  }, [bars, size]);

  const initChart = () => {
    const salesByMake = d3.rollup(
      bars,
      v => v.length,
      d => d.make
    );

    const salesArray = Array.from(salesByMake, ([make, count]) => ({
      make,
      count
    }));

    const filteredData = salesArray.filter(d => d.count >= 5000);

    filteredData.sort((a, b) => b.count - a.count);

    const svg = d3.select(chartRef.current)
      .attr('width', size.width)
      .attr('height', size.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(filteredData.map(d => d.make))
      .range([0, size.width - margin.left - margin.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d.count) as number])
      .range([size.height - margin.top - margin.bottom, 0]);

    svg.append('g')
      .attr('transform', `translate(0,${size.height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", "10px")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append('g').call(d3.axisLeft(y));

    svg.selectAll('.bar')
      .data(filteredData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.make) as number)
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => size.height - margin.top - margin.bottom - y(d.count))
      .attr('fill', 'steelblue');

    svg.append("text")
      .attr("x", (size.width - margin.left - margin.right) / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "22px")
      .style("font-weight", "bold")
      .text("Total Car Sales Amount by Make (Sales Amount \u{2265}5000)");

    svg.append("text")
      .attr("x", (size.width - margin.left - margin.right) / 2)
      .attr("y", size.height - margin.top - margin.bottom + 70)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Car Make");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(size.height - margin.top - margin.bottom) / 2)
      .attr("y", -margin.left + 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Number of Sales");
  };

  return <svg ref={chartRef}></svg>;
};

export default BarChart;
