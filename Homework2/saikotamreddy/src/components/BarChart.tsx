import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import dataFromJson from '../../data/demo.json';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

import { Bar, ComponentSize, Margin } from '../types';
interface CategoricalBar{
  category: string;
  fem_value: number;
  mal_value: number;
}



export default function BarChart() {
  const [bars, setBars] = useState<CategoricalBar[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 40, right: 20, bottom: 80, left: 60 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)

  useResizeObserver({ ref: barRef, onResize });
  
  useEffect(() => {
    // For reading json file
    /*if (isEmpty(dataFromJson)) return;
    setBars(dataFromJson.data);*/
    
    // For reading csv file
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/Student Mental health.csv', d => {
          return {gender: d['Choose your gender'], year: d['Your current year of Study'], depression: d['Do you have Depression?'], anxiety: d['Do you have Anxiety?'], panic: d['Do you have Panic attack?']};
        });
        let femaleDepression=0
        let maleDepression=0
        let femaleAnxiety=0
        let maleAnxiety=0
        let femalePanic=0
        let malePanic=0
        let maleCount=0.0
        let femaleCount=0.0
        for(let student in csvData){
          if(csvData[student].gender=='Male'){
            maleCount=maleCount+1
            if(csvData[student].depression=='Yes'){
              maleDepression=maleDepression+1
            }
            if(csvData[student].anxiety=='Yes'){
              maleAnxiety=maleAnxiety+1
            }
            if(csvData[student].panic=='Yes'){
              malePanic=malePanic+1
            }
          }
          else{
            femaleCount=femaleCount+1
            if(csvData[student].depression=='Yes'){
              femaleDepression=femaleDepression+1
            }
            if(csvData[student].anxiety=='Yes'){
              femaleAnxiety=femaleAnxiety+1
            }
            if(csvData[student].panic=='Yes'){
              femalePanic=femalePanic+1
            }
          }
        }
        let categories=
        [
          {category: 'Depression', fem_value: femaleDepression/femaleCount, mal_value: maleDepression/maleCount},
          {category: 'Anxiety', fem_value: femaleAnxiety/femaleCount, mal_value: maleAnxiety/maleCount},
          {category: 'Panic Attacks', fem_value: femalePanic/femaleCount, mal_value: malePanic/maleCount},
        ]
        setBars(categories);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    } 
    dataFromCSV();
  }, [])

  useEffect(() => {
    if (isEmpty(bars)) return;
    if (size.width === 0 || size.height === 0) return;
    d3.select('#bar-svg').selectAll('*').remove();
    initChart();
  }, [bars, size])

  function initChart() {
    let chartContainer = d3.select('#bar-svg');

    let yExtents = d3.extent(bars.map((d: CategoricalBar) => d.fem_value as number)) as [number, number];
    let xCategories: string[] = [...new Set(bars.map((d: CategoricalBar) => d.category as string))];

    let xScale = d3.scaleBand()
      .rangeRound([margin.left, size.width - margin.right])
      .domain(xCategories)
      .padding(0.2);

    let yScale = d3.scaleLinear()
      .range([size.height - margin.bottom, margin.top])
      .domain([0, yExtents[1]]);

    const xAxis = chartContainer.append('g')
      .attr('transform', `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    const yAxis = chartContainer.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));

    const yLabel = chartContainer.append('g')
      .attr('transform', `translate(${margin.left / 4}, ${size.height / 1.5}) rotate(-90)`)
      .append('text')
      .text('Percent of Student Population')
      .style('font-size', '.8rem');

    const xLabel = chartContainer.append('g')
      .attr('transform', `translate(${(size.width - margin.left) / 2}, ${size.height - margin.top})`)
      .append('text')
      .text('Mental Health Issues')
      .style('font-size', '.8rem');

    const chartBars = chartContainer.append('g')
      .selectAll('g')
      .data<CategoricalBar>(bars)
      .join('g')
      .attr('transform', (d: CategoricalBar) => `translate(${xScale(d.category)}, 0)`);

    // First bar (pink)
    chartBars.append('rect')
      .attr('x', 0)
      .attr('y', (d: CategoricalBar) => yScale(d.fem_value) as number)
      .attr('width', xScale.bandwidth() / 2) // Half the bandwidth for the first bar
      .attr('height', (d: CategoricalBar) => Math.abs(yScale(0) - yScale(d.fem_value)))
      .attr('fill', 'pink');

    // Second bar (blue)
    chartBars.append('rect')
      .attr('x', xScale.bandwidth() / 2) // Shift the second bar to the right
      .attr('y', (d: CategoricalBar) => yScale(d.mal_value) as number)
      .attr('width', xScale.bandwidth() / 2)
      .attr('height', (d: CategoricalBar) => Math.abs(yScale(0) - yScale(d.mal_value)))
      .attr('fill', 'blue');

    const title = chartContainer.append('g')
      .append('text')
      .attr('transform', `translate(${size.width / 2}, ${size.height - margin.top + 15})`)
      .attr('dy', '0.5rem')
      .style('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .text('Breakdown of Mental Issues By Gendered Population');

    const legend = chartContainer.append('g')
      .attr('transform', `translate(${size.width - margin.right - 60}, ${margin.top})`);

    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 20)
      .attr('height', 20)
      .attr('fill', 'pink');

    legend.append('text')
      .attr('x', 25)
      .attr('y', 15)
      .text('Female')
      .style('font-size', '.8rem');

    legend.append('rect')
      .attr('x', 0)
      .attr('y', 25)
      .attr('width', 20)
      .attr('height', 20)
      .attr('fill', 'blue');

    legend.append('text')
      .attr('x', 25)
      .attr('y', 40)
      .text('Male')
      .style('font-size', '.8rem');
}

  return (
    <>
      <div ref={barRef} className='chart-container'>
        <svg id='bar-svg' width='100%' height='100%'></svg>
      </div>
    </>
  )
}
