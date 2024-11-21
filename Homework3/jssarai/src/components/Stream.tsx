import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import dataFromJson from '../../data/demo.json';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

import { Stream, ComponentSize, Margin } from '../types';




export default function StreamGraph() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const streamRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 40, right: 20, bottom: 80, left: 60 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)

  useResizeObserver({ ref: streamRef, onResize });
  
  useEffect(() => {
    // For reading json file
    /*if (isEmpty(dataFromJson)) return;
    setBars(dataFromJson.data);*/
    
    // For reading csv file
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/financial_risk_assessment.csv', d => {
          // This callback allows you to rename the keys, format values, and drop columns you don't need
		  return {age: +d.Age, riskCat: d["Risk Rating"]};
        });
		let ageCatFreqs = d3.flatRollup(csvData, (D) => D.length, (d) => d.age, (d) => d.riskCat)
		let xExtents = d3.extent(csvData.map((d) => Number(d.age) as number)) as [number, number]
		let n = xExtents[1];
		let ageLow = Array(n).fill(0) as number[];
		let ageMed = Array(n).fill(0) as number[];
		let ageHigh = Array(n).fill(0) as number[];
		for (let entry in ageCatFreqs) {
			let age = ageCatFreqs[entry][0];
			let cat = ageCatFreqs[entry][1];
			let count = ageCatFreqs[entry][2];
			if (cat == "Low") {
				ageLow[Number(age)] = count
			} else if (cat =="Medium") {
				ageMed[Number(age)] = count
			} else if (cat == "High") {
				ageHigh[Number(age)] = count
			} else {
				console.log("No category found")
			}
		}
		let processedData = []
		for (let age=xExtents[0]; age<=xExtents[1]; age++) {
			processedData.push({age: age, low: ageLow[age], medium: ageMed[age], high: ageHigh[age]});
		}
		setStreams(processedData);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    } 
    dataFromCSV();
  }, [])

  useEffect(() => {
    if (isEmpty(streams)) return;
    if (size.width === 0 || size.height === 0) return;
    d3.select('#stream-svg').selectAll('*').remove();
    initChart();
  }, [streams, size])
  
  function initChart() {
    // select the svg tag so that we can insert(render) elements, i.e., draw the chart, within it.
    let chartContainer = d3.select('#stream-svg')


    // Here we compute the [min, max] from the data values of the attributes that will be used to represent x- and y-axis.
    let xExtents = d3.extent(streams.map((d: Stream) => Number(d.age) as number)) as [number, number]
    // This is to get the unique categories from the data using Set, then store in an array.

	let typeKeys = ["low", "medium", "high"]
    
  let xScale = d3.scaleLinear()
      .rangeRound([margin.left, size.width - margin.right])
      .domain(xExtents)

    // In viewport (our screen), the topmost side always refer to 0 in the vertical coordinates in pixels (y). 
    let yScale = d3.scaleLinear()
      .range([size.height - margin.bottom, margin.top]) //bottom side to the top side on the screen
      .domain([0, 350]) // This is based on your data, but if there is a natural value range for your data attribute, you should follow
      // e.g., it is natural to define [0, 100] for the exame score, or [0, <maxVal>] for counts.

	  

      
	  let color = d3.scaleOrdinal()
	  .domain(typeKeys)
	  .range(["green", "yellow", "red"])
    


    // There are other scales such as scaleOrdinal,
        // whichever is appropriate depends on the data types and the kind of visualizations you're creating.

    // This following part visualizes the axes along with axis labels.
    // Check out https://observablehq.com/@d3/margin-convention?collection=@d3/d3-axis for more details
    
	const xAxis = chartContainer.append('g')
      .attr('transform', `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(xScale))

    const yAxis = chartContainer.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale))

    const yLabel = chartContainer.append('g')
      .attr('transform', `translate(${margin.left / 2}, ${size.height / 2}) rotate(-90)`)
      .append('text')
      .text('Count')
      .style('font-size', '.8rem')

    const xLabel = chartContainer.append('g')
      .attr('transform', `translate(${(size.width) / 2}, ${size.height - margin.top})`)
      .append('text')
      .text('Age')
      .style('font-size', '.8rem')
    

	let stack = d3.stack()
		.keys(typeKeys)
		.order(d3.stackOrderNone)
	let stackedData = stack(streams)
	


	const chartStreams = chartContainer.append('g')
	.selectAll("path")
	.data(stackedData)
	.join("path")
	  .attr("class", "stackedArea")
	  .style("fill", d => String(color(d.key)))
    .attr("d", d3.area<any>()
       .x((d: any) => xScale(d.data.age))
       .y0((d: any) => yScale(d[0]))
       .y1((d: any) => yScale(d[1]))
    );


	  
    // For transform, check out https://www.tutorialspoint.com/d3js/d3js_svg_transformation.htm, but essentially we are adjusting the positions of the selected elements.
    const title = chartContainer.append('g')
      .append('text') // adding the text
      .attr('transform', `translate(${(size.width+margin.left)/ 2}, ${size.height - margin.top + 15})`)
      .attr('dy', '0.5rem') // relative distance from the indicated coordinates.
      .style('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .text('Distribution of Risk Rating Accross Ages') // text content

    const legendLowBox = chartContainer.append("rect")
        .attr("x", 90)
        .attr("y", 6+size.height-margin.top)
        .attr("width", 13)
        .attr("height", 13)
        .style("fill", "green")

      const legendLowLabel = chartContainer.append("text")
        .attr("class", "legend")
        .attr("x", 107)
        .attr("y", 16+size.height-margin.top)
        .style('font-size', '.6rem')
        .text("Low")

      const legendMedBox = chartContainer.append("rect")
        .attr("x", 135)
        .attr("y", 6+size.height-margin.top)
        .attr("width", 13)
        .attr("height", 13)
        .style("fill", "yellow")

      const legendMedLabel = chartContainer.append("text")
        .attr("class", "legend")
        .attr("x", 152)
        .attr("y", 16+size.height-margin.top)
        .style('font-size', '.6rem')
        .text("Medium")

      const legendHighBox = chartContainer.append("rect")
        .attr("x", 195)
        .attr("y", 6+size.height-margin.top)
        .attr("width", 13)
        .attr("height", 13)
        .style("fill", "red")
  
        const legendHighLabel = chartContainer.append("text")
          .attr("class", "legend")
          .attr("x", 212)
          .attr("y", 16+size.height-margin.top)
          .style('font-size', '.6rem')
          .text("High")

        const legendLabel = chartContainer.append('text')
          .attr("class", "legend")
          .attr("x", 115)
          .attr("y", 35+size.height-margin.top)
          .style('font-size', '.8rem')
          .style('font-weight', 'bold')
          .text("Risk Category")        
  }
	  

  return (
    <>
      <div ref={streamRef} className='chart-container'>
        <svg id='stream-svg' width='100%' height='100%'></svg>
      </div>
    </>
  )
}
