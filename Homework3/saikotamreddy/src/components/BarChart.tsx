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
  all_value: number;
}



export default function BarChart({mentalDisorder, selectedYear, setSelectedYear}) {
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
        console.log(mentalDisorder)
        const csvData = await d3.csv('../../data/Student Mental health.csv', d => {
          return {gender: d['Choose your gender'], year: d['Your current year of Study'].toLowerCase(), Depression: d['Do you have Depression?'], Anxiety: d['Do you have Anxiety?'], Panic: d['Do you have Panic attack?']};
        });
        let depressionCount=0
        let noDepressionCount=0
        //First value has depression count, second is no depression count
        let maleCount=[0,0]
        let femaleCount=[0,0]
        let year_list=['year 1', 'year 2', 'year 3','year 4']
        //First value is male with depression, 2nd is male with no depression, female with depression, female without depression
        let years={'year 1':[0,0,0,0], 'year 2':[0,0,0,0], 'year 3':[0,0,0,0], 'year 4':[0,0,0,0]}
        for(let student in csvData){
          if(csvData[student].gender==undefined){
            continue;
          }
          if(csvData[student].gender=='Male'){
            if(csvData[student][mentalDisorder]=='Yes'){
              depressionCount=depressionCount+1
              maleCount[0]=maleCount[0]+1
              years[csvData[student]['year'] as keyof typeof years][0]=years[csvData[student]['year'] as keyof typeof years][0]+1
            }
            else{
              noDepressionCount=noDepressionCount+1
              maleCount[1]=maleCount[1]+1
              years[csvData[student]['year'] as keyof typeof years][1]=years[csvData[student]['year'] as keyof typeof years][1]+1
            }
          }
          else{
            if(csvData[student][mentalDisorder]=='Yes'){
              depressionCount=depressionCount+1
              femaleCount[0]=femaleCount[0]+1
              years[csvData[student]['year'] as keyof typeof years][2]=years[csvData[student]['year'] as keyof typeof years][2]+1
            }
            else{
              noDepressionCount=noDepressionCount+1
              femaleCount[1]=femaleCount[1]+1
              years[csvData[student]['year'] as keyof typeof years][3]=years[csvData[student]['year'] as keyof typeof years][3]+1
            }
          }
        }
        let categories=
        [
          {category: 'All Years', all_value: (femaleCount[0]+maleCount[0])/(femaleCount[0]+femaleCount[1]+maleCount[0]+maleCount[1]), fem_value: femaleCount[0]/(femaleCount[0]+femaleCount[1]), mal_value: maleCount[0]/(maleCount[0]+maleCount[1])},
          {category: 'Year 1', all_value: (years['year 1'][0]+years['year 1'][2])/(years['year 1'][0]+years['year 1'][1]+years['year 1'][2]+years['year 1'][3]), fem_value: years['year 1'][2]/(years['year 1'][2]+years['year 1'][3]), mal_value: years['year 1'][0]/(years['year 1'][0]+years['year 1'][1])},
          {category: 'Year 2', all_value: (years['year 2'][0]+years['year 2'][2])/(years['year 2'][0]+years['year 2'][1]+years['year 2'][2]+years['year 2'][3]), fem_value: years['year 2'][2]/(years['year 2'][2]+years['year 2'][3]), mal_value: years['year 2'][0]/(years['year 2'][0]+years['year 2'][1])},
          {category: 'Year 3', all_value: (years['year 3'][0]+years['year 3'][2])/(years['year 3'][0]+years['year 3'][1]+years['year 3'][2]+years['year 3'][3]), fem_value: years['year 3'][2]/(years['year 3'][2]+years['year 3'][3]), mal_value: years['year 3'][0]/(years['year 3'][0]+years['year 3'][1])},
          {category: 'Year 4', all_value: (years['year 4'][0]+years['year 4'][2])/(years['year 4'][0]+years['year 4'][1]+years['year 4'][2]+years['year 4'][3]), fem_value: years['year 4'][2]/(years['year 4'][2]+years['year 4'][3]), mal_value: years['year 4'][0]/(years['year 4'][0]+years['year 4'][1])},
        
        ]
        setBars(categories);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    } 
    dataFromCSV();
  }, [mentalDisorder])

  useEffect(() => {
    if (isEmpty(bars)) return;
    if (size.width === 0 || size.height === 0) return;
    d3.select('#bar-svg').selectAll('*').remove();
    initChart();
  }, [bars, size, selectedYear])

  function initChart() {

    let chartContainer = d3.select('#bar-svg');

    let yExtents = d3.extent(bars.map((d: CategoricalBar) => Math.max(d.fem_value, d.all_value, d.mal_value) as number)) as [number, number];
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
      .text('Percent of Group Who Have '+String(mentalDisorder).charAt(0).toUpperCase()+String(mentalDisorder).slice(1))
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


      const updateHighlighting = () => {
        chartBars.selectAll('rect')
          .style('opacity', (d) => {
            // Dim bars if they do not belong to the selected category
            return selectedYear && d.category !== selectedYear ? 0.3 : 1;
          });
      };
      const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "#fff")
      .style("padding", "5px")
      .style("border-radius", "4px")
      .style("font-size", "0.8rem")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Function to show the tooltip
    const showTooltip = (event, d, gender, value) => {
      tooltip.style("opacity", 1)
        .html(`Year: ${d.category}<br>Gender: ${gender}<br>Percent of Population: ${value}`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    };

    // Function to hide the tooltip
    const hideTooltip = () => {
      tooltip.style("opacity", 0);
    };
      
      // Handle bar click event to update the selected category
      chartBars.on('click', function(event, d) {
        // Toggle selection or clear if the same category is clicked again
        setSelectedYear(selectedYear === d.category ? null : d.category);
        updateHighlighting();
        hideTooltip();
      });
    
    // First bar (pink)
    chartBars.append('rect')
      .attr('x', xScale.bandwidth() / 3)
      .attr('y', (d: CategoricalBar) => yScale(d.fem_value) as number)
      .attr('width', xScale.bandwidth() / 3) // Half the bandwidth for the first bar
      .attr('height', (d: CategoricalBar) => Math.abs(yScale(0) - yScale(d.fem_value)))
      .attr('fill', 'pink')
      .on("mouseover", (event, d) => showTooltip(event, d, "Female", Math.round(d.fem_value*1000)/1000))
      .on("mouseout", hideTooltip);

    // Second bar (blue)
    chartBars.append('rect')
      .attr('x', 2*xScale.bandwidth() / 3) // Shift the second bar to the right
      .attr('y', (d: CategoricalBar) => yScale(d.mal_value) as number)
      .attr('width', xScale.bandwidth() /3)
      .attr('height', (d: CategoricalBar) => Math.abs(yScale(0) - yScale(d.mal_value)))
      .attr('fill', 'blue')
      .on("mouseover", (event, d) => showTooltip(event, d, "Male", Math.round(d.mal_value*1000)/1000))
      .on("mouseout", hideTooltip);

      chartBars.append('rect')
      .attr('x', 0) // Shift the second bar to the right
      .attr('y', (d: CategoricalBar) => yScale(d.all_value) as number)
      .attr('width', xScale.bandwidth() / 3)
      .attr('height', (d: CategoricalBar) => Math.abs(yScale(0) - yScale(d.all_value)))
      .attr('fill', 'purple')
      .on("mouseover", (event, d) => showTooltip(event, d, "Both Genders", Math.round(d.all_value*1000)/1000))
      .on("mouseout", hideTooltip);
    
      updateHighlighting();

    const title = chartContainer.append('g')
      .append('text')
      .attr('transform', `translate(${size.width / 2}, ${size.height - margin.top + 15})`)
      .attr('dy', '0.5rem')
      .style('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .text('Breakdown of Mental Issues By Gendered Population');

    const legend = chartContainer.append('g')
      .attr('transform', `translate(${size.width - margin.right - 90}, ${margin.top})`);

    legend.append('rect')
      .attr('x', 0)
      .attr('y', 25)
      .attr('width', 20)
      .attr('height', 20)
      .attr('fill', 'pink');

    legend.append('text')
      .attr('x', 25)
      .attr('y', 40)
      .text('Female')
      .style('font-size', '.8rem');

    legend.append('rect')
      .attr('x', 0)
      .attr('y', 50)
      .attr('width', 20)
      .attr('height', 20)
      .attr('fill', 'blue');

    legend.append('text')
      .attr('x', 25)
      .attr('y', 65)
      .text('Male')
      .style('font-size', '.8rem');

      legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 20)
      .attr('height', 20)
      .attr('fill', 'purple');

    legend.append('text')
      .attr('x', 25)
      .attr('y', 15)
      .text('Both Genders')
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
