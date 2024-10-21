import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import dataFromJson from '../../data/demo.json';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

import { Bar, ComponentSize, Margin } from '../types';
interface HierarchyData {
  name: string;
  children?: HierarchyData[];
}

interface MentalData {
  name: string;
  value: number;
}



export default function Dendrogram() {
  const [bars, setBars] = useState<MentalData[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 40, right: 70, bottom: 80, left: 90 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)

  useResizeObserver({ ref: barRef, onResize });
  
  useEffect(() => {
    
    // For reading csv file
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/Student Mental health.csv', d => {
          return {gender: d['Choose your gender'], year: d['Your current year of Study'], depression: d['Do you have Depression?'], anxiety: d['Do you have Anxiety?'], panic: d['Do you have Panic attack?']};
        });
        //A=Depression, B=No depression, C=Anxiety, D=no anxiety, E=Panic, F=No panic
        let A=0
        let B=0
        let AC=0
        let AD=0
        let BC=0
        let BD=0
        let ACE=0
        let ACF=0
        let ADE=0
        let ADF=0
        let BCE=0
        let BCF=0
        let BDE=0
        let BDF=0
        for(let student in csvData){
          if(csvData[student].gender==undefined){
            continue;
          }
          if(csvData[student].depression=='Yes'){
            A=A+1
            if(csvData[student].anxiety=='Yes'){
              AC=AC+1
              if(csvData[student].panic=='Yes'){
                ACE=ACE+1
              }
              else{
                ACF=ACF+1
              }
            }
            else{
              AD=AD+1
              if(csvData[student].panic=='Yes'){
                ADE=ADE+1
              }
              else{
                ADF=ADF+1
              }
            }
          }
          else{
            B=B+1
            if(csvData[student].anxiety=='Yes'){
              BC=BC+1
              if(csvData[student].panic=='Yes'){
                BCE=BCE+1
              }
              else{
                BCF=BCF+1
              }
            }
            else{
              BD=BD+1
              if(csvData[student].panic=='Yes'){
                BDE=BDE+1
              }
              else{
                BDF=BDF+1
              }
            }
        }
      }
        let categories=
        [
          {name: 'Depression', value: A},
          {name: 'No Depression', value: B},
          {name: 'Depression & Anxiety', value: AC},
          {name: 'Depression & No Anxiety', value: AD},
          {name: 'No Depression & Anxiety', value: BC},
          {name: 'No Depression & No Anxiety', value: BD},
          {name: 'Depression & Anxiety & Panic', value: ACE},
          {name: 'Depression & No Anxiety & Panic', value: ADE},
          {name: 'No Depression & Anxiety & Panic', value: BCE},
          {name: 'No Depression & No Anxiety & Panic', value: BDE},
          {name: 'Depression & Anxiety & No Panic', value: ACF},
          {name: 'Depression & No Anxiety & No Panic', value: ADF},
          {name: 'No Depression & Anxiety & No Panic', value: BCF},
          {name: 'No Depression & No Anxiety & No Panic', value: BDF},
        ]
        console.log(categories)
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
    d3.select('#dendro-svg').selectAll('*').remove();
    initChart();
  }, [bars, size])

  function initChart() {
    let svg = d3.select('#dendro-svg');

svg.selectAll('*').remove();

// Define hierarchical data (3 layers, 2 branches per layer)
const data: HierarchyData = {
  name: 'Students: ' + (bars[0].value + bars[1].value).toLocaleString(),
  children: [
    {
      name: 'Depression: ' + bars[0].value.toLocaleString(),
      children: [
        {
          name: 'Depression & Anxiety: ' + bars[2].value.toLocaleString(),
          children: [
            {
              name: 'Depression & Anxiety & Panic: ' + bars[6].value.toLocaleString(),
            },
            {
              name: 'Depression & Anxiety & No Panic: ' + bars[10].value.toLocaleString(),
            },
          ],
        },
        {
          name: 'Depression & No Anxiety: ' + bars[3].value.toLocaleString(),
          children: [
            {
              name: 'Depression & No Anxiety & Panic: ' + bars[7].value.toLocaleString(),
            },
            {
              name: 'Depression & No Anxiety & No Panic: ' + bars[11].value.toLocaleString(),
            },
          ],
        },
      ],
    },
    {
      name: 'No Depression: ' + bars[1].value.toLocaleString(),
      children: [
        {
          name: 'No Depression & Anxiety: ' + bars[4].value.toLocaleString(),
          children: [
            {
              name: 'No Depression & Anxiety & Panic: ' + bars[8].value.toLocaleString(),
            },
            {
              name: 'No Depression & Anxiety & No Panic: ' + bars[12].value.toLocaleString(),
            },
          ],
        },
        {
          name: 'No Depression & No Anxiety: ' + bars[5].value.toLocaleString(),
          children: [
            {
              name: 'No Depression & No Anxiety & Panic: ' + bars[9].value.toLocaleString(),
            },
            {
              name: 'No Depression & No Anxiety & No Panic: ' + bars[13].value.toLocaleString(),
            },
          ],
        },
      ],
    },
  ],
};

// Set dimensions and margins for the diagram
const width = size.width - 150;
const height = size.height;
const margin = { top: 20, right: 200, bottom: 10, left: 150 };

const root = d3.hierarchy<HierarchyData>(data);
const treeLayout = d3.tree<HierarchyData>().size([size.height, size.width - 2 * margin.left - margin.right]);
const nodes = treeLayout(root);

// Add title
svg.append('text')
  .attr('x', width / 2)
  .attr('y', margin.top )
  .attr('text-anchor', 'middle')
  .style('font-size', '24px')
  .style('font-family', 'Arial, sans-serif')
  .style('font-weight', 'bold')
  .style('fill', '#333')
  .text('Mental Issue Overlap'); 

const g = svg
  .attr('width', size.width)
  .attr('height', size.height)
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

// Curved links (Bezier curves)
g.selectAll('.link')
  .data(nodes.links())
  .enter()
  .append('path')
  .attr('class', 'link')
  .attr('fill', 'none')
  .attr('stroke', '#999')
  .attr('stroke-width', '2px')
  .attr('d', d => {
    const source = d.source;
    const target = d.target;
    return `M${source.y},${source.x}C${(source.y + target.y) / 2},${source.x} ${(source.y + target.y) / 2},${target.x} ${target.y},${target.x}`;
  });

// Add nodes
const node = g
  .selectAll('.node')
  .data(nodes.descendants())
  .enter()
  .append('g')
  .attr('class', 'node')
  .attr('transform', d => `translate(${d.y},${d.x})`);

// Add gradient color to circles
node.append('circle')
  .attr('r', 6)
  .attr('fill', 'url(#gradient)')
  .attr('stroke', '#6baed6')
  .attr('stroke-width', '2px');

// Define gradient
svg.append('defs')
  .append('linearGradient')
  .attr('id', 'gradient')
  .attr('x1', '0%')
  .attr('y1', '0%')
  .attr('x2', '100%')
  .attr('y2', '100%')
  .selectAll('stop')
  .data([
    { offset: '0%', color: '#fff' },
    { offset: '100%', color: '#6baed6' }
  ])
  .enter()
  .append('stop')
  .attr('offset', d => d.offset)
  .attr('stop-color', d => d.color);

// Add hover effect for text
node.append('text')
  .attr('dy', '.35em')
  .attr('x', d => (d.children ? 38 : 10))
  .attr('y', d => (d.children ? 20 : 0))
  .attr('text-anchor', d => (d.children ? 'end' : 'start'))
  .style('font-family', 'Arial, sans-serif')
  .style('font-size', '14px')
  .style('fill', '#333')
  .text(d => d.data.name)
  .on('mouseover', function () {
    d3.select(this).style('font-weight', 'bold').style('fill', '#000');
  })
  .on('mouseout', function () {
    d3.select(this).style('font-weight', 'normal').style('fill', '#333');
  });

// Add smooth transition
node.transition()
  .duration(500)
  .attr('transform', d => `translate(${d.y},${d.x})`);

}

  return (
    <>
      <div ref={barRef} className='chart-container'>
        <svg id='dendro-svg' width='100%' height='100%'></svg>
      </div>
    </>
  )
}
