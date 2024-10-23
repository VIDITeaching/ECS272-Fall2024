<script lang="ts">
import * as d3 from "d3";
import { isEmpty, debounce } from 'lodash';

import { Bar, ComponentSize, Margin } from '../types';

interface CategoricalBar extends Bar {
    category: string;
}

export default {
    data() {
        return {
            studentData: [] as CategoricalBar[],
            size: { width: 0, height: 0 } as ComponentSize,
            margin: { left: 50, right: 20, top: 60, bottom: 100 } as Margin,
        }
    },
    computed: {
        rerender() {
            return (!isEmpty(this.studentData)) && this.size;
        }
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
            let readFromCSV = await d3.csv('/mnt/data/Student Mental health.csv', (d: d3.DSVRowString<"Have Depression" | "Have Anxiety" | "Have Panic Attack">) => {
                return {
                    depression: d['Have Depression'] ?? '',
                    anxiety: d['Have Anxiety'] ?? '',
                    panicAttack: d['Have Panic Attack'] ?? ''
                };
            });

            this.studentData = readFromCSV;
        },
        initChart() {
            let chartContainer = d3.select('#parallel-coordinates-svg');

            // Set up the dimensions and margins of the plot
            const width = this.size.width - this.margin.left - this.margin.right;
            const height = this.size.height - this.margin.top - this.margin.bottom;

            // Define the dimensions to use in the parallel coordinates plot
            const dimensions = ['depression', 'anxiety', 'panicAttack'];

            // Set up the scales for each dimension
            const yScales: { [key: string]: d3.ScalePoint<string> } = {};
            dimensions.forEach((dimension) => {
                yScales[dimension] = d3.scalePoint()
                    .domain([...new Set(this.studentData.map(d => d[dimension]))])
                    .range([height, 0]);
            });

            // Define the x scale for the dimensions
            const xScale = d3.scalePoint()
                .domain(dimensions)
                .range([0, width])
                .padding(1);

            // Create a line generator function
            const line = d3.line()
                .curve(d3.curveLinear)
                .x((d, i) => xScale(dimensions[i]) as number)
                .y((d, i) => yScales[dimensions[i]](d) as number);

            // Draw the lines for each student
            chartContainer.append('g')
                .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
                .selectAll('path')
                .data(this.studentData)
                .enter().append('path')
                .attr('d', d => line(dimensions.map(p => d[p])))
                .attr('fill', 'none')
                .attr('stroke', '#1f77b4')
                .attr('stroke-width', 1);

            // Draw the axes
            chartContainer.append('g')
                .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
                .selectAll('.dimension')
                .data(dimensions)
                .enter().append('g')
                .attr('class', 'dimension')
                .attr('transform', d => `translate(${xScale(d)}, 0)`)
                .each(function (d) {
                    d3.select(this).call(d3.axisLeft(yScales[d]));
                });

            // Add axis titles
            chartContainer.append('g')
                .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
                .selectAll('.axis-title')
                .data(dimensions)
                .enter().append('text')
                .attr('class', 'axis-title')
                .attr('x', d => xScale(d))
                .attr('y', -10)
                .attr('text-anchor', 'middle')
                .text(d => d.charAt(0).toUpperCase() + d.slice(1));
        }
    },
    watch: {
        rerender(newSize) {
            if (!isEmpty(newSize)) {
                d3.select('#parallel-coordinates-svg').selectAll('*').remove();
                this.initChart();
            }
        }
    },
    mounted() {
        window.addEventListener('resize', debounce(this.onResize, 100));
        this.onResize();
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.onResize);
    }
}
</script>

<template>
    <div class="chart-container d-flex" ref="chartContainer">
        <svg id="parallel-coordinates-svg" :width="size.width" :height="size.height">
            <!-- The chart will be inserted here -->
        </svg>
    </div>
</template>

<style scoped>
.chart-container {
    height: 100%;
    width: 100%;
}
</style>
