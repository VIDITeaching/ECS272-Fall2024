import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { sankey as d3Sankey, sankeyLinkHorizontal } from "d3-sankey";
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

import { Bar, ComponentSize, Margin } from '../types';
interface Node{
  name: string;
}
interface Link{
  source: number;
  target: number;
  names: string[];
  value: number;
}

type SankeyNodeExtra = {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  name: string;
  color?: string;
  value: number;
};

type SankeyLink = {
  source: SankeyNodeExtra;
  target: SankeyNodeExtra;
  value: number;
  width: number;
  color?: string;
  names:string[];
};

export default function Parallel() {
  const [links, setLinks] = useState<Link[]>([]);
  const [nodes, setNodes]= useState<Node[]>([])
  const parallelRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 40, right: 20, bottom: 80, left: 60 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)
  const [forceRender, setForceRender] = useState<number>(0); // Forcing re-render every second


  useResizeObserver({ ref: parallelRef, onResize });
  
  useEffect(() => {
    // For reading json file
    /*if (isEmpty(dataFromJson)) return;
    setBars(dataFromJson.data);*/
    
    // For reading csv file
    const dataFromCSV = async () => {
      try {
        if (parallelRef.current) {
          const { width, height } = parallelRef.current.getBoundingClientRect();
          onResize({ width, height });
        }
        const csvData = await d3.csv('../../data/Student Mental health.csv', d => {
          // This callback allows you to rename the keys, format values, and drop columns you don't need
          return {gender: d['Choose your gender'], year: d['Your current year of Study'].toLowerCase(), depression: d['Do you have Depression?'], anxiety: d['Do you have Anxiety?'], panic: d['Do you have Panic attack?']};
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
            if(csvData[student].depression=='Yes'){
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
            if(csvData[student].depression=='Yes'){
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
        let categories=["Depression", "No Depression", "Male", "Female", "year 1", "year 2", "year 3", "year 4"]
        let node_list: Array<Node>=[]
        for(let category in categories){
          node_list.push({name: category} as Node)
        }
        setNodes(node_list);
        console.log(years)

        //Add Link calculations here
        let layer_1=2
        let layer_2=2
        let layer_3=4
        let link_list: Array<Link> = []
        let source=0
        let target=0
        let genderCount=[maleCount, femaleCount]
        for(let i=0; i<layer_1; i=i+1){
          source=i
          for(let j=0; j<layer_2; j=j+1){
            target=j+layer_1
            let link = {
              source: source,
              target: target,
              names: [categories[source], categories[layer_1+j]],
              value: genderCount[j][i]
            } as Link;
            link_list.push(link)
          }
        }

        for(let i=0; i<layer_2*layer_1; i=i+1){
          source=Math.floor(i/2)+layer_1
          for(let j=0; j<layer_3; j=j+1){
            target=j+layer_2+layer_1
            let link = {
              source: source,
              target: target,
              names: [categories[Math.floor(i%2)], categories[layer_1+(Math.floor(i/2))], categories[layer_1+layer_2+j]],
              value: years[year_list[j] as keyof typeof years][i]
            } as Link;
            link_list.push(link)
          }
        }
        setLinks(link_list)

      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    } 
    dataFromCSV();
  }, [parallelRef])

  // Set interval to force re-render every second
  useEffect(() => {
    const interval = setInterval(() => {
      setForceRender(prev => prev + 1);
    }, 100);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  useEffect(() => {
    if (isEmpty(nodes) || isEmpty(links)) return;
    if (size.width === 0 || size.height === 0) return;
    d3.select('#parallel-svg').selectAll('*').remove();
    initChart();
  }, [nodes, links, size, forceRender])

  function initChart() {
    //Used https://observablehq.com/@d3/parallel-sets for parallel set syntax
    let categories=["Depression", "No Depression", "Male", "Female", "year 1", "year 2", "year 3", "year 4"]
    let svg = d3.select('#parallel-svg');
  
    const sankey = d3Sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[1, 1], [size.width - 130, size.height - 20]]);
  
    const { nodes: node_list, links: link_list } = sankey<SankeyNodeExtra, SankeyLink>({
      nodes: nodes.map(d => Object.assign({}, d)), 
      links: links.map(d => Object.assign({}, d))
    }) as { nodes: SankeyNodeExtra[], links: SankeyLink[] };
  
    const linkColor = (d: String) => {
      if (d === "Depression") {
        return "#ADD8E6"; // Blue for Depression source
      } else if (d === "No Depression") {
        return "#00FF00"; // Green for No Depression source
      }
      return "#000";
    };


    const title = svg.append('g')
      .append('text')
      .attr('transform', `translate(${size.width / 3}, ${size.height - margin.top + 25})`)
      .attr('dy', '0.5rem')
      .style('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .text('Depression vs No Depression Among Genders and Years');
    // Draw links
    svg
      .append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(link_list)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", d => linkColor(d.names[0]))
      .attr("stroke-width", d => Math.max(1, d.width))
      .attr("opacity", 0.5)
      .append("title")
      .text(d => `${d.names.join(" → ")}\n${d.value.toLocaleString()}`);
  
    svg
      .append("g")
      .selectAll("rect")
      .data(node_list)
      .join("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("height", d => d.y1 - d.y0)
      .attr("width", sankey.nodeWidth())
      .attr("fill", d => d.color || "#000")
      .append("title")
      .text(d => `${categories[parseInt(d.name)]}\n${d.value.toLocaleString()}`);

      svg.append("g")
      .style("font", "bold 10px sans-serif")
    .selectAll("text")
    .data(node_list)
    .join("text")
      .attr("x", d => d.x0 < size.width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr("y", d => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < size.width / 2 ? "start" : "end")
      .text(d => categories[parseInt(d.name)])
    .append("tspan")
      .attr("fill-opacity", 0.7)
      .text(" | ")
    .append("tspan")
      .attr("fill-opacity", 0.7)
      .text(d => ` ${d.value.toLocaleString()}`)
    .append("tspan")
      .attr("fill-opacity", 0.7)
      .text(" People");

    
      const legend = svg.append("g")
      .attr("transform", `translate(${size.width - 125}, 20)`);

    // Depression legend
    legend.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "#ADD8E6");

    legend.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text("Depression")
      .attr("alignment-baseline", "middle");

    // No Depression legend
    legend.append("rect")
      .attr("x", 0)
      .attr("y", 20)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "#00FF00");

    legend.append("text")
      .attr("x", 20)
      .attr("y", 32)
      .text("No Depression")
      .attr("alignment-baseline", "middle");
  }
    

  return (
    <>
      <div ref={parallelRef} className='chart-container'>
        <svg id='parallel-svg' width='100%' height='100%'></svg>
      </div>
    </>
  )
}
