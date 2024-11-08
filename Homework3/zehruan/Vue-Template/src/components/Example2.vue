<script lang="ts">
import * as d3 from "d3";
import { isEmpty, debounce } from 'lodash';

import { ComponentSize, Margin } from '../types';
import { useStore } from '../stores/exampleStore'; // Import the store

interface MentalHealthEntry {
    gender: string;
    age: number | null;
    course: string;
    year: string;
    cgpa: number | null;
    merry: string;
    depression: string;
    anxiety: string;
    panicAttack: string;
}

export default {
    data() {
        return {
            studentData: [] as MentalHealthEntry[],
            size: { width: 0, height: 0 } as ComponentSize,
            margin: { left: 0, right: 0, top: 20, bottom: 20 } as Margin,
            debouncedOnResize: null as any,
        };
    },
    computed: {
        store() {
            return useStore();
        },
        selectedMentalState: {
            get() {
                return this.store.myGlobalVariable;
            },
            set(value) {
                this.store.myGlobalVariable = value;
            },
        },
        rerender() {
            return (!isEmpty(this.studentData)) && this.size && this.selectedMentalState;
        },
    },
    created() {
        // Reading the Student Mental health data
        this.read();
    },
    methods: {
        onResize() {
            let target = this.$refs.chartContainer as HTMLElement;
            if (!target) return;
            this.size = { width: target.clientWidth, height: target.clientHeight };
        },
        async read() {
            try {
                let readFromCSV = await d3.csv('../../data/Student Mental health.csv', (d: any) => {
                    const standardizeResponse = (response: string) => response?.trim().toLowerCase() ?? '';
                    const parseCgpa = (cgpaRange: string): number => {
                        const [min, max] = cgpaRange.split('-').map((s: string) => parseFloat(s.trim()));
                        return (min + max) / 2; // Midpoint of the range
                    };

                    return {
                        gender: standardizeResponse(d['Choose your gender']),
                        age: d['Age'] ? +d['Age'] : null,
                        course: standardizeResponse(d['What is your course?']),
                        year: standardizeResponse(d['Your current year of Study']),
                        cgpa: d['What is your CGPA?'] ? parseCgpa(d['What is your CGPA?']) : null,
                        merry: standardizeResponse(d['Marital status']),
                        depression: standardizeResponse(d['Do you have Depression?']),
                        anxiety: standardizeResponse(d['Do you have Anxiety?']),
                        panicAttack: standardizeResponse(d['Do you have Panic attack?']),
                    };
                });

                // Filter out entries with missing critical data
                this.studentData = (readFromCSV as MentalHealthEntry[]).filter(d => {
                    return d.depression && d.anxiety && d.panicAttack;
                });
                console.log("Data loaded:", this.studentData);
            } catch (error) {
                console.error("Error loading data:", error);
            }
        },
        initChart() {
            const { left, right, top, bottom } = this.margin;
            const width = this.size.width - left - right;
            const height = this.size.height - top - bottom;

            // Remove any existing chart elements before re-drawing
            d3.select('#parallel-coordinates-svg').selectAll('*').remove();

            // Select the existing SVG element and add a 'g' element for margins
            const svg = d3.select('#parallel-coordinates-svg')
                .attr('width', this.size.width)
                .attr('height', this.size.height);

            const chartGroup = svg.append('g')
                .attr('transform', `translate(${left},${top})`);

            // Define the dimensions to be displayed on the axes
            const dimensions = ["gender", "age", "year", "cgpa", "merry"];

            // Define a consistent color scale for "yes" and "no"
            const colorDomain = ["yes", "no"];
            const colorRange = ["#1f77b4", "#ff7f0e"]; // Choose your preferred colors
            const color = d3.scaleOrdinal<string>()
                .domain(colorDomain)
                .range(colorRange);

            // Prepare scales for each dimension
            const y: Record<string, d3.AxisScale<any>> = {};

            dimensions.forEach((dim) => {
                if (dim === 'cgpa' || dim === 'age') {
                    // Numerical scales
                    const values = this.studentData
                        .map(d => d[dim])
                        .filter(v => v !== null) as number[];
                    y[dim] = d3.scaleLinear()
                        .domain([d3.min(values)!, d3.max(values)!])
                        .range([height, 0]);
                } else {
                    // Categorical scales
                    const categories = Array.from(new Set(this.studentData.map(d => d[dim])));
                    y[dim] = d3.scalePoint()
                        .domain(categories)
                        .range([height, 0]);
                }
            });

            // Create the X scale to map each dimension to a specific position
            const x = d3.scalePoint()
                .range([0, width])
                .padding(1)
                .domain(dimensions);

            // Define the path function to generate lines connecting points of each data row
            const path = (d: MentalHealthEntry) =>
                d3.line()(dimensions.map((p) => {
                    const value = d[p];
                    if (value === null || value === undefined) return null;
                    return [x(p)!, y[p](value)];
                }).filter(point => point !== null) as [number, number][]);


            const selectedMentalState = this.selectedMentalState;

            // Highlight function to emphasize specific entries on hover
            const highlight = (event: any, d: MentalHealthEntry) => {
                const selectedValue = d[this.selectedMentalState];
                d3.selectAll('.line')
                    .transition().duration(200)
                    .style('stroke', 'lightgrey')
                    .style('opacity', 0.2);
                d3.selectAll(`.line-${this.selectedMentalState}-${selectedValue}`)
                    .transition().duration(200)
                    .style('stroke', color(selectedValue))
                    .style('opacity', 1);
            };

            // Function to revert the highlight effect
            const doNotHighlight = () => {
                d3.selectAll('.line')
                    .transition().duration(200)
                    .style('stroke', (d: MentalHealthEntry) => color(d[this.selectedMentalState]))
                    .style('opacity', 0.5);
            };

            // Draw lines for each data point
            chartGroup.selectAll('.line')
                .data(this.studentData)
                .join('path')
                .attr('class', (d) => `line line-${this.selectedMentalState}-${d[this.selectedMentalState]}`)
                .attr('d', path)
                .style('fill', 'none')
                .style('stroke', (d) => color(d[this.selectedMentalState]))
                .style('opacity', 0.5)
                .on('mouseover', highlight)
                .on('mouseleave', doNotHighlight);

            // Add axes for each dimension
            chartGroup.selectAll('.axis')
                .data(dimensions)
                .join('g')
                .attr('class', 'axis')
                .attr('transform', (d) => `translate(${x(d)})`)
                .each(function (d) {
                    if (d === 'cgpa' || d === 'age') {
                        // Numerical axis
                        d3.select(this).call(d3.axisLeft(y[d] as d3.ScaleLinear<number, number>));
                    } else {
                        // Categorical axis
                        d3.select(this).call(d3.axisLeft(y[d] as d3.ScalePoint<string>));
                    }
                })
                .append('text')
                .style('text-anchor', 'middle')
                .attr('y', -9)
                .text((d) => d)
                .style('fill', 'black');

            // Add legend
            const legend = svg.append('g')
                .attr('class', 'legend')
                .attr('transform', `translate(${width - 80}, ${top})`);

            // Legend title
            legend.append('text')
                .attr('x', 0)
                .attr('y', 0)
                .text(`${this.selectedMentalState.charAt(0).toUpperCase() + this.selectedMentalState.slice(1)} Status`)
                .style('font-weight', 'bold')
                .style('font-size', '14px');

            // Legend items
            colorDomain.forEach((value, index) => {
                const legendItem = legend.append('g')
                    .attr('class', 'legend-item')
                    .attr('transform', `translate(0, ${(index + 1) * 20})`);

                // Color box
                legendItem.append('rect')
                    .attr('x', 0)
                    .attr('y', -10)
                    .attr('width', 18)
                    .attr('height', 18)
                    .style('fill', color(value));

                // Text label
                legendItem.append('text')
                    .attr('x', 24)
                    .attr('y', 0)
                    .attr('dy', '0.32em')
                    .text(value.charAt(0).toUpperCase() + value.slice(1));
            });
        },
        // ... other methods ...
    },
    watch: {
        rerender(newVal) {
            if (newVal) {
                d3.select('#parallel-coordinates-svg').selectAll('*').remove();
                this.initChart();
            }
        },
        selectedMentalState(newVal) {
            // Re-initialize the chart when the selected mental state changes
            d3.select('#parallel-coordinates-svg').selectAll('*').remove();
            this.initChart();
        },
    },
    mounted() {
        window.addEventListener('resize', debounce(this.onResize, 100));
        this.onResize();
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.onResize);
    },
};
</script>

<template>
    <div>
        <!-- Mental State Switch -->
        <div class="mental-state-switch">
            <label>Select Mental State:</label>
            <select v-model="selectedMentalState">
                <option value="depression">Depression</option>
                <option value="anxiety">Anxiety</option>
                <option value="panicAttack">Panic Attack</option>
            </select>
        </div>
        <!-- Chart Container -->
        <div class="chart-container d-flex" ref="chartContainer">
            <svg id="parallel-coordinates-svg" width="100" height="300">
                <!-- The chart will be inserted here -->
            </svg>
        </div>
    </div>
</template>

<style scoped>

.mental-state-switch {
    margin-bottom: 10px;
}

svg {
    width: 100%;
}

.chart-container {
    width: 150%;
}

</style>

