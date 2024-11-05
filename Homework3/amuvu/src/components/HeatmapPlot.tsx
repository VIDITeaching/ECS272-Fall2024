import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { Heatmap, ComponentSize, Margin } from '../types';

export default function HeatmapPlot() {
    const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 }); // store dimensions of size
    const [plots, setPlots] = useState<Heatmap[]>([]); // able to add plot
    const plotRef = useRef<HTMLDivElement>(null); // refer to HTML DOM element
    const margin: Margin = { top: 50, right: 100, bottom: 60, left: 80}; // setting margins
    const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200); // for resizing plot

    useResizeObserver({ ref: plotRef, onResize }); // use resize

    useEffect(() => {
        // reading csv file
        const dataFromCSV = async () => {
          try { // success
            const mathData = await d3.csv('../../data/student-mat.csv', d => { // math data
            return {
                subject: "math",  
                weekday: +d.Dalc,
                schoolsup: stringToBoolean(d.schoolsup),
                famsup: stringToBoolean(d.famsup),
                paid: stringToBoolean(d.paid),
                activities: stringToBoolean(d.activities),
                higher: stringToBoolean(d.higher),
                internet: stringToBoolean(d.internet),
                romantic: stringToBoolean(d.romantic),
            };
            });
            const porData = await d3.csv('../../data/student-por.csv', d => { // portugese data
            return {
                subject: "math",  
                weekday: +d.Dalc,
                schoolsup: stringToBoolean(d.schoolsup),
                famsup: stringToBoolean(d.famsup),
                paid: stringToBoolean(d.paid),
                activities: stringToBoolean(d.activities),
                higher: stringToBoolean(d.higher),
                internet: stringToBoolean(d.internet),
                romantic: stringToBoolean(d.romantic),
            };
            })
            // combine data
            const combinedData = [...mathData, ...porData];
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
        d3.select('#heatmap-svg').selectAll('*').remove(); // clear HTML element
        initHeatmap(); // draw to HTML element
    }, [plots, size])

    function initHeatmap() {
        let heatmapContainer = d3.select("#heatmap-svg") // connect to HTML
        let dimensions = ["schoolsup", "famsup", "paid", "activities", "higher", "internet", "romantic"] // binary attributes
        
        function xAxisLabels(attribute: string) {
            if (attribute === 'schoolsup') {
                return ['Extra', 'Educational', 'Support'];
            } else if (attribute === 'famsup') {
                return ['Family', 'Educational', 'Support'];
            } else if (attribute === 'paid') {
                return ['Extra', 'Paid', 'Classes'];
            } else if (attribute === 'activities') {
                return ['Extra-curricular', 'Activities'];
            } else if (attribute === 'higher') {
                return ['Wants', 'Higher', 'Education'];
            } else if (attribute === 'internet') {
                return ['Home', 'Internet', 'Access'];
            } else {
                return ['Romantic', 'Relationship'];
            }
         }

        // x axis
        let x = d3.scaleBand()
            .range([ 0, size.width - margin.left - margin.right])
            .domain(dimensions)
            .padding(0.01);
        let xAxis = heatmapContainer.append("g")
            .attr("transform", "translate(" + margin.left + "," + (size.height - margin.bottom) + ")")
            .attr("font-size", "18px")
            .call(d3.axisBottom(x))
        xAxis.selectAll("text").remove();
        xAxis.selectAll(".tick")
            .append("text")
            .attr("text-anchor", "middle")
            .each(function(d: string) {
                const lines = xAxisLabels(d); // new labels
                d3.select(this)
                    .selectAll("tspan")
                    .data(lines)
                    .enter()
                    .append("tspan")
                    .attr("fill", 'black')
                    .attr("x", 0)
                    .attr("y", 20)
                    .attr("dy", (line, i) => `${i * 1.1}em`)
            .text(line => line);
            })
            .attr("transform", "translate(0, 0)");
        // let xLabel = heatmapContainer.append("g")
        //     .append("text")
        //     .text("Student Attributes")
        //     .attr("x", (size.width/2) - margin.right)
        //     .attr("y", size.height - 10)

        // y axis
        let y = d3.scaleBand()
            .range([ size.height - margin.top - margin.bottom, 0 ])
            .domain([1, 2, 3, 4, 5].map(d => d.toString()))
        let yAxis = heatmapContainer.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("font-size", "18px")
            .call(d3.axisLeft(y));
        let yLabel = heatmapContainer.append("g")
            .append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", margin.left - 35)
            .attr("x", -margin.top - 10)
            .text("Weekday Drinking Frequency")

        // linear color scale for each different dimension
        const colorScales: Record<string, d3.ScaleLinear<string, string>> = {};
        // const colorPalette = ["#023047", "#035f6e", "#046582", "#058090", "#06a3a7", "#38b0b4", "#61c3c4"]

        dimensions.forEach(dimension => {
            colorScales[dimension] = d3.scaleLinear<string>()
                .domain([0, 1])
                .range(["white", "#058090"]); 
        });

        // proportions entry
        interface ProportionEntry {
            yesCount: number;
            totalCount: number;
        }

        // create container that holds values to find proportions
        function calcProportions(data: Heatmap[], dimensions: string[]): Record<string, Record<number, ProportionEntry>> {
            let proportionContainer: Record<string, Record<number, ProportionEntry>> = {};

            // initialize container for proportion
            dimensions.forEach(dimension => {
                proportionContainer[dimension] = {};
                for (let i = 1; i <= 5; i++) {
                    proportionContainer[dimension][i] = { yesCount: 0, totalCount: 0}
                }
            })

            // count through data and fill out container
            data.forEach(d => {
                dimensions.forEach(dimension => {
                    const curWeekday = d.weekday;
                    if (d[dimension]) {
                        proportionContainer[dimension][curWeekday].yesCount += 1
                    }
                proportionContainer[dimension][curWeekday].totalCount += 1
                })
            })

            return proportionContainer;
        }

        let proportionContainer: Record<string, Record<number, ProportionEntry>> = calcProportions(plots, dimensions);

        // calculated proportion entry
        interface ProportionData {
            attribute: string;
            weekday: number;
            proportion: number;
        }

        // calculate proportions from containers
        let proportions: ProportionData[] = [];
        dimensions.forEach(dimension => {
            for (let i = 1; i <= 5; i++) {
                let yesCount = proportionContainer[dimension][i].yesCount;
                let totalCount = proportionContainer[dimension][i].totalCount;
                let proportion = totalCount > 0 ? yesCount / totalCount : 0; // proportion equation
                proportions.push({
                    attribute: dimension,
                    weekday: i,
                    proportion: proportion
                });
            }
        });

        // create heatmap plot
        let heatmapPlots = heatmapContainer.append("g")
            .selectAll()
            .data(proportions) // data from calculated proportions
            .enter()
            .append("rect")
            .attr("x", function(d) { return x(d.attribute) + margin.left})
            .attr("y", function(d) { return y(d.weekday.toString()) + margin.top })
            .attr("width", x.bandwidth() )
            .attr("height", y.bandwidth() )
            .style("cursor", "pointer")
            .style("fill", function(d) { return colorScales[d.attribute](d.proportion )} )
            .on("mouseover", function(event, d) {
                let rectX = x(d.attribute) + margin.left + x.bandwidth() / 2;
                let rectY = y(d.weekday.toString()) + (margin.top + 5) + y.bandwidth() / 2;
                
                let percentage = (d.proportion * 100).toFixed(1) + "%";
                tooltip
                    .attr("x", rectX)
                    .attr("y", rectY)
                    .attr("visibility", "visible")
                    .text(percentage)
                    .style("fill", d.proportion >= 0.6 ? 'white' : 'black')
                    .transition()
                    .duration(200)
                    .style("opacity", 1);
            })
            .on("mouseout", function() {
                tooltip
                    .transition()
                    .duration(200)  // Fade-out duration
                    .style("opacity", 0)  // Fade to invisible
                    .on("end", () => tooltip.attr("visibility", "hidden"));  // Hide after fade-out
            });
            
        // create hover tooltip
            let tooltip = heatmapContainer.append("text")
            .attr("id", "tooltip")
            .attr("x", 0)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("visibility", "hidden")
            .style("fill", "black");

        tooltip
            .on("mouseenter", function() {
                tooltip.transition().duration(200).style("opacity", 1);
            })
            .on("mouseleave", function() {
                tooltip
                    .transition()
                    .duration(200)
                    .style("opacity", 0)
                    .on("end", () => tooltip.attr("visibility", "hidden"));
            });

        // create gradient legend
        let gradientColors = ["#058090", "white"]

        var gradient = heatmapContainer.append('defs')
            .append('linearGradient')
            .attr('id', 'grad')
            .attr('x1', '0%')
            .attr('x2', '0%')
            .attr('y1', '0%')
            .attr('y2', '100%');
        
        gradient.selectAll('stop')
            .data(gradientColors)
            .enter()
            .append('stop')
            .style('stop-color', function(d){ return d; })
            .attr('offset', function(d,i){
              return 100 * (i / (gradientColors.length - 1)) + '%';
            })
        heatmapContainer.append("g")
            .append('rect')
            .attr('x', size.width - margin.right + 30)
            .attr('y', margin.top + margin.bottom )
            .attr('width', 30)
            .attr('height', 130)
            .style('fill', 'none')
            .style('stroke', 'black')
            .style('stroke-width', 2);

        let gradientContainer = heatmapContainer.append("g")
            .append('rect')
            .attr('x', size.width - margin.right + 30)
            .attr('y', margin.top + margin.bottom)
            .attr('width', 30)
            .attr('height', 130)
            .style('fill', 'url(#grad)');
        
        let gradientTopText = heatmapContainer.append("g")
            .append("text")
            .text("100%")
            .attr("x", size.width - margin.right + 28)
            .attr("y", margin.top + margin.bottom - 15)

        let gradientBottomText = heatmapContainer.append("g")
            .append("text")
            .text("0%")
            .attr("x", size.width - margin.right + 36)
            .attr("y", size.height - margin.top - 10)

        // create title of plot
        let heatmapTitle = heatmapContainer.append("g")
            .append("text")
            .text("Proportion of Weekday Drinking to Binary Attributes")
            .attr("x", 35)
            .attr("y", 30)
            .attr("font-size", "20px")
            .attr("font-weight", "500")

    }

    // function to shuffle entries around
    function shuffleArray(array: Heatmap[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }

    // function to change string to boolean
    function stringToBoolean(str: string) {
        if (str === "yes") {
          return true;
        } else {
          return false;
        }
    }

    return (
        <>
        <div ref={plotRef} className="heatmap_container" style={{ width: '100%', height: '100%' }}>
            <svg id="heatmap-svg" width="100%" height="100%" display="flex"></svg>
        </div>
        </>   
    )
}