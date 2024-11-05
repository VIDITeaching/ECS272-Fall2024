import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { StarCoordinate, ComponentSize, Margin } from '../types';

export default function StarCoordinatePlot() {
    const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 }); // store dimensions of size
    const [plots, setPlots] = useState<StarCoordinate[]>([]); // able to add plot
    const plotRef = useRef<HTMLDivElement>(null); // refer to HTML DOM element
    const margin: Margin = { top: 100, right: 50, bottom: 20, left: 50}; // setting margins
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
        d3.select('#star-svg').selectAll('*').remove(); // clear HTML element
        initStarPlot(); // draw to HTML element
      }, [plots, size])
    
    function initStarPlot() {
        const plotWidth = size.width - margin.left - margin.right;
        const plotHeight = size.height - margin.top - margin.bottom;

        let starContainer = d3.select("#star-svg") // connect to HTML
            .append("g")
            .attr("transform", `translate(${margin.left + 10},${margin.top + 10})`) // apply margin
        const plotGroup = starContainer.append("g")
            .attr("id", "plot-group"); // group for rotating
        const labelNames = starContainer.append("g")
        const histogramGroup = starContainer.append("g")
            .attr("id", "histogram-group")
            .attr("transform", `translate(${plotWidth/2 + margin.left + margin.right}, ${-margin.top/2})`);

        const dimensions: (keyof StarCoordinate)[] = ["health", "Dalc", "Walc", "G3", "absences"];  // dimensions for parallel plot

        // get the angle for every dimension
        const radius = Math.min(plotWidth, plotHeight) / 2;
        const angleSlice = (Math.PI * 2) / dimensions.length;

        // draw the axis line for each dimension
        dimensions.forEach((dimension, i) => {
            const angle = i * angleSlice - Math.PI / 2;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
        
            plotGroup.append("line")
                .attr("x1", plotWidth / 2)
                .attr("y1", plotHeight / 2)
                .attr("x2", plotWidth / 2 + x)
                .attr("y2", plotHeight / 2 + y)
                .attr("stroke", "black");
        });
        
        function labelName(label: string) {
            if (label==="health" || label==="absences") {
                return String(label).charAt(0).toUpperCase() + String(label).slice(1);
            } else if (label === "Dalc") {
                return ["Weekday", "Drinking"];
            } else if (label === "Walc") {
                return ["Weekend", "Drinking"];
            } else {
                return ["Final", "Score"];
            }
        }

        // add labels
        dimensions.forEach((dimension, i) => {
            const angle = i * angleSlice - Math.PI / 2;
            const x = (radius + 20) * Math.cos(angle);
            const y = (radius + 20) * Math.sin(angle);
        
            const label = labelName(dimension);
    
            labelNames.append("text")
                .attr("x", plotWidth / 2 + x)
                .attr("y", plotHeight / 2 + y)
                .attr("text-anchor", "middle")
                .attr("font-size", 16)
                .style("cursor", "pointer")
                .selectAll("tspan")
                .data(Array.isArray(label) ? label : [label])  // use array
                .enter()
                .append("tspan")
                .attr("x", plotWidth / 2 + (x * 1.1))
                .attr("dy", (d, i) => (i === 0 ? 0 : 20))
                .text(d => d)  // set text
                .on("click", () => {
                    rotatePlot(i); // rotate on click
                });
        });

        // function to rotate the plot
        function rotatePlot(clickedIndex: number) {
            const angleSlice = (Math.PI * 2) / dimensions.length;
            const currentAngle = clickedIndex * angleSlice - Math.PI / 2; // calculate current angle
            const targetAngle = -Math.PI / 2; // calculate target angle
            const rotationDegrees = (targetAngle - currentAngle) * (180 / Math.PI); // calculate how much to rotate by

            // get center of the plot
            const centerX = (plotWidth) / 2;
            const centerY = (plotHeight)/ 2;
        
            const plotGroup = d3.select("#plot-group");

            // fade out labels
            labelNames.selectAll("text")
                .transition()
                .duration(200)
                .style("opacity", 0)

                // rotate the plot
                .on("end", function() {
                    plotGroup.transition()
                        .duration(700)
                        .ease(d3.easeCubicInOut)
                        .attr("transform", `translate(${centerX}, ${centerY}) rotate(${rotationDegrees}) translate(${-centerX}, ${-centerY})`)
                        
                
                        labelNames.selectAll("text").remove(); // Remove existing text elements
                        plotGroup.selectAll("text").remove()

                        dimensions.forEach((dimension, i) => {
                            const newIndex = (i + dimensions.length - clickedIndex) % dimensions.length;
                            const angle = newIndex * angleSlice - Math.PI / 2; // New angle for each label
                            const x = (radius + 20) * Math.cos(angle);
                            const y = (radius + 20) * Math.sin(angle);
                            const label = labelName(dimension);
                            // Append new text elements
                            labelNames.append("text")
                                .attr("x", plotWidth / 2 + x)
                                .attr("y", plotHeight / 2 + y)
                                .attr("text-anchor", "middle")
                                .attr("font-size", 16)
                                .style("cursor", "pointer")
                                .style("opacity", 0)
                                .selectAll("tspan")
                                .data(Array.isArray(label) ? label : [label])  // use array
                                .enter()
                                .append("tspan")
                                .attr("x", plotWidth / 2 + (x * 1.1))
                                .attr("dy", (d, i) => (i === 0 ? 0 : 20))
                                .text(d => d)  // set text
                                .on("click", () => {
                                    rotatePlot(i); // rotate on click
                                });
                        });
                        labelNames.selectAll("text")
                            .transition()
                            .duration(500)
                            .style("opacity", 1);
                        const topDimension = dimensions[clickedIndex];
                        
                });
        }

        // create scales for each dimension
        const scales = dimensions.reduce((acc, dimension) => {
            acc[dimension] = d3.scaleLinear()
                .domain(d3.extent(plots, (d: StarCoordinate) => d[dimension] as number) as [number, number])
                .range([0, radius]);
            return acc;
        }, {} as Record<string, d3.ScaleLinear<number, number>>);

        // plot for each student and create lines
        const lineGenerator = d3.line()
            .x(d => d[0])  // x-coordinate
            .y(d => d[1])  // y-coordinate
            .curve(d3.curveLinearClosed); // closes path

        plots.forEach(datum => {
            const color = datum.subject == "math" ? "#6A5ACD" : "#F4A460"; // different color per subject
            const pathData: [number, number][] = dimensions.map((dimension, i) => { // find x and y for plot
                const angle = i * angleSlice - Math.PI / 2;
                const value = scales[dimension](datum[dimension] as number);
                const x = plotWidth / 2 + value * Math.cos(angle);
                const y = plotHeight / 2 + value * Math.sin(angle);
                return [x, y];
            });

            plotGroup.append("path") // create lines
                .datum(pathData)
                .attr("d", lineGenerator)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("opacity", 0.3)
                .attr("class", datum.subject);
        });

        const subjects = ["math", "portugese"]
        function color(d: string) { return d === "math" ? "#6A5ACD" : "#F4A460"}
        
        // create legend
        const plotLegend = starContainer.append("g")
          .attr("transform", "translate(20, 20)");
        const legendTitleBackground = starContainer.append("rect")
          .attr("x", margin.left - 20)
          .attr("y", 0)
          .attr("width", 100)
          .attr("height", 20)
          .style("fill", "#4972bf");
        const legendTitle = starContainer.append("g")
          .append("text")
          .text("Subjects")
          .attr("x", margin.left)
          .attr("y", 15)
          .attr("fill", "white")
          .attr("font-weight", "500 ")
        
        // add the circles for the color
        plotLegend.selectAll("myDots")
          .data(subjects)
          .enter()
          .append("circle")
            .attr("cx", margin.left - 10)
            .attr("cy", function(d,i){ return 20 + i*25})
            .attr("r", 5)
            .style("fill", function(d){ return color(d)})

        // text for which color means
        plotLegend.selectAll("mylabels")
            .data(subjects)
            .enter()
            .append("text")
              .attr("x", margin.left)
              .attr("y", function(d,i){ return 21 + i*25})
              .style("fill", function(d){ return color(d)})
              .text(function(d){ return d==="math" ? "Math" : "Portugese"})
              .attr("text-anchor", "left")
              .style("alignment-baseline", "middle")
              .style("cursor", "pointer")
              .on("click", function(event, d) {
                const isVisible = d3.selectAll(`.${d}`).style("opacity") === "0.3"; // if currently visible
                d3.selectAll(`.${d}`)
                    .transition()
                    .style("opacity", isVisible ? 0 : 0.3); // opacity
            });

        // add plot title
        let plotTitle = starContainer.append("g")
            .append("text")
            .text("Overview of Student Drinking and School")
            .attr("x", (size.width)/2 - 230)
            .attr("y", -margin.top/2 - 10)
            .attr("font-size", "22px")
            .attr("font-weight", "500")

    }
    

    // function to shuffle entries around
    function shuffleArray(array: StarCoordinate[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }

    return (
        <>
        <div ref={plotRef} className="star_container" style={{ width: '100%', height: '100%' }}>
            <svg id="star-svg" width="100%" height="100%" display="flex"></svg>
        </div>
        </>
    )
}