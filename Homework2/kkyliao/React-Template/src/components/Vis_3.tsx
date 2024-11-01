import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import dataFromJson from '../../data/demo.json';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

import { CountryCreditScore, ComponentSize, Margin } from '../types';

export default function Example() {
    const [data, setData] = useState<CountryCreditScore[]>([]);
    const chartRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
    const margin: Margin = { top: 30, right: 20, bottom: 50, left: 60 };
    const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)

    useResizeObserver({ ref: chartRef, onResize });

    useEffect(() => {
        const dataFromCSV = async () => {
            try {
                const csvData = await d3.csv('../../data/financial_risk.csv', d => {
                    if(!d.Country || !d['Credit Score']) {
                        return null;
                    }
                    return {
                        Country: d.Country,
                        CreditScore: +d['Credit Score']
                    };
                });

                const validData = csvData.filter(d => d !== null) as {
                    Country: string;
                    CreditScore: number
                }[];

                const countryAverageScores = d3.rollup(
                    validData,
                    v => d3.mean(v, d => d.CreditScore),
                    d => d.Country
                );

                let dataArray: CountryCreditScore[] = Array.from(countryAverageScores, ([Country, AvgCreditScore]) => ({
                    Country,
                    AvgCreditScore: AvgCreditScore as number // Explicitly cast to number
                }));
        
                dataArray = dataArray.sort((a, b) => b.AvgCreditScore - a.AvgCreditScore).slice(0, 15);

                setData(dataArray);
            } catch (error) {
                console.error('Error loading CSV:', error);
            }
        } 
        dataFromCSV();
    }, [])

    useEffect(() => {
        if (isEmpty(data)) return;
        if (size.width === 0 || size.height === 0) return;
        d3.select('#bar-svg').selectAll('*').remove();
        initChart();
    }, [data, size])

    function initChart() {
        let chartContainer = d3.select('#bar-svg');

        const width = size.width - margin.left - margin.right;
        const height = size.height - margin.top - margin.bottom;

        const minScore = d3.min(data, d => d.AvgCreditScore) || 0;
        const maxScore = d3.max(data, d => d.AvgCreditScore) || 100;
        const padding = (maxScore - minScore) * 0.1;

    // Scales

        const yScale = d3.scaleLinear()
            .domain([minScore - padding, maxScore + padding]) // Provide default value of 0 if d3.max() returns undefined
            .nice()
            .range([height - margin.bottom, margin.top]);

        const xScale = d3.scaleBand()
            .domain(data.map(d => d.Country))
            .range([margin.left, width - margin.right])
            .padding(0.1);
    
        const bars = chartContainer.selectAll('rect')
            .data(data)
            .join('rect')
            .attr('x', d => xScale(d.Country) as number)
            .attr('y', d => yScale(d.AvgCreditScore) as number)
            .attr('width', xScale.bandwidth())
            .attr('height', d => height - margin.bottom - yScale(d.AvgCreditScore))
            .attr('fill', 'steelblue');

        const xAxis = chartContainer.append('g')
            .attr('transform', `translate(0, ${height - margin.bottom})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        const yAxis = chartContainer.append('g')
            .attr('transform', `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(yScale));

        const yLabel = chartContainer.append('g')
            .attr('transform', `translate(${margin.left / 2}, ${height / 2}) rotate(-90)`)
            .append('text')
            .text('Average Credit Score')
            .style('font-size', '.8rem');

        const xLabel = chartContainer.append('g')
            .attr('transform', `translate(${(width - margin.left) / 2}, ${height + 65})`)
            .append('text')
            .text('Countries')
            .style('font-size', '.8rem');

        const title = chartContainer.append('g')
            .append('text')
            .attr('x', width / 2)
            .attr('y', margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '1.2rem')
            .style('font-weight', 'bold')
            .text('Top 15 Countries with Average Credit Score');
    }


    return (
        <>
        <div ref={chartRef} className='chart-container'>
            <svg id='bar-svg' width='100%' height='100%'></svg>
        </div>
        </>
    )
}
