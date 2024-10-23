import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3';
import { Paper, Divider, Button, containerClasses } from '@mui/material';
import { useState } from 'react';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

import { Margin, ComponentSize } from '.../types.ts';
import { isEmpty, truncate } from 'lodash';

interface Medal {
  medal_type: string;
  medal_date: string;
  name: string;
  gender: string;
  discipline: string;
  event: string;
  country_long: string;
  country_code: string;
}

interface Node {
  name: string;
  stage: number;
  total: number;
}

interface PositionedNode extends Node {
  x: number
}

interface Link {
  source: number;
  target: number;
  value: number;
  country: string;
}

interface SankeyData {
  nodes: Node[];
  links: Link[];
}

const ParallelSet = ({ countries }: { countries: string[] }) => {

  const [data, setData] = useState<SankeyData>({ nodes: [], links: [] })
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 })

  const margin: Margin = { top: 40, bottom: -30, left: 20, right: 20 }

  const chartRef = useRef<HTMLDivElement>(null)
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 0)
  useResizeObserver({ ref: chartRef, onResize })

  useEffect(() => {
    //
    const dataFromCSV = async () => {
      try {

        // load the dataframes
        d3.csv<Medal>('../../data/archive/medals.csv', d => {
          return {
            medal_type: d.medal_type,
            medal_date: d.medal_date,
            name: d.name,
            gender: d.gender,
            discipline: d.discipline,
            event: d.event,
            country_long: d.country_long,
            country_code: d.country_code  
          } 
        }).then(data => {
          console.log(data)
          const nodes: Node[] = []
          const links: Link[] = []
          // source and target are indices of nodes

          const countryMap = new Map<string, number>()
          const disciplineMap = new Map<string, number>()
          const eventMap = new Map<string, number>()

          const requiredDicipline = new Map<string, boolean>()
          const requiredEvent = new Map<string, boolean>()

          let nodeIndex = 0

          // create nodes

          // nodes for countries (stage 1)
          data.forEach(d => {
            // only create a node if we are keeping track
            if (countries.indexOf(d.country_code) == -1) return
            if (!countryMap.has(d.country_long)) {
              countryMap.set(d.country_long, nodeIndex)
              nodes.push({ name: d.country_long, stage: 1, total: 1 })
              nodeIndex++
              return
            } else {
              nodes[countryMap.get(d.country_long)!].total += 1
            } 
          })

          console.log('node after adding countries:', nodes.slice())

          data.forEach(d => {
            // initially add the discipline
            if (!requiredDicipline.has(d.discipline)) {
              requiredDicipline.set(d.discipline, false)
            }
            if (!requiredEvent.has(d.event)) {
              requiredEvent.set(d.event, false)
            }
            // set the event 
            if (countries.indexOf(d.country_code) > -1) {
              requiredDicipline.set(d.discipline, true)
              requiredEvent.set(d.event, true)
            }
          })

          
          // console.log('requiredDicipline', requiredDicipline)
          // let count = 0
          // requiredDicipline.forEach((value, key) => {
          //   if (value) count++
          // })
          // console.log('there are', count, 'true events')
          // console.log('requiredEvent', requiredEvent)
          

          // nodes for discipline (stage 2)
          data.forEach(d => {
            if (!requiredDicipline.get(d.discipline)) return
            if (!disciplineMap.has(d.discipline)) {
              disciplineMap.set(d.discipline, nodeIndex)
              nodes.push({ name: d.discipline, stage: 2, total: 1 })
              nodeIndex++
            } else {
              nodes[disciplineMap.get(d.discipline)!].total += 1
            }
          });

          // nodes for sub-events (stage 3)
          data.forEach(d => { 
            if (!requiredEvent.get(d.event)) return
            if (!eventMap.has(d.event)) {
              eventMap.set(d.event, nodeIndex)
              nodes.push({ name: d.event, stage: 3, total: 1})
              nodeIndex++
            } else {
              nodes[eventMap.get(d.event)!].total += 1
            }
          })

          // create links

          // country to discipline links
          const countryToDisciplineMap = new Map<string, number>()
          // for each medal, increment (country, event) 
          data.forEach(d => {
            if (countries.indexOf(d.country_code) == -1) return
            if (!requiredDicipline.get(d.discipline)) return

            // the ! overrides the ts checks that the expression may be null
            // you are certain that it won't be null
            const countryId = countryMap.get(d.country_long)!
            const disciplineId = disciplineMap.get(d.discipline)!
            const key = `${countryId}-${disciplineId}`

            if (!countryToDisciplineMap.has(key)) {
              countryToDisciplineMap.set(key, 1)
            } else {
              countryToDisciplineMap.set(key, countryToDisciplineMap.get(key)! + 1)
            }
          })

          // add to links
          countryToDisciplineMap.forEach((value, key) => {
            const [countryId, disiplineId] = key.split('-').map(Number)
            
            // can deduce name of country
            let countryName = ''
            countryMap.forEach((value, key) => {
              if (+value === countryId) countryName = key 
            })

            links.push({
              source: countryId,
              target: disiplineId,
              value: value,
              country: countryName
            })
          })

          console.log('after adding country to disipline links', links.slice())

          // disiplines to events link
          // identical code structure as above (HOFs?)
          const disciplineToEventMap = new Map<string, number>()
          data.forEach(d => {
            if (countries.indexOf(d.country_code) == -1) return
            if (!requiredDicipline.get(d.discipline)) return
            if (!requiredEvent.get(d.event)) return
            
            const countryId = countryMap.get(d.country_long)
            const disciplineId = disciplineMap.get(d.discipline)!
            const eventId = eventMap.get(d.event)!
            const key = `${countryId}-${disciplineId}-${eventId}`

            if (!disciplineToEventMap.has(key)) {
              disciplineToEventMap.set(key, 1)
            } else {
              disciplineToEventMap.set(key, disciplineToEventMap.get(key)! + 1)
            }
          })

          
          disciplineToEventMap.forEach((value, key) => {
            const [countryId, eventCategoryId, eventId] = key.split('-').map(Number)

            // can deduce name of country
            let countryName = ''
            countryMap.forEach((value, key) => {
              if (+value === countryId) countryName = key 
            })

            links.push({
              source: eventCategoryId,
              target: eventId,
              value: value,
              country: countryName
            })
          })
          
          // console.log('after adding disipline to event links', links.slice())
          
          console.log(links.sort((a,b) => a.source - b.source).map(({source, target, value}) => {
            const sourceName = nodes[source].name
            const targetName = nodes[target].name
            return `${sourceName} --- ${value} --> ${targetName}`
          }))

          setData({ nodes: nodes, links: links })
        })


      } catch (error) {
        console.error('Error loading CSV:', error)
      }
    }
    
    dataFromCSV()
    //
    /*/ temp data
    setData({
      nodes: [
        // country
        { name: 'country1', stage: 1, total: 5 }, // 0 
        { name: 'country2', stage: 1, total: 3 }, // 1

        // discipline
        { name: 'running', stage: 2, total: 6 }, // 2

        // event
        { name: 'long distance', stage: 3, total: 3 }, // 3
        { name: 'short distance', stage: 3, total: 3 }, // 4
      ],
      links: [
        { source: 1, target: 2, value: 2, country: 'country2' }, // 'country2' has won 2 medals from 'running'
        { source: 0, target: 2, value: 1, country: 'country1' }, // 'country1' has won 1 medal from 'running'
        { source: 2, target: 4, value: 1, country: 'country2' }, // 'country2' has won 1 medal from 'running/short distance'
        { source: 2, target: 3, value: 1, country: 'country1' }, // 'country1' has won 1 medal from 'running/long distance'
        { source: 2, target: 3, value: 1, country: 'country2' }, // 'country2' has won 1 medal from 'running/long distance'
      ]
    })
    /*/

  }, [countries])

  useEffect(() => {
    if (isEmpty(data)) return
    if (size.width === 0 || size.height === 0) return
    d3.select('#sankey-svg').selectAll('*').remove() // clear container
    initChart()
  }, [data, size])

  const initChart = () => {

    const chartContainer = d3.select('#sankey-svg')

    const nodesByStage = d3.group(data.nodes, d => d.stage)

    // calculate x positions (in medals) of each node
    const positionedNodes: PositionedNode[] = []
    nodesByStage.forEach((nodes, stage) => {
      let currX = 0
      nodes.forEach(node => {
        const pNode: PositionedNode = {
          ...node,
          x: currX
        }
        positionedNodes.push(pNode)
        currX += node.total
      })
    })

    // determine the widths (in medals) of the stages
    const stageWidths = new Map<number, number>()
    nodesByStage.forEach((nodes, stage) => {
      let width = 0
      nodes.forEach((node) => {
        width += node.total
      })
      stageWidths.set(stage, width)
    })

    // create scale for each stage
    const stageXScales = new Map<number, d3.ScaleLinear<number, number>>()
    stageWidths.forEach((total, stage) => {
      const scale = d3.scaleLinear()
        .domain([0, total])
        .range([margin.left, size.width - margin.right])

      stageXScales.set(stage, scale)
    })

    // create a scale for mapping stages to correct height
    // note: this is basically a map
    const stageYScale = d3.scaleBand()
      .domain([1, 2, 3].map(String))
      .range([margin.top, size.height - margin.bottom])
      .padding(0.8)
      .paddingOuter(0)

    // draw categories (nodes) 
    chartContainer.append('g')
      .selectAll('rect')
      .data(positionedNodes)
      .join('rect')
      .attr('x', d => stageXScales.get(d.stage)!(d.x))
      .attr('y', d => stageYScale(d.stage.toString())!)
      .attr('width', d => Math.abs(stageXScales.get(d.stage)!(d.total) - stageXScales.get(d.stage)!(0)))
      .attr('height', 30)
      .style('fill', 'none')
      .style('stroke', 'black')

    // category labels
    chartContainer.append('g')
      .selectAll('text')
      .data(positionedNodes)
      .join('text')
      .attr('x', d => stageXScales.get(d.stage)!(d.x) + Math.abs(stageXScales.get(d.stage)!(d.total) - stageXScales.get(d.stage)!(0)) / 2)
      .attr('y', d => stageYScale(d.stage.toString())! + 17)
      .text(d => d.name)
      .attr('font-size', '12px')
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')

    // draw title
    chartContainer.append('g')
      .attr('transform', `translate(${size.width / 2}, ${margin.top / 2})`)
      .append('text')
      .text('Where medals were earned')
      .style('font-size', '1rem')
      .style('text-anchor', 'middle')


    // function for generating tapered path (for links)
    const taperedLink = (source: [number, number], target: [number, number], sourceWidth: number, targetWidth: number) => {
      const midY = (source[1] + target[1]) / 2;  // Midpoint along the Y-axis

      return `
          M${source[0]},${source[1]}  
          C${source[0]},${midY} ${target[0]},${midY} ${target[0]},${target[1]}  
          L${target[0] + targetWidth},${target[1]}  
          C${target[0] + targetWidth},${midY} ${source[0] + sourceWidth},${midY} ${source[0] + sourceWidth},${source[1]}  
          Z
        `;
    }

    // tooltip
    const tooltip = chartContainer.append('text')

    // draw the links
    const nodeTargetOffsetMap = new Map<number, number>()
    const nodeSourceOffsetMap = new Map<number, number>()

    const countryNames = [...new Set(data.links.map(d => d.country))]
    const countryColorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(countryNames)

    d3.group(data.links, d => d.country).forEach((links, country) => {
      links.forEach((link) => {

        // determine the x offset of source and target links
        let sourceOffset = 0
        let targetOffset = 0
        if (!nodeSourceOffsetMap.has(link.source)) {
          nodeSourceOffsetMap.set(link.source, 0)
        } else {
          sourceOffset = nodeSourceOffsetMap.get(link.source)!
        }

        if (!nodeTargetOffsetMap.has(link.target)) {
          nodeTargetOffsetMap.set(link.target, 0)
        } else {
          targetOffset = nodeTargetOffsetMap.get(link.target)!
        }
     
        const sourceNode = positionedNodes[link.source]
        const targetNode = positionedNodes[link.target]
        const sourceXScale = stageXScales.get(sourceNode.stage)!
        const targetXScale = stageXScales.get(targetNode.stage)!
        
        const sourceWidth = Math.abs(sourceXScale(link.value) - sourceXScale(0))
        const targetWidth = Math.abs(targetXScale(link.value) - targetXScale(0))
    
        const path = taperedLink([sourceXScale(sourceNode.x) + sourceOffset, stageYScale(sourceNode.stage.toString())! + 30],
          [targetXScale(targetNode.x) + targetOffset, stageYScale(targetNode.stage.toString())!],
          sourceWidth,
          targetWidth
        )
    
        chartContainer.append('path')
          .attr('d', path)
          .attr('fill', countryColorScale(country))
          .attr('stroke', countryColorScale(country))
          .attr('fill-opacity', 0.4)
          .attr('stroke-opacity', 0.7)
          .on('mouseover', (e) => {
            const [x, y] = d3.pointer(e, chartContainer.node())
            tooltip.text(`${link.value}`)
              .attr('x', `${x}px`) // Adjust the 10px as padding
              .attr('y', `${y - 10}px`)  // Adjust the 10px as padding
          })
          .on('mousemove', (e) => {
            const [x, y] = d3.pointer(e, chartContainer.node())
            tooltip.text(`${link.value}`)
              .attr('x', `${x}px`) // Adjust the 10px as padding
              .attr('y', `${y-10}px`)  // Adjust the 10px as padding
          })
          .on('mouseout', () => {
            tooltip.text(''); // Optionally clear the tooltip text when the mouse leaves
          })

        // update offsets
        nodeSourceOffsetMap.set(link.source, sourceOffset + sourceWidth)
        nodeTargetOffsetMap.set(link.target, targetOffset + targetWidth)

      })
    })
  }

  return (
    <>
      <div ref={chartRef} className='chart-container'>
        {/* <div ref={chartRef} className='chart-container' > */}
        <svg id='sankey-svg' width='100%' height='100%' />
      </div>
    </>
  )
}

export default ParallelSet