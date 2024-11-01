import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import dataFromJson from '../../data/demo.json';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

import { NumbericalData, ComponentSize, Margin } from '../types';
// A "extends" B means A inherits the properties and methods from B.




export default function Vis_2() {
    const [data, setData] = useState<NumbericalData[]>([]);
    const chartRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
    const margin: Margin = { top: 40, right: 20, bottom: 40, left: 60 };
    const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);
//   const [bars, setBars] = useState<CategoricalBar[]>([]);
//   const barRef = useRef<HTMLDivElement>(null);
//   const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
//   const margin: Margin = { top: 40, right: 20, bottom: 80, left: 60 };
//   const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)

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

                console.log('Data:', csvData);
                const validData = csvData.filter(d => d !== null).slice(0, 60);
                console.log('Loaded Data:', validData);
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
    }, [data, size])

    function initChart() {
        let chartContainer = d3.select('#parallel-svg');

        const width = size.width - margin.left - margin.right;
        const height = size.height - margin.top - margin.bottom;

        const dimensions = ["Income", "CreditScore", "LoanAmount", "AssetsValue"];

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
            .range(["green", "yellow", "red"]);

        function path(d: NumbericalData) {
            return d3.line()(
                dimensions.map(p => {
                    const value = +d[p];
                    const x = xScale(p); // X is always valid because `p` comes from `dimensions`
                    const y = isNaN(value) ? undefined : yScales[p](value); // Check if value is a valid number
                    return [x, y]; // Return the [x, y] pair
                }).filter(v => v[1] !== undefined) as [number, number][] // Filter to ensure valid [x, y] pairs
            );
        }
        

        chartContainer.append('g')
            .selectAll('path')
            .data<NumbericalData>(data)
            .join('path')
            .attr('d', (d: NumbericalData) => path(d))
            .style('fill', 'none')
            .attr('stroke', (d: NumbericalData) => colorScale(d.RiskRating) as string)
            .style('opacity', 0.8);

        dimensions.forEach(dimension => {
            chartContainer.append('g')
                .attr('transform', `translate(${xScale(dimension)}, 0)`)
                .call(d3.axisLeft(yScales[dimension]));
        });
        
        const title = chartContainer.append('g')
            .append('text')
            .attr('transform', `translate(${size.width / 2 - 50}, ${size.height - margin.top + 15})`)
            .attr('dy', '0.5rem')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Financial Risk Assessment - Parallel Coordinates Plot');

        const xAxis = chartContainer.append('g')
            .attr('transform', `translate(0, ${height + margin.bottom - 30})`) // Position below the chart
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('text-anchor', 'middle')
            .style('font-size', '12px'); // Customize text appearance

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
            legend.append('rect')
                .attr('x', 30)
                .attr('y', i * 20)
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', colorScale(category) as string);
            
            legend.append('text')
                .attr('x', 50)
                .attr('y', i * 20 + 12)
                .text(category)
                .style('font-size', '.8rem')
                .attr('alignment-baseline', 'middle');
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
