import React from 'react'
import { useEffect, useState, useContext, useRef } from 'react';
import * as d3 from 'd3';
import dataFromJson from '../../data/demo.json';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import DataContext from '../stores/DataContext.js';

import { Bar, ComponentSize, Margin } from '../types.js';
// A "extends" B means A inherits the properties and methods from B.
interface CategoricalBar extends Bar{
  category: string;
}

export default function Viz2() {
  // Get data from context
  const data = useContext(DataContext);
  const DRINKING_DAY = 'weekendAlc'; // use weekend drinking freq for now
  const DRINKING_FREQ_BINS = ['Very Low', 'Low', 'Average', 'High', 'Very High'];
  const GRADE_COLUMNS = ['G1', 'G2', 'G3'];

  // Color scale for grades. Not super distinguishable right now but will be better when made brushable.
  const color = d3.scaleLinear([0, 20], ['red', 'lime']);

  const margin: Margin = { top: 40, right: 20, bottom: 40, left: 140 };

  // Component size, not window size. Depends on grid size.
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  // On window resize, call setSize with delay of 200 milliseconds
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)
  // If ref is created with useRef(null), React will map it to node in JSX on render.
  // Changes to ref (from d3) do not trigger rerenders.
  // Important: ref cannot be read while rendering, must be done in event handler or useEffect().
  const graphRef = useRef<HTMLDivElement>(null);
  useResizeObserver({ ref: graphRef, onResize });

  useEffect(() => {
    if (isEmpty(data)) return;
    if (size.width === 0 || size.height === 0) return; // if component not rendered

    // Reset graph
    d3.select('#heatmap-svg').selectAll('*').remove();
    renderHeatMap();
  }, [data, size])

  function renderHeatMap() {
    // Compute average grade by drinking frequency for G1, G2, G3. This is displayed inside a cell.
    let drinkToMeanGradeMatrix = new Map<string, Map<String, number>>();
    // For each period,
    GRADE_COLUMNS.forEach((grade) => {
      let meanGradeMap = new Map<string, number>();
      // For each drinking frequency, 
      DRINKING_FREQ_BINS.forEach((drinkingFrequency, index) => {
        // Computer mean grade, ignoring missing grades. (NaNs should not exist in dataset though)
        // Drinking frequency is 1-indexed. There are two columns for drinking frequency (weekend/end), deperiodined by DRINKING_DAY.
        let meanGradeForDrinkingAmount = d3.mean(data, d => d[DRINKING_DAY] === (index + 1).toString() ? +d[grade]! : NaN)?.toFixed(2);
        console.log("mean grade for ", drinkingFrequency + " X " + grade, meanGradeForDrinkingAmount);
        meanGradeMap.set(drinkingFrequency, meanGradeForDrinkingAmount || -1);
      });
      drinkToMeanGradeMatrix.set(grade, meanGradeMap);
    });
    
    console.log(drinkToMeanGradeMatrix);
    
    // Compute x and y position for each cell
    let x  = d3.scaleBand()
      .domain(GRADE_COLUMNS)
      .rangeRound([margin.left, size.width - margin.right])
      .padding(0.01);

    let y  = d3.scaleBand()
      .domain(DRINKING_FREQ_BINS)
      .range([size.height - margin.bottom, margin.top])
      .padding(0.02);

    // Create svg and initialize scales
    let svg = d3.select('#heatmap-svg');

    // x axis
    svg.append('g')
      .attr('transform', `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(x))
    svg.append('g')
      .attr('transform', `translate(${size.width / 2 + 20}, ${size.height - margin.bottom + 35})`)
      .append('text')
      .text('Grade period')
      .style('font-size', '.8rem')

    // y axis
    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y))
    svg.append('g')
      .attr('transform', `translate(${margin.left / 2 + 10}, ${size.height / 2 + 80}) rotate(-90)`)
      .append('text')
      .text('Weekend drinking frequency')
      .style('font-size', '.8rem')

    // chart title
    svg.append('g')
      .append('text')
      .attr('transform', `translate(${(size.width + margin.left) / 2 - 10}, ${margin.top / 2})`)
      .style('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .text('Weekend drinking frequency and mean period grade');

    console.log("zipped", d3.cross(GRADE_COLUMNS, DRINKING_FREQ_BINS))
    
    // Plot cells
    let cells = svg.append('g')
      .selectAll('rect')
      .data(d3.cross(GRADE_COLUMNS, DRINKING_FREQ_BINS))
      .enter()
      .append('g');
    
    cells.append('rect')
        // get by grade period then get mean grade by drinking frequency
      .attr('x', d => x(d[0]))
      .attr('y', d => y(d[1]))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style('fill', d => color(drinkToMeanGradeMatrix.get(d[0])?.get(d[1])))      
      .append('title') // tooltip for final score for each plotted line
        .text(d => 'Average math score for period: ' + drinkToMeanGradeMatrix.get(d[0])?.get(d[1]) + '/20')
    
    cells.append('text')
      // same x,y as cells
      .attr('x', d => x(d[0]) + x.bandwidth()/2)
      .attr('y', d => y(d[1]) + y.bandwidth()/2 + 5)
      .attr('fill', 'white')
      .style('text-anchor', 'middle')
      .text(d => drinkToMeanGradeMatrix.get(d[0])?.get(d[1]));
  
    // Plot heat legend
    let colorLegend = svg.append('g')
      .attr('transform', `translate(${10}, ${margin.top})`);
    
    // Create gradient for color legend
    colorLegend.append('linearGradient')
      .attr('id', 'color-gradient')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '100%')
      .attr('y2', '0%')
      .selectAll('stop')
      .data(color.range())
      .enter().append('stop')
        .attr('offset', (_,i) => i/(color.range().length-1))
        .attr('stop-color', d => d);
    
    colorLegend.append('g')
      .append('rect')
        .attr('transform', `translate(20, ${margin.top})`)
        .attr('width', 20)
        .attr('height', 150)
        .style('fill', 'url(#color-gradient');

    colorLegend.append('g')
      .append('text')
        .attr('transform', `translate(30, ${margin.top / 2})`)
        .attr('font-size', 'small')
        .style('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .text('Grade');
    
    const colorAxisScale = d3.scaleLinear([20, 0], [0, 150]);
    colorLegend.append('g')
      .attr('transform', `translate(20, ${margin.top / 2 + 20})`)
      .call(d3.axisLeft(colorAxisScale).ticks(5).tickSize(-20))
      .select('.domain').remove();
  }
    
  return (
    <>
      <div ref={graphRef} className='detail-chart-container'>
        <svg id='heatmap-svg' width='100%' height='100%'></svg>
      </div>
    </>
  )
}
