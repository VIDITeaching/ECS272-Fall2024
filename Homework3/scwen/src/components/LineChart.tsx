import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useFilterContext } from '../stores/FilterContext';
import { loadCarData } from '../stores/dataLoader';

interface LineChartProps {
  dataFilePath: string;
}

const LineChart: React.FC<LineChartProps> = ({ dataFilePath }) => {
  const { selectedMake, selectedBodyType, selectedState } = useFilterContext();
  const [monthlyData, setMonthlyData] = useState<{ month: string; avgPrice: number; salesCount: number; stdDev: number }[]>([]);

  useEffect(() => {
    loadCarData(dataFilePath).then((data) => {
      const filteredData = data.filter((row) =>
        (selectedMake === 'ALL' || row.make === selectedMake) &&
        (selectedBodyType === 'ALL' || row.body === selectedBodyType) &&
        (selectedState === 'ALL' || row.state === selectedState)
      );

      const monthlyStats = d3.rollups(
        filteredData,
        (v) => {
          const avgPrice = d3.mean(v, (d) => d.sellingprice) ?? 0;
          const salesCount = v.length;
          const stdDev = d3.deviation(v, (d) => d.sellingprice) ?? 0;
          return { avgPrice, salesCount, stdDev };
        },
        (d) => d.saledate.slice(0, 7)
      );

      const sortedData = monthlyStats
        .map(([month, { avgPrice, salesCount, stdDev }]) => ({ month, avgPrice, salesCount, stdDev }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const filledData = fillMissingMonths(sortedData);

      setMonthlyData(filledData);
    });
  }, [dataFilePath, selectedMake, selectedBodyType, selectedState]);

  const fillMissingMonths = (data: { month: string; avgPrice: number; salesCount: number; stdDev: number }[]) => {
    if (data.length === 0) return [];

    const startDate = d3.timeMonth.floor(new Date(data[0].month + '-02'));
    const endDate = d3.timeMonth.floor(new Date(data[data.length - 1].month + '-01'));
    const allMonths = d3.timeMonths(startDate, d3.timeMonth.offset(endDate, 1)).map(d3.timeFormat('%Y-%m'));

    const monthMap = new Map(data.map((d) => [d.month, d]));

    return allMonths.map((month) => {
      if (monthMap.has(month)) {
        return monthMap.get(month)!;
      }
      return { month, avgPrice: 0, salesCount: 0, stdDev: 0 };
    });
  };

  useEffect(() => {
    const width = 500;
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 70, left: 70 };

    const svg = d3.select('#line-chart').attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const x = d3.scaleBand()
      .domain(monthlyData.map((d) => d.month))
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(monthlyData, (d) => d.avgPrice) ?? 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    svg.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6));

    svg.append('text')
      .attr('class', 'x-label')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .text('Month');

    svg.append('text')
      .attr('class', 'y-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', 20)
      .text('Average Sale Price');


    let title = 'Monthly Average Sale Price Trend';
    if (selectedMake === 'ALL' && selectedBodyType === 'ALL'){
      title = 'Monthly Average Sale Price Trend of All Cars';
    }
    if (selectedMake === 'ALL' && selectedBodyType !== 'ALL') {
      title = `Monthly Average Sale Price Trend of All ${selectedBodyType}`;
    }
    else if (selectedMake !== 'ALL' && selectedBodyType === 'ALL') {
      title = `Monthly Average Sale Price Trend of ${selectedMake} Cars`;
    }
    else if (selectedMake !== 'ALL' && selectedBodyType !== 'ALL') {
      title = `Monthly Average Sale Price Trend of ${selectedMake} ${selectedBodyType}`;
    }
    if (selectedState !== 'ALL') title += ` in ${selectedState}`;

    console.log(title.length)

    svg.append('text')
      .attr('class', 'chart-title')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .style('font-size', title.length > 40 ?'12px': '16px')
      .style('font-weight', 'bold')
      .text(title);

    const line = d3.line<{ month: string; avgPrice: number }>()
      .x((d) => x(d.month)! + x.bandwidth() / 2)
      .y((d) => y(d.avgPrice));

    svg.append('path')
      .datum(monthlyData)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('d', line)
      .attr('stroke-dasharray', function() {
        const length = this.getTotalLength();
        return `${length} ${length}`;
      })
      .attr('stroke-dashoffset', function() {
        return this.getTotalLength();
      })
      .transition()
      .duration(1000)
      .attr('stroke-dashoffset', 0);

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

    svg.selectAll('.circle')
      .data(monthlyData)
      .enter()
      .append('circle')
      .attr('class', 'circle')
      .attr('cx', (d) => x(d.month)! + x.bandwidth() / 2)
      .attr('cy', (d) => y(d.avgPrice))
      .attr('r', 4)
      .attr('fill', 'steelblue')
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(`Month: ${d.month}<br>Sales: ${d.salesCount}<br>Avg Price: $${d.avgPrice.toFixed(2)}<br>Price Std Dev: $${d.stdDev.toFixed(2)}`);
      })
      .on('mousemove', (event) => {
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 30}px`);
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
      });
  }, [monthlyData]);

  return (
    <div>
      <svg id="line-chart"></svg>
    </div>
  );
};

export default LineChart;
