import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { csv } from 'd3-fetch';

const BarChart: React.FC = () => {
  const chartRef = useRef(null);

  useEffect(() => {
    csv(new URL('../../data/car_prices.csv', import.meta.url)).then(data => {
      const salesByMake = d3.rollup(
        data,
        v => v.length, 
        d => d.make.trim() === "" ? "Other" : d.make 
      );

      const salesArray = Array.from(salesByMake, ([make, count]) => ({
        make,
        count
      }));

      const threshold = 5000;

      const combinedData = salesArray.reduce(
        (acc, curr) => {
          if (curr.count >= threshold && curr.make !== "Other") {
            acc.largeMakes.push(curr);
          } else {
            acc.otherCount += curr.count; 
          }
          return acc;
        },
        { largeMakes: [], otherCount: 0 } as { largeMakes: { make: string; count: number }[]; otherCount: number }
      );

      if (combinedData.otherCount > 0) {
        combinedData.largeMakes.push({ make: 'Other', count: combinedData.otherCount });
      }

      combinedData.largeMakes.sort((a, b) => b.count - a.count);

      const width = 500;
      const height = 300;
      const margin = { top: 20, right: 30, bottom: 40, left: 40 };

      const svg = d3.select(chartRef.current)
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const x = d3.scaleBand()
        .domain(combinedData.largeMakes.map(d => d.make))
        .range([0, width - margin.left - margin.right])
        .padding(0.1);

      const y = d3.scaleLinear()
        .domain([0, d3.max(combinedData.largeMakes, d => d.count) as number])
        .range([height - margin.top - margin.bottom, 0]);

      svg.append('g')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "10px")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end"); 

      svg.append('g').call(d3.axisLeft(y));

      svg.selectAll('.bar')
        .data(combinedData.largeMakes)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.make) as number)
        .attr('y', d => y(d.count))
        .attr('width', x.bandwidth())
        .attr('height', d => height - margin.top - margin.bottom - y(d.count))
        .attr('fill', 'steelblue');
    });
  }, []);

  return <svg ref={chartRef}></svg>;
};

export default BarChart;
