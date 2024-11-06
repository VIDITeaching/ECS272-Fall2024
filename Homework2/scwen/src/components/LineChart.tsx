import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ComponentSize } from '../types';
import { colorList } from '../stores/ColorList';

const LineChart: React.FC = () => {
  const chartRef = useRef(null);
  const [data, setData] = useState<any[]>([]);
  const [size, setSize] = useState<ComponentSize>({ width: 600, height: 400 });

  const margin = { top: 50, right: 100, bottom: 60, left: 60 };
  const legendWidth = 150;

  const startMonth = "2014-12";
  const endMonth = "2015-08";

  useEffect(() => {
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/car_prices.csv', d => {
          const saledateStr = d.saledate;
          const validDatePattern = /^[A-Za-z]{3} [A-Za-z]{3} \d{2} \d{4}/;

          if (!validDatePattern.test(saledateStr)) return null;

          const date = new Date(saledateStr);
          const formattedMonth = d3.timeFormat("%Y-%m")(date);

          if (formattedMonth >= startMonth && formattedMonth <= endMonth && d.make.trim() !== "") {
            return {
              make: d.make.toUpperCase(),
              month: formattedMonth,
              price: +d.sellingprice,
              count: 1,
            };
          }
          return null;
        });

        const validData = csvData.filter(d => d !== null);

        const salesByMakeAndMonth = d3.rollup(
          validData,
          v => ({
            avgPrice: d3.mean(v, d => d.price),
            count: v.length,
          }),
          d => d.make,
          d => d.month
        );

        const flattenedData = Array.from(salesByMakeAndMonth, ([make, months]) =>
          Array.from(months, ([month, values]) => ({
            make,
            month,
            avgPrice: values.avgPrice,
            count: values.count,
          }))
        ).flat();

        const totalSalesByMake = d3.rollup(
          flattenedData,
          v => d3.sum(v, d => d.count),
          d => d.make
        );

        const filteredMakes = Array.from(totalSalesByMake)
          .filter(([_, count]) => count >= 5000)
          .map(([make]) => make);

        const finalData = flattenedData.filter(d => filteredMakes.includes(d.make));

        setData(finalData);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };

    dataFromCSV();
  }, []);

  useEffect(() => {
    if (!data.length || size.width === 0 || size.height === 0) return;
    d3.select(chartRef.current).selectAll('*').remove();
    initChart();
  }, [data, size]);

  const initChart = () => {
    const svg = d3.select(chartRef.current)
      .attr('width', size.width + legendWidth)
      .attr('height', size.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const carMakes = Array.from(new Set(data.map(d => d.make)));
    const months = Array.from(new Set(data.map(d => d.month))).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const x = d3.scalePoint()
      .domain(months)
      .range([0, size.width - margin.left - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.avgPrice) as number])
      .range([size.height - margin.top - margin.bottom, 0]);

    const color = d3.scaleOrdinal(colorList).domain(carMakes);

    const line = d3.line<any>()
      .x(d => x(d.month) as number)
      .y(d => y(d.avgPrice));

    svg.append('g')
      .attr('transform', `translate(0,${size.height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", "10px")
      .style("text-anchor", "middle");

    svg.append('g').call(d3.axisLeft(y));

    const makeGroup = d3.group(data, d => d.make);
    makeGroup.forEach((values, make) => {
      const sortedValues = values.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
      svg.append("path")
        .datum(sortedValues)
        .attr("fill", "none")
        .attr("stroke", color(make))
        .attr("stroke-width", 2)
        .attr("d", line);
    });

    const titleXPosition = (size.width + legendWidth) / 2;

    svg.append("text")
      .attr("x", titleXPosition - margin.left)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .text("Average Car Sale Price Trend Over Month (Sales \u{2265}5000)");

    svg.append("text")
      .attr("x", (size.width - margin.left - margin.right) / 2)
      .attr("y", size.height - margin.top - margin.bottom + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Month");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(size.height - margin.top - margin.bottom) / 2)
      .attr("y", -margin.left + 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Average Sale Price");

    const legend = svg.append("g")
      .attr("transform", `translate(${size.width - margin.right - 50}, 0)`);

    const legendPerColumn = Math.ceil(carMakes.length / 2);
    const legendColumnSpacing = 100;
    const legendRowSpacing = 18;

    carMakes.forEach((make, i) => {
      const column = Math.floor(i / legendPerColumn);
      const row = i % legendPerColumn;
      const legendRow = legend.append("g")
        .attr("transform", `translate(${column * legendColumnSpacing}, ${row * legendRowSpacing})`);
      legendRow.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(make));
      legendRow.append("text")
        .attr("x", 25)
        .attr("y", 10)
        .attr("text-anchor", "start")
        .style("font-size", "12px")
        .text(make);
    });
  };

  return <svg ref={chartRef}></svg>;
};

export default LineChart;
