import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useFilterContext } from '../stores/FilterContext';
import { loadCarData } from '../stores/dataLoader';

interface BarChartProps {
  dataFilePath: string;
}

const BarChart: React.FC<BarChartProps> = ({ dataFilePath }) => {
  const { selectedMake, selectedBodyType, selectedState } = useFilterContext();
  const [salesData, setSalesData] = useState<{ model: string; make: string; body: string; count: number; avgPrice: number }[]>([]);

  useEffect(() => {
    loadCarData(dataFilePath).then((data) => {
      const filteredData = data.filter((row) =>
        (selectedMake === 'ALL' || row.make === selectedMake) &&
        (selectedBodyType === 'ALL' || row.body === selectedBodyType) &&
        (selectedState === 'ALL' || row.state === selectedState)
      );

      const salesDataMap = d3.rollups(
        filteredData,
        (v) => ({
          count: v.length,
          avgPrice: d3.mean(v, (d) => d.sellingprice) ?? 0,
          make: v[0].make,
          body: v[0].body,
        }),
        (d) => d.model
      );

      const sortedData = salesDataMap
        .map(([model, { count, avgPrice, make, body }]) => ({
          model,
          make,
          body,
          count,
          avgPrice,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setSalesData(sortedData);
    });
  }, [dataFilePath, selectedMake, selectedBodyType, selectedState]);

  useEffect(() => {
    const maxLabelLength = d3.max(salesData, (d) => d.model.length) || 0;
    const margin = {
      top: 40,
      right: 30,
      bottom: Math.min(100, 60 + maxLabelLength * 6), // Adjusted by label length, max limit set
      left: 80,
    };

    console.log(20 + maxLabelLength * 5);

    const width = 500;
    const height = 400 + margin.bottom;

    const svg = d3.select('#bar-chart').attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const x = d3
      .scaleBand()
      .domain(salesData.map((d) => d.model))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(salesData, (d) => d.count) ?? 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .on('mouseover', (event, d) => {
        const modelData = salesData.find((data) => data.model === d);
        if (modelData) {
          tooltip
            .style('opacity', 1)
            .html(`Make: ${modelData.make}<br>Model: ${modelData.model}<br>Body Type: ${modelData.body}<br>Sales: ${modelData.count}<br>Avg Price: $${modelData.avgPrice.toFixed(2)}`);
        }
      })
      .on('mousemove', (event) => {
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 30}px`);
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
      });

    svg.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    const title = `Top ${selectedMake !== 'ALL' ? selectedMake : ''} ${selectedBodyType !== 'ALL' ? selectedBodyType : ''} Models by Sales Count${selectedState !== 'ALL' ? ` in ${selectedState}` : ''} (Max 10)`;

    svg.append('text')
      .attr('class', 'chart-title')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .style('font-size', title.length > 36 ? '12px' : '16px')
      .style('font-weight', 'bold')
      .text(title);

    svg.append('text')
      .attr('class', 'x-label')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', height - 30)
      .style('font-size', '14px')
      .text('Car Models');

    console.log((20 + maxLabelLength * 5) / 4);

    svg.append('text')
      .attr('class', 'y-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', 20)
      .style('font-size', '14px')
      .text('Number of Sales');

    const tooltip = d3.select('#tooltip');
    if (tooltip.empty()) {
      d3.select('body').append('div')
        .attr('id', 'tooltip')
        .style('position', 'absolute')
        .style('padding', '8px')
        .style('background', '#333')
        .style('color', '#fff')
        .style('border-radius', '4px')
        .style('pointer-events', 'none')
        .style('opacity', 0);
    }

    svg.selectAll('.bar')
      .data(salesData, (d) => d.model)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.model)!)
      .attr('width', x.bandwidth())
      .attr('y', height - margin.bottom)
      .attr('height', 0)
      .attr('fill', 'steelblue')
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(`Make: ${d.make}<br>Model: ${d.model}<br>Body Type: ${d.body}<br>Sales: ${d.count}<br>Avg Price: $${d.avgPrice.toFixed(2)}`);
      })
      .on('mousemove', (event) => {
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 30}px`);
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
      })
      .transition()
      .duration(800)
      .attr('y', (d) => y(d.count))
      .attr('height', (d) => y(0) - y(d.count));
  }, [salesData]);

  return (
    <div>
      <svg id="bar-chart"></svg>
    </div>
  );
};

export default BarChart;
