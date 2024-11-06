import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import dataFromJson from '../../data/demo.json';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

import { Point, ComponentSize, Margin } from '../types';




export default function Scatter() {
  const [points, setPoints] = useState<Point[]>([]);
  const pointRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 40, right: 20, bottom: 80, left: 60 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)

  useResizeObserver({ ref: pointRef, onResize });
  
  useEffect(() => {
    // For reading json file
    /*if (isEmpty(dataFromJson)) return;
    setBars(dataFromJson.data);*/
    
    // For reading csv file
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/financial_risk_assessment.csv', d => {
          // This callback allows you to rename the keys, format values, and drop columns you don't need
		  return {posX: +d["Debt-to-Income Ratio"], posY: +d["Credit Score"], color: d["Payment History"]};
        });
    let processedData = csvData.filter((d) => (d.posX != 0 && d.posY != 0));
		setPoints(processedData);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    } 
    dataFromCSV();
  }, [])

  useEffect(() => {
    if (isEmpty(points)) return;
    if (size.width === 0 || size.height === 0) return;
    d3.select('#point-svg').selectAll('*').remove();
    initChart();
  }, [points, size])
  
  function initChart() {
	
    // select the svg tag so that we can insert(render) elements, i.e., draw the chart, within it.
    let chartContainer = d3.select('#point-svg')

    let xExtents = d3.extent(points.map((d: Point) => Number(d.posX) as number)) as [number, number]
    let yExtents = d3.extent(points.map((d: Point) => Number(d.posY) as number)) as [number, number]
    
    let typeKeys = ['Poor', 'Fair', 'Good', 'Excellent'];

	  let color = d3.scaleOrdinal()
	  .domain(typeKeys)
	  .range(["red", "orange", "yellow", "green"])

    let xScale = d3.scaleLinear()
    .rangeRound([margin.left, size.width - margin.right]) //bottom side to the top side on the screen
      .domain(xExtents) // This is based on your data, but if there is a natural value range for your data attribute, you should follow
    // e.g., it is natural to define [0, 100] for the exame score, or [0, <maxVal>] for counts.

    let yScale = d3.scaleLinear()
      .rangeRound([size.height - margin.bottom, margin.top]) //bottom side to the top side on the screen
      .domain(yExtents) // This is based on your data, but if there is a natural value range for your data attribute, you should follow
    // e.g., it is natural to define [0, 100] for the exame score, or [0, <maxVal>] for counts.

    const xAxis = chartContainer.append('g')
    .attr('transform', `translate(0, ${size.height - margin.bottom})`)
    .call(d3.axisBottom(xScale))

  const yAxis = chartContainer.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale))

  const yLabel = chartContainer.append('g')
    .attr('transform', `translate(${(margin.left-30) / 2}, ${size.height / 2}) rotate(-90)`)
    .append('text')
    .text('Credit Score')
    .style('font-size', '.8rem')

  const xLabel = chartContainer.append('g')
    .attr('transform', `translate(${(size.width-margin.left) / 2}, ${size.height - margin.top})`)
    .append('text')
    .text('Debt-to-Income Ratio')
    .style('font-size', '.8rem')

    const title = chartContainer.append('g')
    .append('text') // adding the text
    .attr('transform', `translate(${(size.width+margin.left)/ 2}, ${size.height - margin.top + 15})`)
    .attr('dy', '0.5rem') // relative distance from the indicated coordinates.
    .style('text-anchor', 'middle')
    .style('font-weight', 'bold')
    .text('Debt-to-Income Ratio vs. Credit Score') // text content

    const scatterChart = chartContainer
    .selectAll('dot')
    .data<Point>(points)
    .join('circle')
    .attr('cx', (d) => xScale(d.posX))
    .attr('cy', (d) => yScale(d.posY))
    .attr('r', 1)
    .style('fill', (d) => String(color(d.color)))
    .attr('class', (d) => d.color)
    .on('mouseover', function(d) {
      let e = this as any
      d3.selectAll("." + e.getAttribute('class')).attr('r', 3)
    })
    .on('mouseout', function(d) {
      let e = this as any
      d3.selectAll("." + e.getAttribute('class')).attr('r', 1)
    })

    /*

    .attr('class', (d) => d.color)
    */
  
    const legendPoorBox = chartContainer.append("rect")
    .attr("x", 70)
    .attr("y", 6+size.height-margin.top)
    .attr("width", 13)
    .attr("height", 13)
    .style("fill", "red")

    const legendFairBox = chartContainer.append("rect")
    .attr("x", 115)
    .attr("y", 6+size.height-margin.top)
      .attr("width", 13)
      .attr("height", 13)
      .style("fill", "orange")

    const legendGoodBox = chartContainer.append("rect")
    .attr("x", 155)
    .attr("y", 6+size.height-margin.top)
        .attr("width", 13)
        .attr("height", 13)
        .style("fill", "yellow")
  
      const legendExcellentBox = chartContainer.append("rect")
        .attr("x", 203)
        .attr("y", 6+size.height-margin.top)
        .attr("width", 13)
        .attr("height", 13)
        .style("fill", "green")

        const legendPoorLabel = chartContainer.append("text")
          .attr("class", "legend")
          .attr("x", 87)
          .attr("y", 16+size.height-margin.top)
          .style('font-size', '.6rem')
          .text("Poor")

        const legendFairLabel = chartContainer.append("text")
            .attr("class", "legend")
            .attr("x", 132)
            .attr("y", 16+size.height-margin.top)
            .style('font-size', '.6rem')
            .text("Fair")

      const legendGoodLabel = chartContainer.append("text")
        .attr("class", "legend")
        .attr("x", 172)
        .attr("y", 16+size.height-margin.top)
        .style('font-size', '.6rem')
        .text("Good")

      const legendExcellentLabel = chartContainer.append("text")
        .attr("class", "legend")
        .attr("x", 220)
        .attr("y", 16+size.height-margin.top)
        .style('font-size', '.6rem')
        .text("Excellent")

        const legendLabel = chartContainer.append('text')
          .attr("class", "legend")
          .attr("x", 112)
          .attr("y", 35+size.height-margin.top)
          .style('font-size', '.8rem')
          .style('font-weight', 'bold')
          .text("Payment History")  
  }
	  

  return (
    <>
      <div ref={pointRef} className='chart-container'>
        <svg id='point-svg' width='100%' height='100%'></svg>
      </div>
    </>
  )
}
