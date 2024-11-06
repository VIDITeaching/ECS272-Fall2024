import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3';
import { Paper, Divider, Button } from '@mui/material';
import { useState } from 'react';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

import { Margin, ComponentSize } from '.../types.ts';
import { isEmpty, truncate } from 'lodash';

interface Data {
  country_code: string
  country_name: string
  country_name_long: string
  medalsPerAthlete: number
  numAthletes: number
  totalMedals: number
}

const ScatterPlot = () => {

  const [data, setData] = useState<Data[]>([])
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 })

  const margin: Margin = { top: 40, bottom: 35, left: 55, right: 20 }

  const chartRef = useRef<HTMLDivElement>(null)
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 0)
  useResizeObserver({ ref: chartRef, onResize })

  useEffect(() => {
    const dataFromCSV = async () => {
      try {

        // load the dataframes
        const medalData = await d3.csv('../../data/archive/medals.csv', d => {
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

        const athleteData = await d3.csv('../../data/archive/athletes.csv', d => {
          const row = {
            country_code: d.country_code
          }
          return row;
        })

        const countriesData = await d3.csv('../../data/archive/nocs.csv', d => {
          return {
            code: d.code,  // country code
            country: d.country,  // short country name
            country_long: d.country_long  // full country name
          }
        })

        const countryNameMap = new Map(
          countriesData.map(d => [d.code, { country: d.country, country_long: d.country_long }])
        );

        // count medals, and athlete counts for each country
        const medalCounts = d3.rollup(
          medalData,
          v => v.length,
          d => d.country_code
        )

        const athleteCounts = d3.rollup(
          athleteData,
          v => v.length,
          d => d.country_code
        )

        // create final data        
        const data = Array.from(medalCounts, ([country_code, totalMedals]) => {
          const numAthletes = athleteCounts.get(country_code) || 0
          const countryNames = countryNameMap.get(country_code)
          return {
            country_code,
            country_name: countryNames?.country ?? '',
            country_name_long: countryNames?.country_long ?? '',
            numAthletes,
            totalMedals,
            medalsPerAthlete: numAthletes > 0 ? totalMedals / numAthletes : 0
          }
        })

        // console.log(data)

        setData(data)

      } catch (error) {
        console.error('Error loading CSV:', error)
      }
    }
    dataFromCSV()

  }, [])

  useEffect(() => {
    if (isEmpty(data)) return
    if (size.width === 0 || size.height === 0) return
    d3.select('#scatter-svg').selectAll('*').remove() // clear container
    initChart()
  })

  const initChart = () => {

    // only show some of the data
    const truncatedData = data

    const chartContainer = d3.select('#scatter-svg')

    // set up scales.
    const xScale = d3.scaleLog()
      .domain([3, 1000])
      .range([margin.left, size.width - margin.right])
    // .nice()

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(truncatedData, (d: Data) => d.medalsPerAthlete) as number])
      .range([size.height - margin.bottom, margin.top])
      .nice()

    const radiusScale = d3.scaleSqrt()
      .domain([0, d3.max(truncatedData, (d: Data) => d.totalMedals) as number])
      .range([5, 40]);


    // x and y axis
    chartContainer.append('g')
      .attr('transform', `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'middle')

    chartContainer.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale))


    // axis labels
    chartContainer.append('g')
      .attr('transform', `translate(${margin.left / 3}, ${size.height / 2}) rotate(-90)`)
      .append('text')
      .text('Average medals per athlete')
      .style('text-anchor', 'middle')
      .style('font-size', '.8rem')

    chartContainer.append('g')
      .attr('transform', `translate(${(size.width - margin.left) / 2}, ${size.height - margin.bottom / 9})`)
      .append('text')
      .text('Number of athletes')
      .style('font-size', '.8rem')


    // chart title
    chartContainer.append('g')
      .attr('transform', `translate(${size.width / 2}, 20)`)
      .append('text')
      .text('Average medals per athlete vs number of athletes')
      .style('font-size', '1rem')
      .style('text-anchor', 'middle')

    const tooltipGroup = chartContainer.append('g')
      .style('pointer-events', 'none')  // Avoid interfering with mouse events
      .style('opacity', 0);

    // Create the rectangle for the background
    const tooltipBackground = tooltipGroup.append('rect')
      .attr('fill', 'black')  // Set the background color
      .attr('opacity', 0.7);   // Set some transparency

    // Create the text for the tooltip
    const tooltipText = tooltipGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', 'white')
      .style('font-size', '12px');

    chartContainer.append('g')
      .selectAll('circle')
      .data<Data>(data)
      .join('circle')
      .attr('cx', d => xScale(d.numAthletes))
      .attr('cy', d => yScale(d.medalsPerAthlete))
      .attr('r', d => radiusScale(d.totalMedals))
      .attr('fill', 'steelblue')
      .attr('opacity', 0.7)

      .on('mouseover', (e, d) => {
        const circle = d3.select(e.target)
        const x = +circle.attr('cx') // + converts to a number
        const y = +circle.attr('cy')

        tooltipText.text(`${d.country_name} (${d.totalMedals} medal(s), ${d.numAthletes} athletes)`)

        const textBBox = tooltipText.node()?.getBBox();

        if (textBBox)
          tooltipBackground
            .attr('x', textBBox.x - 1)
            .attr('y', textBBox.y - 1)
            .attr('width', textBBox.width + 2)
            .attr('height', textBBox.height + 2)

        tooltipGroup.style('opacity', 1)
          .attr('transform', `translate(${x}, ${y - 20})`)
          .raise()

      })
      .on('mouseout', (e, d) => {
        tooltipGroup.style('opacity', 0)
      })
  }

  return (
    <>
      {/* <div ref={chartRef} className='chart-container' style={{border: '1px solid black'}}> */}
      <div ref={chartRef} className='chart-container' >
        <svg id='scatter-svg' width='100%' height='100%' />
      </div>
    </>
  )
}

export default ScatterPlot