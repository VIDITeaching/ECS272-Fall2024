import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import dataFromJson from '../../data/demo.json';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

import { SunburstNode, SunburstData, ComponentSize, Margin } from '../types';

interface Vis3Props {
    selectedRiskRatings: string[];      // Risk levels selected in Vis_2
}

export default function Vis_3({ selectedRiskRatings }: Vis3Props) {
    const [data, setData] = useState<SunburstNode | null>(null);
    const chartRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
    const margin: Margin = { top: 0, right: 0, bottom: 0, left: 0 };
    const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);

    useResizeObserver({ ref: chartRef, onResize });
    
    useEffect(() => {
        const dataFromCSV = async () => {
            try {
                const csvData = await d3.csv('../../data/financial_risk.csv', d => {
                    if (!d['Risk Rating'] || !d['Marital Status'] || !d['Gender']) {
                        return null; // Exclude null or blank data
                    }
                    return {
                        riskRating: d['Risk Rating'],
                        maritalStatus: d['Marital Status'],
                        gender: d['Gender']
                    };
                });
    
                const validData = csvData.filter(d => d !== null) as {
                    riskRating: string;
                    maritalStatus: string;
                    gender: string;
                }[];
    
                // Create hierarchical data structure
                const hierarchyData: SunburstNode = {
                    name: "Risk Categories",
                    children: Array.from(
                        d3.group(validData, d => d.riskRating),
                        ([riskRating, riskData]) => ({
                            name: riskRating,
                            children: Array.from(
                                d3.group(riskData, d => d.maritalStatus),
                                ([maritalStatus, maritalData]) => ({
                                    name: maritalStatus,
                                    children: Array.from(
                                        d3.rollup(
                                            maritalData,
                                            v => v.length, // Use count as value
                                            d => d.gender
                                        ),
                                        ([gender, count]) => ({
                                            name: gender,
                                            value: count
                                        })
                                    )
                                })
                            )
                        })
                    )
                };
                setData(hierarchyData); // Update state with hierarchical data
            } catch (error) {
                console.error('Error loading CSV:', error);
            }
        };
    
        dataFromCSV();
    }, []);
    

    useEffect(() => {
        if (!data || size.width === 0 || size.height === 0) {
            console.log("Data or size not available yet:", { data, size });
            return; // Early return if data or size is not ready
        }
        console.log("Initializing chart with data and size:", { data, size });
        d3.select('#sunburst-svg').selectAll('*').remove(); // Clear existing elements in the SVG
        initChart(); // Initialize the chart
    }, [data, size, selectedRiskRatings]);

    function initChart() {
        if (!data) return; // Ensure `data` is available
    
        // Set up dimensions and margins
        const margin: Margin = { top: 0, right: 0, bottom: 0, left: 0 };
        const chartContainer = d3.select(chartRef.current);
        const width = size.width - margin.left - margin.right - 50;
        const height = size.height - margin.top - margin.bottom + 50;
        const radius = Math.min(width, height) / 2 - 15;
    
        // Clear any previous chart elements
        chartContainer.selectAll("*").remove();
    
        // Create the root hierarchy and apply partition layout
        const root = d3.hierarchy(data)
            .sum((d: SunburstNode) => d.value || 0)
            .sort((a, b) => d3.descending(a.value, b.value));
    
        d3.partition<SunburstNode>()
            .size([2 * Math.PI, radius])(root);
    
        // Set up a custom color scale for the risk levels
        const color = d3.scaleOrdinal()
            .domain(["Low", "Medium", "High"])
            .range(["green", "blue", "red"]);
    
        // Arc generator for sunburst segments
        const arc = d3.arc<d3.HierarchyRectangularNode<SunburstNode>>()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius(radius / 2)
            .innerRadius(d => d.y0)
            .outerRadius(d => d.y1 - 1);
    
        // Create an SVG element with a viewBox for responsiveness
        const svg = chartContainer
            .append("svg")
            .attr("viewBox", [-width / 2, -height / 2, width, height + 10])
            .attr("width", width)
            .attr("height", height)
            .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
            .attr("transform", `translate(0, -30)`);
    
        const format = d3.format(",d");
    
        // Draw each segment of the sunburst with fade-in transitions
        const cell = svg
            .append("g")
            .attr("fill-opacity", 0.6)
            .selectAll("path")
            .data(root.descendants() as d3.HierarchyRectangularNode<SunburstNode>[])
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", (d: d3.HierarchyRectangularNode<SunburstNode>) => {
                if (d.depth === 0) {
                    return "white"; // Keep the center (root) as white
                }
                const topAncestor = d.ancestors().reverse()[1];
                if (topAncestor) {
                    return color(topAncestor.data.name) as string;
                }
                return "lightgrey"; // Default color for safety, in case something goes wrong
            })
            .attr("stroke", "white")
            .style("opacity", 0) // Start with 0 opacity for fade-in effect
            .transition() // Apply fade-in transition
            .duration(1000)
            .style("opacity", (d: d3.HierarchyRectangularNode<SunburstNode>) => {
                if (selectedRiskRatings.length === 0) {
                    return 1;
                }
                // Highlight only the selected risk ratings and their descendants
                const topAncestorName = d.ancestors().reverse()[1]?.data.name;
                if (topAncestorName && selectedRiskRatings.includes(topAncestorName)) {
                    return 1;
                }
                return 0.3; // Dim non-selected segments
            });
    
        // Add tooltips to each segment after transition
        cell.each(function (d: d3.HierarchyRectangularNode<SunburstNode>) {
            d3.select(this)
                .append("title")
                .text(() => {
                    const value = d.value !== undefined ? d.value : 0;
                    return `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(value)}`;
                });
        });
    
        // Add labels to segments that are large enough
        svg.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .attr("font-size", 9)
            .attr("font-family", "sans-serif")
            .selectAll("text")
            .data((root.descendants() as d3.HierarchyRectangularNode<SunburstNode>[])
                 .filter(d => d.depth && (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10) as d3.HierarchyRectangularNode<SunburstNode>[])
            .join("text")
            .attr("transform", (d: d3.HierarchyRectangularNode<SunburstNode>) => {
                const angle = (d.x0 + d.x1) / 2 * 180 / Math.PI - 90; // Calculate the angle of the current segment
                const y = (d.y0 + d.y1) / 2; // Midpoint of the radius
                return `rotate(${angle}) translate(${y},0) rotate(${angle > 90 && angle < 270 ? 180 : 0})`; // Rotate to make text readable consistently
            })
            .attr("dy", "0.35em")
            .style("opacity", 0) // Start with 0 opacity for fade-in effect
            .transition() // Apply fade-in transition
            .duration(1000)
            .style("opacity", (d: d3.HierarchyRectangularNode<SunburstNode>) => {
                if (selectedRiskRatings.length === 0) {
                    return 1;
                }
                const topAncestorName = d.ancestors().reverse()[1]?.data.name;
                if (topAncestorName && selectedRiskRatings.includes(topAncestorName)) {
                    return 1;
                }
                return 0.01; // Dim non-selected labels
            })
            .text((d: d3.HierarchyRectangularNode<SunburstNode>) => d.data.name);
    
        // Add title to the sunburst
            svg.append("text")
                .attr("x", 0) // Center the title horizontally
                .attr("y", 230) // Position below the sunburst
                .attr("text-anchor", "middle")
                .attr("font-size", 16)
                .attr("font-weight", "bold")
                .text("Further Information for Risk Levels in Financial Risk Assessment");
    }
    
    return (
        <>
        <div ref={chartRef} className='chart-container'>
            <svg id='sunburst-svg' width='100%' height='100%'></svg>
        </div>
        </>
    )
}
