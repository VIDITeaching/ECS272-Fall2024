import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ComponentSize } from '../types';

const ParallelCoordinate: React.FC = () => {
  const chartRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<any[]>([]);
  const [size, setSize] = useState<ComponentSize>({ width: 800, height: 500 });

  const botColor = "#da0911";
  const topColor = "#ffa590";
  const margin = { top: 60, right: 150, bottom: 30, left: 60 };

  useEffect(() => {
    const loadData = async () => {
      try {
        const csvData = await d3.csv('../../data/car_prices.csv', d => {
          if (d.make.toUpperCase() === 'PORSCHE' 
          && d.state.toUpperCase() === 'CA' 
          && d.body.toUpperCase() === 'SUV'
          && d.odometer && d.mmr && d.sellingprice && d.condition) {
            return {
              year: d.year,
              odometer: +d.odometer,
              mmr: +d.mmr,
              sellingprice: +d.sellingprice,
              condition: +d.condition
            };
          }
          return null;
        });
        setData(csvData.filter(d => d !== null));
      } catch (error) {
        console.error('Error loading CSV data:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!data.length) return;

    const { width, height } = size;
    d3.select(chartRef.current).selectAll('*').remove();

    const dimensionLabels = {
      year: 'Year',
      odometer: 'Odometer',
      mmr: 'Manheim Market Report',
      sellingprice: 'Selling Price',
    };

    const dimensions = ['year', 'odometer', 'mmr', 'sellingprice'];
    const yScales: { [key: string]: d3.ScaleLinear<number, number> | d3.ScalePoint<string> } = {};

    dimensions.forEach(dimension => {
      if (dimension === 'year') {
        yScales[dimension] = d3.scalePoint()
          .domain(Array.from(new Set(data.map(d => d.year))).sort())
          .range([height - margin.bottom, margin.top]);
      } else {
        yScales[dimension] = d3.scaleLinear()
          .domain(d3.extent(data, d => d[dimension]) as [number, number])
          .range([height - margin.bottom, margin.top]);
      }
    });

    const xScale = d3.scalePoint()
      .domain(dimensions)
      .range([margin.left, width - margin.right]);

    const conditionExtent = d3.extent(data, d => d.condition);
    const conditionColorScale = d3.scaleSequential(d3.interpolateRgb(botColor, topColor))
      .domain([conditionExtent[0], conditionExtent[1]]);

    const svg = d3.select(chartRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '22px')
      .style('font-weight', 'bold')
      .text('Porsche SUV in California Parallel Coordinate');

    svg.append('g')
      .selectAll('path')
      .data(data)
      .join('path')
      .attr('d', d => d3.line<number | string>()
        .x((_, i) => xScale(dimensions[i]) as number)
        .y((_, i) => yScales[dimensions[i]](d[dimensions[i]]))
        .curve(d3.curveMonotoneX)(dimensions.map(dimension => d[dimension]))
      )
      .attr('fill', 'none')
      .attr('stroke', d => conditionColorScale(d.condition))
      .attr('stroke-width', 2)
      .attr('opacity', 0.8);

    dimensions.forEach(dimension => {
      const axis = dimension === 'sellingprice' ? d3.axisRight(yScales[dimension]) : d3.axisLeft(yScales[dimension]);
      svg.append('g')
        .attr('transform', `translate(${xScale(dimension)}, 0)`)
        .call(axis);

      svg.append('text')
        .attr('x', xScale(dimension))
        .attr('y', height - margin.bottom + 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .text(dimensionLabels[dimension]);
    });

    const legendHeight = height - margin.top - margin.bottom;
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 60}, ${margin.top})`);

    const gradient = legend.append('defs')
      .append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', conditionColorScale(conditionExtent[1]));

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', conditionColorScale(conditionExtent[0]));

    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 20)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)');

    const legendScale = d3.scaleLinear()
      .domain(conditionExtent as [number, number])
      .range([0, legendHeight]);

    legend.append('g')
      .attr('transform', 'translate(25, 0)')
      .call(d3.axisRight(legendScale).ticks(5).tickFormat(d => `${d.toFixed(2)}`));

    legend.append('text')
      .attr('x', 0)
      .attr('y', legendHeight + 20)
      .attr('text-anchor', 'start')
      .style('font-size', '12px')
      .text('Condition');
  }, [data, size]);

  return <svg ref={chartRef}></svg>;
};

export default ParallelCoordinate;
