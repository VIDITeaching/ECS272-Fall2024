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

export default function Parallel({mentalDisorder}) {
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
        let categories=[mentalDisorder, "No "+mentalDisorder, "Male", "Female", "year 1", "year 2", "year 3", "year 4"]
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
  //}, [parallelRef, mentalDisorder])
}, [mentalDisorder])

  // Set interval to force re-render every second
  /*useEffect(() => {
    const interval = setInterval(() => {
      setForceRender(prev => prev + 1);
    }, 10000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);*/

  useEffect(() => {
    if (isEmpty(nodes) || isEmpty(links)) return;
    if (size.width === 0 || size.height === 0) return;
    d3.select('#parallel-svg').selectAll('*').remove();
    initChart();
  }, [nodes, links, size, forceRender])

  function initChart() {
    //Used https://observablehq.com/@d3/parallel-sets for parallel set syntax
    let categories=[mentalDisorder, "No "+mentalDisorder, "Male", "Female", "year 1", "year 2", "year 3", "year 4"]
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
        return "#0000FF"; // Blue for Depression source
      } else if (d === "Anxiety") {
        return "#FFEA00"
      }
      else if (d === "Panic"){
        return "#FF0000"; // Green for No Depression source
      }
      return "#00EE00";
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
    const showTooltip = (event, flow, value) => {
      tooltip.style("opacity", 1)
        .html(`Flow: ${flow}<br>Number of People: ${value}`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    };

    // Function to hide the tooltip
    const hideTooltip = () => {
      tooltip.style("opacity", 0);
    };

    const title = svg.append('g')
      .append('text')
      .attr('transform', `translate(${size.width / 3}, ${size.height - margin.top + 25})`)
      .attr('dy', '0.5rem')
      .style('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .text(mentalDisorder+' vs No '+mentalDisorder+' Among Genders and Years');
    // Draw links
    // Calculate maximum delay based on the width of the SVG to control timing
  // Draw links with left-to-right animation
  svg
    .append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(link_list)
    .join("path")
    .attr("d", sankeyLinkHorizontal())
    .attr("stroke", d => linkColor(d.names[0]))
    .attr("stroke-width", d => Math.max(1, d.width)) // Initial stroke width
    .attr("opacity", 0) // Start with 0 opacity
    .each(function(d) {
      // Get the total length of the path for the stroke dasharray
      const length = this.getTotalLength();
      
      d3.select(this)
        .attr("stroke-dasharray", length) // Set the dasharray to the length of the path
        .attr("stroke-dashoffset", length) // Start with the offset at full length (invisible)
        .transition()
        .delay((d.source.x0 / size.width) * 3000 + 500) // Delay based on horizontal position
        .duration(500) // Duration of the animation
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0) // Animate to zero offset (visible)
        .attr("opacity", 0.5); // Fade in to full opacity
    })
    /*.append("title") // Adds tooltip to each path
    .text(d => `${d.names.join(" → ")}\n${d.value.toLocaleString()}`);*/
    .on("mouseover", (event, d) => showTooltip(event, d.names.join(" → "), Math.round(d.value*1000)/1000))
    .on("mouseout", hideTooltip);




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
      .style("font", "bold 12px sans-serif")
    .selectAll("text")
    .data(node_list)
    .join("text")
      .attr("x", d => d.x0 < size.width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr("y", d => d.x0 < size.width / 2 ? (d.y1 + d.y0) / 2+21 : ((d.y1 + d.y0) / 2))
      .attr("dy", "0.5em")
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

    legend.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", linkColor(mentalDisorder));

    legend.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(mentalDisorder)
      .attr("alignment-baseline", "middle");

    legend.append("rect")
      .attr("x", 0)
      .attr("y", 20)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "#00FF00");

    legend.append("text")
      .attr("x", 20)
      .attr("y", 32)
      .text("No "+mentalDisorder)
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
