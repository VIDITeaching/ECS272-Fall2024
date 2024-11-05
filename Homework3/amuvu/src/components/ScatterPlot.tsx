import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { Scatter, ComponentSize, Margin } from '../types';

export default function ScatterPlot() {
    const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 }); // store dimensions of size
    const [plots, setPlots] = useState<Scatter[]>([]); // able to add plot
    const plotRef = useRef<HTMLDivElement>(null); // refer to HTML DOM element
    const margin: Margin = { top: 70, right: 80, bottom: 20, left: 170}; // setting margins
    const onResize = useDebounceCallback((newSize: ComponentSize) => {
        if (newSize.width !== size.width || newSize.height !== size.height) {
            setSize(newSize);
        }
    }, 500); // use resize

    useResizeObserver({ ref: plotRef, onResize }); // use resize

    useEffect(() => {
        // reading csv file
        const dataFromCSV = async () => {
          try { // success
            const mathData = await d3.csv('../../data/student-mat.csv', d => { // math data
            // store education for both parents as an array
              return [
                { subject: "math",  weekday: +d.Dalc, education: +d.Medu, parent: "mother" as 'mother'},
                { subject: "math",  weekday: +d.Dalc, education: +d.Fedu, parent: "father" as 'father'}
                ]
            });
            const porData = await d3.csv('../../data/student-por.csv', d => { // portugese data
                return [
                    { subject: "portugese",  weekday: +d.Dalc, education: +d.Medu, parent: "mother" as 'mother'},
                    { subject: "portugese",  weekday: +d.Dalc, education: +d.Fedu, parent: "father" as 'father'}
                    ]
            })
            // combine data
            const flattenedMathData = mathData.flat();
            const flattenedPorData = porData.flat();
            const combinedData = [...flattenedMathData, ...flattenedPorData];
            shuffleArray(combinedData) // so the colors are mixed more when drawing graph
            setPlots(combinedData);
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
        d3.select('#scatter-svg').selectAll('*').remove(); // clear HTML element
        initScatter(); // draw to HTML element
      }, [plots, size])

    function initScatter() { // initialize scatter plot
        const plotWidth = size.width - margin.left - margin.right;
        const plotHeight = size.height - margin.top - margin.bottom;

        let scatterContainer = d3.select("#scatter-svg") // connect to HTML
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top - 5})`); // apply margin

        // create x axis
        let x = d3.scaleLinear()
            .domain([1,5])
            .range([0, plotWidth - 50]);

        let xAxis = scatterContainer.append("g")
            .attr("transform", "translate(0 " + (plotHeight - 30) + ")")
            .call(d3.axisBottom(x).tickSize(-plotHeight * 0.75).ticks(5))
            .select(".domain").remove();

        // create y axis
        const labels = ["None", "Primary (4th)", "Primary (9th)", "Secondary", "Higher"]; // label names for education

        let y = d3.scaleLinear()
            .domain([0,4])
            .range([plotHeight - 40, 0])
            .nice();

        let yAxis = scatterContainer.append("g")
        .call(d3.axisLeft(y)
            .ticks(5)
            .tickFormat((d, i) => labels[i]) // different labels
            .tickSize(-plotWidth*0.85))
        .call(g => g.select(".domain").remove());

        scatterContainer.selectAll('.tick line').attr("stroke", "#EBEBEB") // background lines to gray
        
        // shift axis text
        
        yAxis.selectAll(".tick text")
            .attr("text-anchor", "end")
            .attr("x", -margin.right + 35 );

        // x axis label

        let xLabel = scatterContainer.append("g")
            .append("text")
            .attr("text-anchor", "end")
            .attr("x", (size.width/2) - 50)
            .attr("y", plotHeight + 5)
            .text("Weekday Drinking Frequency");

        // y axis label

        let yLabel = scatterContainer.append("g")
            .append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + margin.right - 40)
            .attr("x", -margin.bottom + 25)
            .text("Parent's Highest Education")
        
        // color scale
        let color = d3.scaleOrdinal()
            .domain(["mother", "father"])
            .range([ "#9C27B0", "#FFEB3B"])

        // create dots    
        let scatterDots = scatterContainer.append('g')
            .selectAll("dot")
            .data<Scatter>(plots)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.weekday) + (Math.random() - 0.5) * 60)
            .attr("cy", d => y(d.education) + (Math.random() - 0.5) * 40)
              .attr("r", 5)
              .style("fill", function (d) { return color(d.parent) } )
              .style("opacity", "0.3")

        // create legend
        const plotLegend = scatterContainer.append("g")
          .attr("transform", "translate(20, 0)");
        const parents = ["mother", "father"]

        // add the circles for the color
        plotLegend.selectAll("myDots")
          .data(parents)
          .enter()
          .append("circle")
            .attr("cx", (size.width-margin.left-margin.right))
            .attr("cy", function(d,i){ return margin.top - 6 + i*20})
            .attr("r", 5)
            .style("fill", function(d){ return color(d)})

        // text for which color means
        plotLegend.selectAll("mylabels")
            .data(parents)
            .enter()
            .append("text")
              .attr("x", size.width-margin.left-margin.right + 10   )
              .attr("y", function(d,i){ return margin.top - 4 + i*20})
              .style("fill", function(d){ return color(d)})
              .text(function(d){ return d==="mother" ? "Mother" : "Father"})
              .attr("text-anchor", "left")
              .style("alignment-baseline", "middle")

        // add title
        let plotTitle = scatterContainer.append("g")
            .append("text")
            .text("Student Drinking and Parent Education")
            .attr("font-size", "20px")
            .attr("x", -margin.left + 20)
            .attr("y", -margin.bottom - 15)
            .attr("font-weight", "500")
        
    }

    // function to shuffle entries around
    function shuffleArray(array: Scatter[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }

    return(
        <>
        <div ref={plotRef} className="scatter_container" style={{ width: '100%', height: '100%', maxWidth: '700px', maxHeight: '400px', overflow: 'hidden'  }}>
            <svg id="scatter-svg" width="100%" height="100%" display="flex"></svg>
        </div>
        </>
    )
}