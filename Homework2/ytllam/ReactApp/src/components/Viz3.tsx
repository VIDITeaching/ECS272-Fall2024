import React from 'react'
import { useEffect, useState, useContext, useRef } from 'react';
import * as d3 from 'd3';
import dataFromJson from '../../data/demo.json';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import DataContext from '../stores/DataContext.js';

import { Bar, ComponentSize, Margin } from '../types.js';
// A 'extends' B means A inherits the properties and methods from B.
interface CategoricalBar extends Bar{
  category: string;
}

export default function Viz3() {
  // Get data from context
  const data = useContext(DataContext);
  const DRINKING_DAY = 'weekendAlc'; // use weekend drinking freq for now
  const DRINKING_FREQ_BINS = ['Very Low', 'Low', 'Average', 'High', 'Very High'];

  // Component size, not window size. Depends on grid size.
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  // On window resize, call setSize with delay of 200 milliseconds
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)
  // If ref is created with useRef(null), React will map it to node in JSX on render.
  // Changes to ref (from d3) do not trigger rerenders.
  // Important: ref cannot be read while rendering, must be done in event handler or useEffect().
  const graphRef = useRef<HTMLDivElement>(null);
  useResizeObserver({ ref: graphRef, onResize });

  const margin: Margin = { top: 40, right: 40, bottom: 40, left: 80 };
  const radius = Math.min(size.width, size.height) / 3;


  useEffect(() => {
    if (isEmpty(data)) return;
    if (size.width === 0 || size.height === 0) return; // if component not rendered

    // Reset graph
    d3.select('#pie-chart-svg').selectAll('*').remove();
    renderGraph();
  }, [data, size]) // Run if data updated

  function renderGraph() {
    const svg = d3.select('#pie-chart-svg');

    const pieContainer = svg.append('g')
      .attr('transform', `translate(${margin.left + radius}, ${size.height/2 + 20})`);
    
    const color = d3.scaleOrdinal(DRINKING_FREQ_BINS, d3.schemeRdPu[DRINKING_FREQ_BINS.length]);
    const totalStudentsPerBin = d3.rollups(data, v => v.length, d => d[DRINKING_DAY]).sort();
    const pie = d3.pie()
        .sort(null)
        .value(d => d[1]);

    // Arc generator for pie slices
    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    const arcs = pie(totalStudentsPerBin);

    // Create pie chart
    pieContainer.append('g')
      .selectAll()
      .data(arcs)
      .join('path')
        .attr('fill', d => color(d.data[0]))
        .attr('stroke', 'white')
        .style('stroke-width', '2px')
        .style('opacity', 0.85)
        .attr('d', arc)
      .append('title')
        .text(d => `${d.data[1]} Students with ${DRINKING_FREQ_BINS[d.data[0]]} Drinking Frequency`);
    
    const labels = pieContainer.append('g')
      .selectAll()
      .data(arcs)
      .enter()
        .append('text')
        .text(function(d){ return d.data[1]})
        .attr('transform', function(d) { return `translate(${arc.centroid(d)})`;  })
        .style('text-anchor', 'middle')
        .style('font-size', 16)
    

    const colorLegend = svg.append('g')
      .attr('transform', `translate(${radius * 2.5 + margin.left}, ${radius})`);
    
    colorLegend.append('text')
      .attr('transform', 'translate(0, -15)')
      .text('Drinking Frequency')
    
    console.log(size);
    if (size.width <= 200) {
      colorLegend.style('display', 'none');
      labels.style('display', 'none');
    }

    DRINKING_FREQ_BINS.toReversed().forEach((binLabel, i) => {
      colorLegend.append('rect')
        .attr('transform', `translate(0, ${(20 + 15) * i})`)
        .attr('width', 20)
        .attr('height', 20)
        .style('fill', color(binLabel));
      
      colorLegend.append('text')
        .attr('transform', `translate(25, ${(20 + 15) * i + 15})`)
        .attr('text-anchor', 'start')
        .text(binLabel)
    });    
    
    // Chart title
    svg.append('g')
    .append('text')
      .attr('transform', `translate(${margin.left}, ${30})`)
      .style('text-anchor', 'start')
      .style('font-weight', 'bold')
      .style('font-size', 'large')
      .text('Weekend drinking frequency of students');
  }

  return (
    <>
      <div ref={graphRef} className='chart-container'>
        <svg id='pie-chart-svg' width='100%' height='100%'></svg>
      </div>
    </>
  )
}
