import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { Scatter, ComponentSize, Margin } from '../types';

export default function RingScatterPlot() {
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
            .attr("transform", `translate(${130},${margin.top - 20})`); // apply margin

        // create y axis
        const labels = ["None", "Primary (4th)", "Primary (9th)", "Secondary", "Higher"]; // label names for education

        // x axis label

        let xLabel = scatterContainer.append("g")
            .append("text")
            .attr("text-anchor", "end")
            .attr("x", (size.width/2))
            .attr("y", plotHeight + 30)
            .text("Weekday Drinking Frequency");

        // y axis label

        let yLabel = scatterContainer.append("g")
            .append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -90)
            .attr("x", -margin.bottom)
            .text("Parent's Highest Education")
        
        // color scale
        const color = (parent: 'mother' | 'father') => {
            return parent === 'mother' ? '#4B0082' : '#FF4500';
        };

        // organize data into rollups
        const ringData = d3.rollups(plots, 
            group => group.length, // count occurrences
            d => d.weekday, // group by drinking frequency
            d => d.education, // and by education level
            d => d.parent // and by parent type
        );

        // create x scale
        const x = d3.scalePoint()
            .domain(["1", "2", "3", "4", "5"])
            .range([0, plotWidth + 30])
            .padding(0.5);

        // create y scale
        const y = d3.scalePoint()
            .domain(labels)
            .range([plotHeight, 0])
            .padding(0.2);
        
        // maximum ring size
        const maxRingSize = Math.min(plotWidth / 5, plotHeight / 3) / 4;

        // ring size scale
        const ringSize = d3.scaleSqrt()
            .domain([
                0,
                d3.max(ringData.flatMap(([weekday, educations]) =>
                    educations.flatMap(([education, parents]) =>
                        parents.map(([parent, count]) => count)
                    )
                )) || 0
            ])
            .range([0, maxRingSize]);
        
        // add hover effect
        const tooltip = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("width", "50px")
            .style("height", "50px")
            .style("background", "transparent")
            .style("pointer-events", "none");

        // draw out each individual ring
        ringData.forEach(([weekday, educationGroups]) => {
        educationGroups.forEach(([education, parentGroups]) => {
            const motherCount = parentGroups.find(p => p[0] === "mother")?.[1] || 0;
            const fatherCount = parentGroups.find(p => p[0] === "father")?.[1] || 0;
            parentGroups.forEach(([parent, count]) => {

                // group for both circles
                const ringGroup = scatterContainer.append("g");

                // append actual rings
                ringGroup.append("circle")
                    .attr("cx", parent === 'mother' ? (x(String(weekday)) ?? 0) - 5 : (x(String(weekday)) ?? 0) + 5)
                    .attr("cy", y(labels[education]) ?? 0)
                    .attr("r", ringSize(count))
                    .attr("fill", "none")
                    .attr("stroke", color(parent as 'mother' | 'father'))
                    .attr("stroke-width", 3)
                    .attr("opacity", 0.7)
                    .attr("class", parent);

                // create transparent circle for hover
                const cx = parent === 'mother' ? (x(String(weekday)) ?? 0) - 5 : (x(String(weekday)) ?? 0) + 5;
                const cy = y(labels[education]) ?? 0;
                const radius = ringSize(count);
                ringGroup.append("circle")
                    .attr("cx", cx)
                    .attr("cy", cy)
                    .attr("r", radius + 20)
                    .attr("fill", "none")
                    .attr("pointer-events", "all")
                    .attr("cursor", "pointer")
                    .on("mouseover", function(event) {
                    // create pie data
                    const pieData = [
                        { category: "mother", count: motherCount },
                        { category: "father", count: fatherCount }
                    ];
                    const pie = d3.pie().value(d => d.count)(pieData);
                    const arc = d3.arc().innerRadius(0).outerRadius(15);

                    // add to pie chart
                    const pieSvg = tooltip.append("svg")
                        .attr("width", 50)
                        .attr("height", 50)
                        .append("g")
                        .attr("transform", "translate(25, 25)");

                    pieSvg.selectAll("path")
                        .data(pie)
                        .join("path")
                        .attr("d", arc)
                        .attr("fill", d => color(d.data.category));

                    // fade in effect
                    tooltip.style("visibility", "visible")
                        .style("opacity", 0)
                        .transition()
                        .duration(200)
                        .style("opacity", 1);
                    
                    })
                    .on("mousemove", function(event) {
                    tooltip
                        .style("top", `${event.pageY - 30}px`)
                        .style("left", `${event.pageX + 15}px`);
                    })
                    .on("mouseout", function() {
                    tooltip.style("visibility", "hidden").selectAll("*").remove();
                    });
                });
            });
        });

        // draw axis
        scatterContainer.append("g")
        .attr("transform", `translate(0,${plotHeight})`)
        .call(d3.axisBottom(x).tickSize(0));

        scatterContainer.append("g")
            .call(d3.axisLeft(y));

        // create legend
        const plotLegend = scatterContainer.append("g")
          .attr("transform", "translate(40, 0)");
        const parents = ["mother", "father"]

        // add the circles for the color
        plotLegend.selectAll("myDots")
          .data(parents)
          .enter()
          .append("circle")
            .attr("cx", (size.width-margin.left-margin.right))
            .attr("cy", function(d,i){ return margin.top - 6 + i*20})
            .attr("r", 5)
            .style("fill", function(d){ return color(d as 'mother' | 'father')})

        // text for which color means
        plotLegend.selectAll("mylabels")
            .data(parents)
            .enter()
            .append("text")
              .attr("x", size.width-margin.left-margin.right + 10   )
              .attr("y", function(d,i){ return margin.top - 4 + i*20})
              .style("fill", function(d){ return color(d as 'mother' | 'father')})
              .text(function(d){ return d==="mother" ? "Mother" : "Father"})
              .attr("text-anchor", "left")
              .style("alignment-baseline", "middle")
              .style("cursor", "pointer")
              .on("click", function(event, d) {
                const isVisible = d3.selectAll(`.${d}`).style("opacity") === "0.7"; // if currently visible
                d3.selectAll(`.${d}`)
                    .transition()
                    .style("opacity", isVisible ? 0 : 0.7); // opacity
            });

        // add title
        let plotTitle = scatterContainer.append("g")
            .append("text")
            .text("Student Drinking and Parent Education")
            .attr("font-size", "20px")
            .attr("x", -margin.right - 20)
            .attr("y", -margin.bottom)
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
        <div ref={plotRef} className="scatter_container" style={{ width: '100%', height: '100%', maxWidth: '740px', maxHeight: '400px', overflow: 'hidden'  }}>
            <svg id="scatter-svg" width="100%" height="100%" display="flex"></svg>
        </div>
        </>
    )
}