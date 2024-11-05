import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { Parallel, ComponentSize, Margin } from '../types';

export default function ParallelPlots() {
    const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 }); // store dimensions of size
    const [plots, setPlots] = useState<Parallel[]>([]); // able to add plot
    const plotRef = useRef<HTMLDivElement>(null); // refer to HTML DOM element
    const margin: Margin = { top: 70, right: 50, bottom: 20, left: 50}; // setting margins
    const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200); // for resizing plot

    useResizeObserver({ ref: plotRef, onResize }); // use resize

    useEffect(() => {
        // reading csv file
        const dataFromCSV = async () => {
          try { // success
            const mathData = await d3.csv('../../data/student-mat.csv', d => { // math data
              return {subject: "math",  health: +d.health, Dalc: +d.Dalc, Walc: +d.Walc, G3: +d.G3, absences: +d.absences};
            });
            const porData = await d3.csv('../../data/student-por.csv', d => { // portugese data
              return {subject: "portugese",  health: +d.health, Dalc: +d.Dalc, Walc: +d.Walc, G3: +d.G3, absences: +d.absences};
            })
            // combine data
            const combinedData = [...mathData, ...porData];
            // filter data
            const filteredData = combinedData.filter(d => 
              d.health != null && d.Dalc != null && d.Walc != null && d.G3 != null && d.absences != null
            );
            shuffleArray(filteredData) // so the colors are mixed more when drawing graph
            setPlots(filteredData);
          } catch (error) { // fail
            console.error('Error loading CSV:', error);
          }
        } 
      dataFromCSV();
    }, [])
    
    // runs every time something changes in plot and size
    useEffect(() => {
      if (isEmpty(plots)) return; // nothing happens
      if (size.width === 0 || size.height === 0) return; // if dimensions invalid
      d3.select('#parallel-svg').selectAll('*').remove(); // clear HTML element
      initParallel(); // draw to HTML element
    }, [plots, size])

    function initParallel() { // initialize parallel plots graph
  
        let plotContainer = d3.select("#parallel-svg") // connect to HTML
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top - margin.bottom})`); // apply margin
        const dimensions: (keyof Parallel)[] = ["health", "Dalc", "Walc", "G3", "absences"];  // dimensions for parallel plot

        // create scale for y axis for all dimensions
        let y: { [key: string]: d3.ScaleLinear<number, number> } = {}
        for (let i in dimensions) { 
            let name = dimensions[i]
            y[name] = d3.scaleLinear()
              .domain(d3.extent(plots, (d: Parallel) => d[name] as number) as [number, number])
              .range([size.height-margin.bottom, margin.top])
        }
        
        // create scale for x axis
        let x = d3.scalePoint()
          .range([0, size.width])
          .padding(1)
          .domain(dimensions);

        // function to draw each line
        function path(d: Parallel) {
          return d3.line()(
            dimensions.map((p, i) => {
                const jitter = Math.random() * 4 - 1.5; // add jitter to make data easier to see
                return [x(p)!, y[p]!(d[p] as number) + jitter];
            })
        );
        }

        // function for color
        function color(d) { return d === "math" ? "#6A5ACD" : "#F4A460"}

        // creating plots based on data
        const parallelPlots = plotContainer.append("g")
          .selectAll("myPath")
          .data<Parallel>(plots)
          .enter().append("path")
          .attr("d",  path)
          .style("fill", "none")
          .style("stroke", function(d) { return color(d.subject) } )
          .style("opacity", 0.2)

        // drawing axis
        const parallelAxis = plotContainer.append("g")
        .selectAll("myAxis")
        .data(dimensions).enter()
        .append("g")
        .attr("class", "axis")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        // add y axis
        .each(function(d) { 
          let t = (d==="G3" || d==="absences") ? 10 : 5; // depends on dimension
          d3.select(this).call(d3.axisLeft(y).ticks(t).scale(y[d])); 
        })
        // axis title at top
        .append("text")
          .style("text-anchor", "middle")
          .attr("y", margin.top-10)
          .text(function(d) { // change text wording
            if (d==="health") {
              return "Health";
            } else if (d==="Dalc") {
              return "Weekday Drinking";
            } else if (d==="Walc") {
              return "Weekend Drinking";
            } else if (d==="G3") {
              return "Overall Grade";
            } else {
              return "Absences";
            }
           })
          .style("fill", "black")
          .style("font-size", "14px")
        
        const subjects = ["math", "portugese"]
        
        // create legend
        const plotLegend = plotContainer.append("g")
          .attr("transform", "translate(20, 20)");
        const legendTitleBackground = plotContainer.append("rect")
          .attr("x", 80)
          .attr("y", 80)
          .attr("width", 100)
          .attr("height", 20)
          .style("fill", "#4972bf");
        const legendTitle = plotContainer.append("g")
          .append("text")
          .text("Subjects")
          .attr("x", 100)
          .attr("y", 95)
          .attr("fill", "white")
          .attr("font-weight", "500 ")
        
        // add the circles for the color
        plotLegend.selectAll("myDots")
          .data(subjects)
          .enter()
          .append("circle")
            .attr("cx", 70)
            .attr("cy", function(d,i){ return 100 + i*25})
            .attr("r", 5)
            .style("fill", function(d){ return color(d)})

        // text for which color means
        plotLegend.selectAll("mylabels")
            .data(subjects)
            .enter()
            .append("text")
              .attr("x", 80)
              .attr("y", function(d,i){ return 101 + i*25})
              .style("fill", function(d){ return color(d)})
              .text(function(d){ return d==="math" ? "Math" : "Portugese"})
              .attr("text-anchor", "left")
              .style("alignment-baseline", "middle")

        // add plot title
        let plotTitle = plotContainer.append("g")
            .append("text")
            .text("Overview of Student Drinking and School")
            .attr("x", (size.width)/2 - 210)
            .attr("y", margin.top/2 - 2)
            .attr("font-size", "22px")
            .attr("font-weight", "500")

        }

        // function to shuffle entries around
        function shuffleArray(array: Parallel[]) {
          for (let i = array.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [array[i], array[j]] = [array[j], array[i]]; // Swap elements
          }
        }

    return(
        <>
        <div ref={plotRef} className="plot_container" style={{ width: '100%', height: '100%' }}>
            <svg id="parallel-svg" width="100%" height="100%" display="flex"></svg>
        </div>
        </>
    )
}