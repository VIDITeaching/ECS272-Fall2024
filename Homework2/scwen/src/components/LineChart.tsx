import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { Margin, ComponentSize } from '../types';

const LineChart: React.FC = () => {
  const chartRef = useRef(null);
  const [data, setData] = useState<any[]>([]);
  const [size, setSize] = useState<ComponentSize>({ width: 800, height: 500 });

  const margin: Margin = { top: 60, right: 50, bottom: 80, left: 70 };

  const colorList = [
    "#4169E1", "#FF4B4B", "#32CD32", "#FFD700", "#FF1493",
    "#4B0082", "#FF8C00", "#00CED1", "#8A2BE2", "#006400",
    "#CD853F", "#00FFFF", "#8B4513", "#FF69B4", "#7CFC00",
    "#9370DB", "#F08080", "#20B2AA", "#DEB887", "#9932CC"
  ];

  useEffect(() => {
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/car_prices.csv', (d) => {
          const saleYear = +d.year;
          const make = d.make.trim();

          if (saleYear >= 2005 && make !== "") {
            return {
              make: make.toUpperCase(),
              year: saleYear,
              price: +d.sellingprice,
              count: 1,
            };
          }
          return null;
        });

        const validData = csvData.filter(d => d !== null);

        const salesByMakeAndYear = d3.rollup(
          validData,
          v => ({
            avgPrice: d3.mean(v, d => d.price),
            count: v.length,
          }),
          d => d.make,
          d => d.year
        );

        const flattenedData = Array.from(salesByMakeAndYear, ([make, years]) =>
          Array.from(years, ([year, values]) => ({
            make,
            year: year,
            avgPrice: values.avgPrice,
            count: values.count
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
    if (isEmpty(data)) return;
    if (size.width === 0 || size.height === 0) return;

    d3.select(chartRef.current).selectAll('*').remove();
    initChart();
  }, [data, size]);

  const initChart = () => {
    const svg = d3.select(chartRef.current)
      .attr('width', size.width)
      .attr('height', size.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const carMakes = Array.from(new Set(data.map(d => d.make)));
    const years = Array.from(new Set(data.map(d => d.year))).sort((a, b) => a - b);

    const x = d3.scalePoint()
      .domain(years)
      .range([0, size.width - margin.left - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.avgPrice) as number])
      .range([size.height - margin.top - margin.bottom, 0]);

    const color = d3.scaleOrdinal(colorList).domain(carMakes);

    const line = d3.line<any>()
      .x(d => x(d.year) as number)
      .y(d => y(d.avgPrice));

    svg.append('g')
      .attr('transform', `translate(0,${size.height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", "12px")
      .style("text-anchor", "middle");

    svg.append('g').call(d3.axisLeft(y));

    const makeGroup = d3.group(data, d => d.make);
    makeGroup.forEach((values, make) => {
      const sortedValues = values.sort((a, b) => a.year - b.year);

      svg.append("path")
        .datum(sortedValues)
        .attr("fill", "none")
        .attr("stroke", color(make))
        .attr("stroke-width", 2.5)
        .attr("d", line);
    });

    svg.append("text")
      .attr("x", (size.width - margin.left - margin.right) / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "22px")
      .style("font-weight", "bold")
      .text("Average Sale Price of Car (Made in 2005 - 2015, Sales Amount \u{2265}5000)");

    svg.append("text")
      .attr("x", (size.width - margin.left - margin.right) / 2)
      .attr("y", size.height - margin.top - margin.bottom + 50)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Year of Car");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(size.height - margin.top - margin.bottom) / 2)
      .attr("y", -margin.left + 15)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Average Sale Price");

    const legend = svg.append("g")
      .attr("transform", `translate(10, 10)`);

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
