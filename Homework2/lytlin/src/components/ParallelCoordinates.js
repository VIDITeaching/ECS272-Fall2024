import React from 'react';
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

export default function ParallelCoordinates() {
    const [data, setData] = useState([]);
    const chartRef = useRef(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const margin = { top: 80, right: 200, bottom: 120, left: 100 };
    const onResize = useDebounceCallback((size) => setSize(size), 200);

    useResizeObserver({ ref: chartRef, onResize });

    useEffect(() => {
        const dataFromCSV = async () => {
            try {
                const csvData = await d3.csv('/Student Mental health.csv', (d) => {
                    return {
                        age: +d['Age'],
                        gpa: d['What is your CGPA?'],
                        gender: d['Choose your gender'],
                        year: extractYear(d['Your current year of Study']),
                        marital: d['Marital status'] === 'Yes' ? 1 : 0,
                        depression: d['Do you have Depression?'] === 'Yes' ? 1 : 0,
                        anxiety: d['Do you have Anxiety?'] === 'Yes' ? 1 : 0,
                        panicAttack: d['Do you have Panic attack?'] === 'Yes' ? 1 : 0,
                        treatment: d['Did you seek any specialist for a treatment?'] === 'Yes' ? 1 : 0,
                    };
                });

                console.log('CSV Data:', csvData);

                // Aggregating data by year and gender
                const aggregatedData = d3.groups(csvData, d => d.year, d => d.gender)
                    .map(([year, genderData]) => genderData.map(([gender, records]) => {
                        return {
                            year,
                            gender,
                            avgAge: d3.mean(records.filter(d => d.age && !isNaN(d.age)), d => d.age),
                            avgGPA: categorizeGPA(records.map(d => d.gpa)),
                            maritalYes: d3.sum(records, d => d.marital),
                            depressionYes: d3.sum(records, d => d.depression),
                            anxietyYes: d3.sum(records, d => d.anxiety),
                            panicYes: d3.sum(records, d => d.panicAttack),
                            treatmentYes: d3.sum(records, d => d.treatment),
                        };
                    })).flat();

                console.log('Aggregated Data:', aggregatedData);
                setData(aggregatedData);
            } catch (error) {
                console.error('Error loading CSV:', error);
            }
        };
        dataFromCSV();
    }, []);

    useEffect(() => {
        if (size.width === 0 || size.height === 0) return;
        d3.select('#parallel-svg').selectAll('*').remove();
        drawChart(data);
    }, [data, size]);

    function extractYear(yearString) {
        if (!yearString) {
            console.warn('Undefined year value encountered.');
            return null; // Return null for undefined or missing values
        }
        const match = yearString.match(/\d+/);
        return match ? +match[0] : null;
    }

    function categorizeGPA(gpaArray) {
        // Convert GPA categories into an average numerical value.
        const gpaMap = {
            '3.50 - 4.00': 3.75,
            '3.00 - 3.49': 3.25,
            '2.50 - 2.99': 2.75,
            '2.00 - 2.49': 2.25,
            '0 - 1.99': 1.00,
        };
        return d3.mean(gpaArray.map(gpa => gpaMap[gpa] || 0));
    }

    function drawChart(data) {
        const chartContainer = d3.select('#parallel-svg')
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        const dimensions = ['avgAge', 'avgGPA', 'maritalYes', 'depressionYes', 'anxietyYes', 'panicYes', 'treatmentYes'];
        const height = size.height - margin.top - margin.bottom;
        const width = size.width - margin.left - margin.right;

        const yScales = {};
        dimensions.forEach(dim => {
            yScales[dim] = d3.scaleLinear()
                .domain(d3.extent(data, d => d[dim]))
                .range([height, 0]);
        });

        const xScale = d3.scalePoint()
            .domain(dimensions)
            .range([0, width])
            .padding(1);

        // Draw Y axes
        chartContainer.selectAll('.dimension')
            .data(dimensions)
            .enter().append('g')
            .attr('class', 'dimension')
            .attr('transform', d => `translate(${xScale(d)})`)
            .each(function (d) {
                const axis = d3.axisLeft(yScales[d]);

                // maritalYes and treatmentYes use integer ticks
                if (d === 'maritalYes' || d === 'treatmentYes') {
                    axis.ticks(Math.ceil(yScales[d].domain()[1]));
                }

                d3.select(this).call(axis);
            })
            .append('text')
            .style('text-anchor', 'middle')
            .attr('y', -10)
            .text(d => {
                switch (d) {
                    case 'avgAge': return 'Average Age';
                    case 'avgGPA': return 'Average GPA';
                    case 'maritalYes': return 'Marital (Yes Count)';
                    case 'depressionYes': return 'Depression (Yes Count)';
                    case 'anxietyYes': return 'Anxiety (Yes Count)';
                    case 'panicYes': return 'Panic Attack (Yes Count)';
                    case 'treatmentYes': return 'Treatment (Yes Count)';
                    default: return '';
                }
            })
            .style('font-size', '14px');

        // Add X axis labels
        chartContainer.selectAll('.x-label')
            .data(dimensions)
            .enter().append('text')
            .attr('class', 'x-label')
            .attr('x', d => xScale(d))
            .attr('y', height + margin.bottom / 800)
            .style('text-anchor', 'middle')
            .text(d => {
                switch (d) {
                    case 'avgAge': return 'Average Age';
                    case 'avgGPA': return 'Average GPA';
                    case 'maritalYes': return 'Married(Number of People)';
                    case 'depressionYes': return 'Depression(Number of People)';
                    case 'anxietyYes': return 'Anxiety(Number of People)';
                    case 'panicYes': return 'Panic Attack(Number of People)';
                    case 'treatmentYes': return 'Treatment(Number of People)';
                    default: return '';
                }
            })
            .each(function (d) {
                const element = d3.select(this);

                // Apply rotation to all labels
                element.attr('transform', `rotate(-45, ${xScale(d)}, ${height + margin.bottom / 800})`)
                    .style('text-anchor', 'end')
                    .attr('dx', '-0.5em')
                    .attr('dy', '0.5em');
            })
            .style('font-size', () => `${Math.max(10, size.width * 0.008)}px`);

        const line = d3.line()
            .x(d => xScale(d.dimension))
            .y(d => yScales[d.dimension](d.value));

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        chartContainer.selectAll('.line-path')
            .data(data)
            .enter()
            .append('path')
            .attr('class', 'line-path')
            .attr('d', d => line(dimensions.map(p => ({ dimension: p, value: d[p] }))))
            .style('fill', 'none')
            .style('stroke', (d, i) => colorScale(i)) // Assign a unique color to each line
            .style('stroke-width', 2)
            .style('opacity', 0.8);

        // Add chart title
        chartContainer.append('text')
            .attr('x', width / 2)
            .attr('y', -margin.top / 2)
            .style('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Parallel Coordinate Plot for Students Grouped by Grade and Gender');

        // Add legend
        const legend = chartContainer.selectAll('.legend')
            .data(data)
            .enter().append('g')
            .attr('class', 'legend')
            .attr('transform', (d, i) => `translate(${width + 20}, ${i * 20})`);

        legend.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 10)
            .attr('height', 10)
            .style('fill', (d, i) => colorScale(i));

        legend.append('text')
            .attr('x', 20)
            .attr('y', 10)
            .text(d => `Year ${d.year} ${d.gender} Students`)
            .style('font-size', '12px')
            .attr('alignment-baseline', 'middle');
    }

    return (
        <div ref={chartRef} className='chart-container' style={{ height: '600px' }}>
            <svg id='parallel-svg' width='100%' height='100%'></svg>
        </div>
    );
}
