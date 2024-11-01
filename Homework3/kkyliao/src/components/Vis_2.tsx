import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import dataFromJson from '../../data/demo.json';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

import { NumbericalData, ComponentSize, Margin } from '../types';
// A "extends" B means A inherits the properties and methods from B.

interface Vis2Props {
    selectedRiskRatings: string[];
    onSelectedRatingsChange: (ratings: string[]) => void;
}

export default function Vis_2({ selectedRiskRatings, onSelectedRatingsChange }: Vis2Props) {
    const [data, setData] = useState<NumbericalData[]>([]);
    const chartRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
    const margin: Margin = { top: 30, right: 20, bottom: 40, left: 60 };
    const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);

    useResizeObserver({ ref: chartRef, onResize });

    useEffect(() => {
        // For reading json file
        /*if (isEmpty(dataFromJson)) return;
        setBars(dataFromJson.data);*/
    
        // For reading csv file
        const dataFromCSV = async () => {
            try {
                const csvData = await d3.csv('../../data/financial_risk.csv', d => {
                    if(!d.Income || !d['Credit Score'] || !d['Loan Amount'] || !d['Assets Value'] || !d['Risk Rating']) {
                        return null;
                    }

                    return {
                        Income: +d.Income,
                        CreditScore: +d['Credit Score'],
                        LoanAmount: +d['Loan Amount'],
                        AssetsValue: +d['Assets Value'],
                        RiskRating: d['Risk Rating']
                    };
                });
                const validData = csvData
                    .filter(d => d !== null)
                    .map(d => d as NumbericalData)
                    .slice(0, 150);
                setData(validData);
            } catch (error) {
                console.error('Error loading CSV:', error);
            }
    };

        dataFromCSV();
    }, [])

    useEffect(() => {
        if (isEmpty(data)) return;
        if (size.width === 0 || size.height === 0) return;
        d3.select('#parallel-svg').selectAll('*').remove();
        initChart();
    }, [data, size, selectedRiskRatings])

    function initChart() {
        const chartContainer = d3.select('#parallel-svg');
        const width = size.width - margin.left - margin.right;
        const height = size.height - margin.top - margin.bottom;
        const dimensions = ["Income", "CreditScore", "LoanAmount", "AssetsValue"];
    
        // Filter data based on selectedRiskRatings (show all if no selection)
        const filteredData = selectedRiskRatings.length > 0
            ? data.filter(d => selectedRiskRatings.includes(d.RiskRating))
            : data;
    
        // Define scales
        const yScales: { [key: string]: d3.ScaleLinear<number, number> } = {};
        dimensions.forEach(dimension => {
            yScales[dimension] = d3.scaleLinear()
                .domain(d3.extent(data, d => {
                    const value = +d[dimension];
                    return isNaN(value) ? null : value;
                }) as [number, number])
                .range([height, 0]);
        });
    
        const xScale = d3.scalePoint()
            .domain(dimensions)
            .range([margin.left, width - 100]);
    
        const colorScale = d3.scaleOrdinal()
            .domain(["Low", "Medium", "High"])
            .range(["green", "blue", "red"]);
    
        // Define path generator function
        function path(d: NumbericalData) {
            return d3.line()(
                dimensions.map(p => {
                    const value = +d[p];
                    const x = xScale(p);
                    const y = isNaN(value) ? undefined : yScales[p](value);
                    return [x, y];
                }).filter(v => v[1] !== undefined) as [number, number][]
            );
        }
    
        // Render paths based on filtered data
        chartContainer.append('g')
            .selectAll('path')
            .data(filteredData)
            .join('path')
            .attr('d', d => path(d))
            .style('fill', 'none')
            .attr('stroke', d => colorScale(d.RiskRating) as string)
            .style('opacity', 0.8);
    
        // Render axes
        dimensions.forEach(dimension => {
            chartContainer.append('g')
                .attr('transform', `translate(${xScale(dimension)}, 0)`)
                .call(d3.axisLeft(yScales[dimension]));
        });
    
        // Add title and x-axis
        chartContainer.append('text')
            .attr('transform', `translate(${size.width / 2 - 50}, ${size.height - margin.top + 15})`)
            .attr('dy', '0.5rem')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Financial Risk Assessment - Parallel Coordinates Plot');
    
        chartContainer.append('g')
            .attr('transform', `translate(0, ${height + margin.bottom - 30})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('text-anchor', 'middle')
            .style('font-size', '12px');
    
        // Create legend with click events for multiple selection
        const legend = chartContainer.append('g')
            .attr('transform', `translate(${width - margin.right - 100}, ${margin.top})`);
        
        legend.append('text')
            .attr('x', 30)
            .attr('y', -10)
            .text('Risk Rating')
            .style('font-size', '1rem')
            .style('font-weight', 'bold');
    
        const categories = ["Low", "Medium", "High"];
        categories.forEach((category, i) => {
            const isSelected = selectedRiskRatings.includes(category);
    
            legend.append('rect')
                .attr('x', 30)
                .attr('y', i * 20)
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', colorScale(category) as string)
                .style('cursor', 'pointer')
                .attr('opacity', isSelected ? 1 : 0.4) // Highlight selected categories
                .on('click', () => {
                    const updatedRatings = isSelected
                        ? selectedRiskRatings.filter(rating => rating !== category)
                        : [...selectedRiskRatings, category];
                    onSelectedRatingsChange(updatedRatings); // Use prop to update parent state
                });
            
            legend.append('text')
                .attr('x', 50)
                .attr('y', i * 20 + 12)
                .text(category)
                .style('font-size', '.8rem')
                .attr('alignment-baseline', 'middle')
                .style('cursor', 'pointer')
                .on('click', () => {
                    const updatedRatings = isSelected
                        ? selectedRiskRatings.filter(rating => rating !== category)
                        : [...selectedRiskRatings, category];
                    onSelectedRatingsChange(updatedRatings);
                });
        });
    }
    
    

    return (
        <>
        <div ref={chartRef} className='chart-container' style={{ width: '100%', height: '100%' }}>
            <svg id='parallel-svg' width={size.width} height={size.height}></svg>
        </div>
        </>
    )
    
}
