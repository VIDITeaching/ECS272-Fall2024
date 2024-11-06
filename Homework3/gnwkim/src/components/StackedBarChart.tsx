import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3';
import { Paper, Divider, Button } from '@mui/material';
import { useState } from 'react';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

import { Margin, ComponentSize } from '.../types.ts';
import { isEmpty } from 'lodash';

interface CountryMedals { 
  country_name: string;
  country_name_long: string;
  country_code: string;
  gold: number; 
  silver: number; 
  bronze: number, 
  total: number; 
}

const StackedBarChart = ({ start, end } : { start: number, end: number }) => {
  
  const [data, setData] = useState<CountryMedals[]>([])
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 })

  const margin: Margin = { top: 20, bottom: 35, left: 50, right: 20 }

  const chartRef = useRef<HTMLDivElement>(null)
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 0)
  useResizeObserver({ ref: chartRef, onResize })

  // reading and procesing data.
  useEffect(() => {
    const dataFromCSV = async () => {
      try {

        /* PREPROCESSING */
        const medalData = await d3.csv('../../data/archive/medals.csv', d => {
          // d is a row; this function maps each row to a new row.
          const medalNameMap = new Map([
            ['Gold Medal', 'gold'],
            ['Silver Medal', 'silver'],
            ['Bronze Medal', 'bronze']
          ])

          const row = {
            country_code: d.country_code,
            country_name: d.country,
            country_name_long: d.country_long,
            medal: medalNameMap.get(d.medal_type) ?? 'undefined'
          }
          return row
        })
        
        const medalCountryData: CountryMedals[] = []
        
        medalData.forEach(({ country_code, country_name, country_name_long, medal }) => {

          let country = medalCountryData.find(c => c.country_code === country_code);

          // If the country doesn't exist, create a new entry
          if (!country) {
            country = {
              country_code,
              country_name,
              country_name_long,
              gold: 0,
              silver: 0,
              bronze: 0,
              total: 0
            };
            medalCountryData.push(country);
          }
  
          // Increment the appropriate medal count and total
          if (medal === 'gold') {
            country.gold += 1;
          } else if (medal === 'silver') {
            country.silver += 1;
          } else if (medal === 'bronze') {
            country.bronze += 1;
          }
          
          // Increment the total if the medal is valid
          if (medal === 'gold' || medal === 'silver' || medal === 'bronze') {
            country.total += 1;
          }
        })

        // console.log(medalCountryData)
        setData(medalCountryData)
        

      } catch (error) {
        console.error('Error loading CSV:', error)
      }
    }
    dataFromCSV()

  }, [])

  useEffect(() => {
    if (isEmpty(data)) return
    if (size.width === 0 || size.height === 0) return
    d3.select('#stacked-bar-svg').selectAll('*').remove() // clear container
    initChart()
  })

  const initChart = () => {

    // console.log('init chart called.')

    // only show some of the data
    const truncatedData = data.sort((a, b) => b.total - a.total).slice(start, end)
 
    const chartContainer = d3.select('#stacked-bar-svg')

    const yMax: number = d3.max(truncatedData.map((d3: CountryMedals) => d3.total)) as number
    const xCategories: string[] = [...new Set(truncatedData.map((d: CountryMedals) => d.country_code))]
    
    // set up scales.
    const xScale = d3.scaleBand()
      .rangeRound([margin.left, size.width - margin.right])
      .domain(xCategories)
      .padding(0.1) // spacing between categories

    
    const yScale = d3.scaleLinear()
      .domain([0, yMax])
      .range([size.height - margin.bottom, margin.top])


    // x and y axis
    chartContainer.append('g')
      .attr('transform', `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(xScale))

    chartContainer.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale))


    // axis labels
    chartContainer.append('g')
      .attr('transform', `translate(${margin.left / 3}, ${size.height / 2}) rotate(-90)`)
      .append('text')
      .text('Total medals')
      .style('font-size', '.8rem')
      .style('text-anchor', 'middle')

    chartContainer.append('g')
      .attr('transform', `translate(${margin.left + (size.width - margin.left - margin.right) / 2}, ${size.height - margin.bottom / 9})`)
      .append('text')
      .text('Countries')
      .style('text-anchor', 'middle')
      .style('font-size', '.8rem')

    
    // chart title
    chartContainer.append('g')
      .attr('transform', `translate(${size.width / 2}, ${margin.top})`)
      .append('text')
      .text('Medals earned by each country')
      .style('font-size', '1rem')
      .style('text-anchor', 'middle')


    // stacked bars 
    // very useful for stacking data!
    const stack = d3.stack<CountryMedals>()
      .keys(['bronze', 'silver', 'gold'])
    const stackedData = stack(truncatedData)

    const tooltip = chartContainer.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('color', 'white')
      .style('pointer-events', 'none')

    chartContainer.append('g')
      .selectAll('g')
      .data(stackedData)
      .join('g')
      .attr('fill', (d, i) => ['rgb(205, 160, 128)', 'rgb(216, 216, 216)', 'rgb(255, 223, 127)'][i])
      .selectAll('rect')
      .data(d => d as Array<[number, number] & { data: CountryMedals }>)
      .join('rect')
      .attr('x', (d) => xScale(d.data.country_code) as number)
      .attr('y', (d) => yScale(d[1]) as number)
      .attr('height', (d) => Math.abs(yScale(d[0]) - yScale(d[1]))) 
      .attr('width', xScale.bandwidth())


      .on('mouseover', (e, d) => {
        const rect = d3.select(e.target)
        const x = +rect.attr('x') // + converts to a number
        const y = +rect.attr('y')
        const width = +rect.attr('width')
        const height = +rect.attr('height')
        
        // update tooltip to show medal counts
        tooltip.text(`${d[1] - d[0]}`)
          .attr('x', x + width / 2)
          .attr('y', y + height / 2)
          .style('opacity', 1)
        tooltip.raise()
      })

      .on('mouseout', () => {
        tooltip.style('opacity', 0)
      })
  }

  return (
    <>
      {/* <div ref={chartRef} className='chart-container' style={{border: '1px solid black'}}> */}
      <div ref={chartRef} className='chart-container'>
      <div id='tooltip' 
        style={{ 
          position: 'absolute', 
          display: 'none', 
          pointerEvents: 'none', 
          backgroundColor: 'rgba(0, 0, 0, 0.7)', 
          color: 'white', 
          padding: '5px', 
          borderRadius: '3px', 
          fontSize: '0.8rem' }} 
      />
        <svg id='stacked-bar-svg' width='100%' height='100%'/>
      </div>
    </>
  )
}

export default StackedBarChart