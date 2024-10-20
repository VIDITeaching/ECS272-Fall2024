import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { ComponentSize, Margin } from '../types';

export default function ParallelCoordinatesPlot() {
  const [data, setData] = useState([]);
  const chartRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 25, right: 100, bottom: 10, left: 60 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);

  useResizeObserver({ ref: chartRef, onResize });


  useEffect(() => {
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/student-por.csv', d => ({
          totalEdu: +d.Medu + +d.Fedu,
          romantic: d.romantic === 'yes' ? 'yes' : 'no', 
          freetime: +d.freetime,
          goout: +d.goout,
          totalAlcohol: +d.Dalc + +d.Walc 
        }));
        setData(csvData);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };
    dataFromCSV();
  }, []);

  useEffect(() => {
    if (isEmpty(data) || size.width === 0 || size.height === 0) return;

    d3.select('#parallel-svg').selectAll('*').remove();

    initChart();
  }, [data, size]);

  function initChart() {
    const svg = d3.select('#parallel-svg');

    const categorizedData = data.map(d => {
      const totalEdu = +d.totalEdu;
      let category;
      if (totalEdu <= 2) category = '0-2';
      else if (totalEdu <= 5) category = '3-5';
      else category = '6-8';
      return { ...d, totalEdu: category };
    });

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const dimensions = ['totalAlcohol', 'goout', 'freetime', 'romantic', 'totalEdu'];

    const yScales = {
      freetime: d3.scaleLinear().domain([1, 5]).range([size.height - margin.bottom, margin.top]),
      goout: d3.scaleLinear().domain([1, 5]).range([size.height - margin.bottom, margin.top]),
      totalAlcohol: d3.scaleLinear().domain([0, d3.max(categorizedData, d => d.totalAlcohol)]).range([size.height - margin.bottom, margin.top])
    };

    const categoryScales = {
      totalEdu: d3.scalePoint().domain(['0-2', '3-5', '6-8']).range([size.height - margin.bottom, margin.top]),
      romantic: d3.scalePoint().domain(['yes', 'no']).range([size.height - margin.bottom, margin.top])
    };

    const xScale = d3.scalePoint()
      .domain(dimensions)
      .range([margin.left, size.width - margin.right]);

    dimensions.forEach(dim => {
      svg.append('line')
        .attr('x1', xScale(dim))
        .attr('y1', 0)
        .attr('x2', xScale(dim))
        .attr('y2', size.height - margin.bottom)
        .style('stroke', '#ccc');
    });

    svg.selectAll('path')
      .data(categorizedData)
      .enter().append('path')
      .attr('d', d => {
        return d3.line()(
          dimensions.map(dim => {
            if (dim === 'totalEdu' || dim === 'romantic') {
              return [xScale(dim), categoryScales[dim](d[dim])];
            }
            return [xScale(dim), yScales[dim](d[dim])];
          })
        );
      })
      .style('fill', 'none')
      .style('stroke', d => colorScale(d.totalAlcohol)) 
      .style('opacity', 0.7)
      .style('stroke-width', 1.5);

    dimensions.forEach(dim => {
      if (dim === 'totalEdu' || dim === 'romantic') {
        const scale = categoryScales[dim];
        svg.append('g')
          .attr('transform', `translate(${xScale(dim)}, 0)`)
          .call(d3.axisLeft(scale));
      } else {
        const scale = yScales[dim];
        svg.append('g')
          .attr('transform', `translate(${xScale(dim)}, 0)`)
          .call(d3.axisLeft(scale).ticks(5).tickFormat(d3.format('d')));
      }

      svg.append('text')
        .attr('x', xScale(dim))
        .attr('y', margin.top - 10)
        .attr('text-anchor', 'middle')
        .text(dim);
    });
  }

  return (
    <>
      <div ref={chartRef} className='chart-container'>
        <svg id='parallel-svg' width='100%' height='300'></svg>
      </div>
    </>
  );
}