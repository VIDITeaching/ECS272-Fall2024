import React from 'react';
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

export default function ScatterPlot() {
    const [depressionData, setDepressionData] = useState([]);
    const [anxietyData, setAnxietyData] = useState([]);
    const [panicData, setPanicData] = useState([]);
    const scatterRef = useRef(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    const margin = { top: 80, right: 200, bottom: 100, left: 150 };
    const onResize = useDebounceCallback((size) => setSize(size), 200);

    useResizeObserver({ ref: scatterRef, onResize });

    useEffect(() => {
        const dataFromCSV = async () => {
            try {
                const csvData = await d3.csv('/Student Mental health.csv', (d) => {
                    return {
                        age: +d['Age'],
                        gpa: d['What is your CGPA?'],
                        depression: d['Do you have Depression?'] === 'Yes' ? 1 : 0,
                        anxiety: d['Do you have Anxiety?'] === 'Yes' ? 1 : 0,
                        panicAttack: d['Do you have Panic attack?'] === 'Yes' ? 1 : 0,
                    };
                });

                // Aggregating data for each condition
                const depressionAgg = aggregateData(csvData.filter(d => d.depression === 1));
                const anxietyAgg = aggregateData(csvData.filter(d => d.anxiety === 1));
                const panicAgg = aggregateData(csvData.filter(d => d.panicAttack === 1));

                setDepressionData(depressionAgg);
                setAnxietyData(anxietyAgg);
                setPanicData(panicAgg);
            } catch (error) {
                console.error('Error loading CSV:', error);
            }
        };
        dataFromCSV();
    }, []);

    useEffect(() => {
        if (size.width === 0 || size.height === 0) return;
        d3.select('#scatter-svg').selectAll('*').remove();
        drawChart(depressionData, 'Depression', 'teal', 'triangle');
        drawChart(anxietyData, 'Anxiety', 'red', 'circle');
        drawChart(panicData, 'Panic Attack', 'blue', 'square');
        drawLegend();
    }, [depressionData, anxietyData, panicData, size]);

    function categorizeGPA(gpa) {
        const validRanges = [
            '3.50 - 4.00',
            '3.00 - 3.49',
            '2.50 - 2.99',
            '2.00 - 2.49',
            '0 - 1.99'
        ];
        gpa = gpa.trim();
        if (validRanges.includes(gpa)) {
            return gpa;
        } else {
            console.warn(`Unexpected GPA value found: ${gpa}`);
            return 'Unknown';
        }
    }

    function aggregateData(filteredData) {
        const groupedData = d3.rollups(
            filteredData,
            v => v.length,
            d => d.age,
            d => categorizeGPA(d.gpa)
        );
        return groupedData.flatMap(([age, gpaData]) =>
            gpaData.map(([gpaRange, count]) => ({ age, gpaRange, count }))
        );
    }

    function drawChart(data, conditionName, color, shape) {
        const chartContainer = d3.select('#scatter-svg')
            .append('g')
            .attr('class', conditionName);

        const yCategories = [
            '0 - 1.99',
            '2.00 - 2.49',
            '2.50 - 2.99',
            '3.00 - 3.49',
            '3.50 - 4.00'
        ];

        const xScale = d3.scaleLinear()
            .domain([18, 25])
            .range([margin.left, size.width - margin.right])
            .nice();

        const tickValues = d3.range(18, 25);
        const gridWidth = (xScale(19) - xScale(18)) / 2;

        const yScale = d3.scaleBand()
            .domain(yCategories)
            .rangeRound([size.height - margin.bottom, margin.top])
            .padding(0.1);

        const rScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count)])
            .range([5, 40]); // Point size range

        // X Axis
        chartContainer.append('g')
            .attr('transform', `translate(0, ${size.height - margin.bottom})`)
            .call(d3.axisBottom(xScale).tickValues(tickValues).tickFormat(d => `${d}`))
            .selectAll('text')
            .style('font-size', '12px')
            .attr('y', 10)
            .attr('x', gridWidth); // Shift labels by half a grid width

        chartContainer.append('text')
            .attr('x', (size.width) / 2)
            .attr('y', size.height - margin.bottom / 3)
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('Age of Students');

        // Y Axis
        chartContainer.append('g')
            .attr('transform', `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(yScale));

        chartContainer.append('text')
            .attr('transform', `translate(${margin.left / 2}, ${size.height / 2}) rotate(-90)`)
            .attr('text-anchor', 'middle')
            .style('font-size', '1rem')
            .text('GPA Range of Students');

        // Scatter points with different shapes
        if (shape === 'circle') {
            chartContainer.selectAll(`.${conditionName}-points`)
                .data(data)
                .enter()
                .append('circle')
                .attr('cx', d => xScale(d.age) + gridWidth)
                .attr('cy', d => yScale(d.gpaRange) + yScale.bandwidth() / 2)
                .attr('r', d => rScale(d.count))
                .attr('fill', color)
                .attr('opacity', 0.7);
        } else if (shape === 'triangle') {
            chartContainer.selectAll(`.${conditionName}-points`)
                .data(data)
                .enter()
                .append('path')
                .attr('d', d3.symbol().type(d3.symbolTriangle).size(d => rScale(d.count) * 20))
                .attr('transform', d => `translate(${xScale(d.age) + gridWidth}, ${yScale(d.gpaRange) + yScale.bandwidth() / 2})`)
                .attr('fill', color)
                .attr('opacity', 0.7);
        } else if (shape === 'square') {
            chartContainer.selectAll(`.${conditionName}-points`)
                .data(data)
                .enter()
                .append('rect')
                .attr('x', d => xScale(d.age) + gridWidth - rScale(d.count) / 2)
                .attr('y', d => yScale(d.gpaRange) + yScale.bandwidth() / 2 - rScale(d.count) / 2)
                .attr('width', d => rScale(d.count))
                .attr('height', d => rScale(d.count))
                .attr('fill', color)
                .attr('opacity', 0.7);
        }

        // Chart title
        chartContainer.append('text')
            .attr('x', size.width / 2)
            .attr('y', margin.top / 2 - 10)
            .attr('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .style('font-size', '16px')
            .text('Relationship Between Age, GPA, and Mental Health Conditions among Students');
    }

    function getSymbol(shape) {
        switch (shape) {
            case 'triangle': return d3.symbolTriangle;
            case 'circle': return d3.symbolCircle;
            case 'square': return d3.symbolSquare;
            default: return d3.symbolCircle;
        }
    }

    function drawLegend() {
        const legendData = [
            { name: 'Depression', color: 'teal', shape: 'triangle' },
            { name: 'Anxiety', color: 'red', shape: 'circle' },
            { name: 'Panic Attack', color: 'blue', shape: 'square' }
        ];

        const legend = d3.select('#scatter-svg')
            .append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${size.width - margin.right + 30}, ${margin.top})`);

        legend.selectAll('legend-item')
            .data(legendData)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 30})`)
            .each(function (d) {
                d3.select(this)
                    .append('path')
                    .attr('d', d3.symbol().type(getSymbol(d.shape)).size(100))
                    .attr('fill', d.color);

                d3.select(this)
                    .append('text')
                    .attr('x', 20)
                    .attr('y', 5)
                    .text(d.name)
                    .style('font-size', '14px')
                    .attr('alignment-baseline', 'middle');
            });
    }

    return (
        <>
            <div ref={scatterRef} className='chart-container' style={{ height: '800px' }}>
                <svg id='scatter-svg' width='100%' height='100%'></svg>
            </div>
        </>
    );
}
