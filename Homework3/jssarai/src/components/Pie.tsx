import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import dataFromJson from '../../data/demo.json';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

import { Arc, ComponentSize, Margin } from '../types';




export default function Pie() {
  const [arcs, setArcs] = useState<Arc[]>([]);
  const [lowArcs, setLowArcs] = useState<[string, number][]>([]);
  const [medArcs, setMedArcs] = useState<[string, number][]>([]);
  const [highArcs, setHighArcs] = useState<[string, number][]>([]);
  const [chartSelect, setChartSelect] = useState('low');
  const arcRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 40, right: 20, bottom: 80, left: 60 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)

  useResizeObserver({ ref: arcRef, onResize });
  
  useEffect(() => {
    // For reading json file
    /*if (isEmpty(dataFromJson)) return;
    setBars(dataFromJson.data);*/
    
    // For reading csv file
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/financial_risk_assessment.csv', d => {
          // This callback allows you to rename the keys, format values, and drop columns you don't need
		  return {gender: d['Gender'], risk: d["Risk Rating"]};
        });
	let highRisk = csvData.filter((d) => (d.risk == 'High'));
    let highRiskArcs = d3.sort(d3.rollups(highRisk, v => Math.round(100*v.length/highRisk.length), d => d.gender), (d) => d[0])
	let mediumRisk = csvData.filter((d) => (d.risk == 'Medium'));
    let mediumRiskArcs = d3.sort(d3.rollups(mediumRisk, v => Math.round(100*v.length/mediumRisk.length), d => d.gender), (d) => d[0])
	let lowRisk = csvData.filter((d) => (d.risk == 'Low'));
    let lowRiskArcs = d3.sort(d3.rollups(lowRisk, v => Math.round(100*v.length/lowRisk.length), d => d.gender), (d) => d[0])
	setLowArcs(lowRiskArcs)
	setMedArcs(mediumRiskArcs)
	setHighArcs(highRiskArcs)
	let processedData: Arc[] = [];
	let arcs = lowRiskArcs;
	arcs.forEach(d => {
		processedData.push({category: d[0], percent: d[1]});
	});
	setArcs(processedData);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    } 
    dataFromCSV();
  }, [])

  useEffect(() => {
    if (isEmpty(arcs)) return;
    if (size.width === 0 || size.height === 0) return;
    //d3.select('#arc-svg').selectAll('*').remove();
    initChart();
  }, [arcs, size])
  
  function initChart() {
	let doc = document as any;
	let ele = doc.querySelector('#arc-svg');

    // select the svg tag so that we can insert(render) elements, i.e., draw the chart, within it.
    let chartContainer = d3.select('#arc-svg')

	chartContainer.attr("viewBox", [-(size.width+margin.left+50) / 2, -(size.height-margin.top) / 2, size.width+margin.left+60, (size.height-margin.top+60)]);
	let cats = ['Female', 'Male', 'Non-Binary']
	let colors = ['red', 'blue', 'green']
  
	let outerRadius = Math.min(size.width, size.height) / 2
	let labelRadius = outerRadius * 0.6
	// Construct arcs.
	 
	const arcs2 = d3.pie().sort(null).value((i: number) => arcs[i].percent)(d3.range(3));
	const arc: any = d3.arc().innerRadius(0).outerRadius(outerRadius);
	const arcLabel = d3.arc().innerRadius(labelRadius).outerRadius(labelRadius);
	
	const pie1 = chartContainer.append("g")
		.attr("stroke", 1)
		.attr("stroke-width", 1)
		.attr("stroke-linejoin", "round")
	  .selectAll("path")
	  .data(arcs2)
	  .join("path")
		.attr("fill", (_, i) => colors[i])
		.attr("d", arc)
		.append("title")
		.text(d => String(d.data));
  
		const pie2 = chartContainer.append("g")
		.attr("font-family", "sans-serif")
		.attr("font-size", 14)
		.attr("text-anchor", "middle")
	  .selectAll("text")
	  .data(arcs2)
	  .join("text")
		.attr("transform", (d: any) => `translate(${arcLabel.centroid(d)})`)
	  .selectAll("tspan")
	  .data((d: any) => {
		return `${cats[d.data]} \n${d.value}%`.split(/\n/)
	})
	  .join("tspan")
		.attr("x", 0)
		.attr("y", (_, i) => `${i * 1.1}em`)
		.text((d) => d);
	
		const pie3 = chartContainer.append("text")
		  .attr("x", 0)             
		  .attr("y", 0 + (1.2*outerRadius))
		  .attr("text-anchor", "middle")  
		  .style('font-size', '1.2rem')
		  .attr("font-weight", "bold")
		  .text("Gender Breakdown"); 


		  ele.addEventListener('animationend', function() {
			ele.classList.remove('move');
		  });

  }

  const handleChartChange = (event: any) => {


	setChartSelect(event.target.value);
	let doc = document as any
	let ele = doc.querySelector('#arc-svg');
	ele.classList.add('move');
	//ele.classList.add('exit');
	//ele.classList.add('left');
	//ele.classList.remove('right');
	let chartSelect2 = event.target.value;
	let processedData: Arc[] = [];
	let arcs = highArcs
	if (chartSelect2 == 'low') {
		arcs = lowArcs
	} else if (chartSelect2 == 'medium') {
		arcs = medArcs
	}
	arcs.forEach(d => {
		processedData.push({category: d[0], percent: d[1]});
	});
	setArcs(processedData);
  };


  return (
    <>
      <div ref={arcRef} className='chart-container'>
        <svg id='arc-svg' className='enter' width='100%' height='100%'></svg>
      </div>
	<div className='row'>
    <div className="radio">
      <label>
        <input type="radio" name='risk' checked={chartSelect === 'low'} value="low" onChange={handleChartChange} />
        Low Risk
      </label>
    </div>
    <div className="radio">
      <label>
        <input type="radio" name='risk' checked={chartSelect === 'medium'} value="medium" onChange={handleChartChange}/>
        Medium Risk
      </label>
    </div>
    <div className="radio">
      <label>
        <input type="radio" name='risk' checked={chartSelect === 'high'} value="high" onChange={handleChartChange}/>
        High Risk
      </label>
    </div>
	</div>
    </>
  )
}
