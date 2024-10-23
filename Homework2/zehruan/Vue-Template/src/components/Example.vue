<script lang="ts">
import * as d3 from "d3";
import axios from 'axios';
import { isEmpty, debounce } from 'lodash';

import { Bar, ComponentSize, Margin } from '../types';
import { useStore } from '../stores/exampleStore';
import { myGlobalVariable } from '../stores/exampleStore';
import { defineComponent, computed } from 'vue'; 

interface CategoricalBar extends Bar {
    category: string;
}

export default {
    setup() {
        const gg = myGlobalVariable
        const store = useStore()
        const count = computed(() => store.count)
        return {
        count,
        increment: store.increment,
        }
    },
    data() {
        return {
            bars: [] as CategoricalBar[], // Store the loaded data
            size: { width: 0, height: 0 } as ComponentSize,
            margin: { left: 50, right: 20, top: 60, bottom: 100 } as Margin, // Increase top margin
        }
    },
    computed: {
        rerender() {
            return (!isEmpty(this.bars)) && this.size;
        }
    },
    created() {
        // Reading the Student Mental health data
        this.read();
    },
    methods: {
        onResize() {
            let target = this.$refs.barContainer as HTMLElement;
            if (!target) return;
            this.size = { width: target.clientWidth, height: target.clientHeight };
        },
        async read() {
            let readFromCSV = await d3.csv('../../data/Student Mental health.csv', (d: d3.DSVRowString<"Do you have Depression?" | "Do you have Anxiety?" | "Do you have Panic attack?">) => {
                return {
                    depression: d['Do you have Depression?'] ?? '',
                    anxiety: d['Do you have Anxiety?'] ?? '',
                    panicAttack: d['Do you have Panic attack?'] ?? ''
                };
            });

            const categories = [
                { category: "Have Depression", value: 0, color: 'red', group: 1 },
                { category: "Don't Have Depression", value: 0, color: 'blue', group: 1 },
                { category: "Have Anxiety", value: 0, color: 'red', group: 2 },
                { category: "Don't Have Anxiety", value: 0, color: 'blue', group: 2 },
                { category: "Have Panic Attack", value: 0, color: 'red', group: 3 },
                { category: "Don't Have Panic Attack", value: 0, color: 'blue', group: 3 }
            ];

            readFromCSV.forEach((d) => {
                if (d.depression === 'Yes') {
                    categories[0].value++;
                } else {
                    categories[1].value++;
                }

                if (d.anxiety === 'Yes') {
                    categories[2].value++;
                } else {
                    categories[3].value++;
                }

                if (d.panicAttack === 'Yes') {
                    categories[4].value++;
                } else {
                    categories[5].value++;
                }
            });

            this.bars = categories;
        },
        initChart() {
            let chartContainer = d3.select('#bar-svg');

            let yExtents = d3.extent(this.bars.map((d: CategoricalBar) => d.value)) as [number, number];

            let xScale = d3.scaleBand()
                .rangeRound([this.margin.left, this.size.width - this.margin.right])
                .domain(this.bars.map(d => d.category))
                .padding(0.3);

            let yScale = d3.scaleLinear()
                .range([this.size.height - this.margin.bottom, this.margin.top])
                .domain([0, yExtents[1]]);

            // Add title
            chartContainer.append('text')
                .attr('x', this.size.width / 2)
                .attr('y', this.margin.top / 3) // Adjust to prevent overlap
                .attr('text-anchor', 'middle')
                .style('font-size', '20px')
                .style('font-weight', 'bold')
                .text('Student Mental Health ' + myGlobalVariable);

            chartContainer.append('g')
                .attr('transform', `translate(0, ${this.size.height - this.margin.bottom})`)
                .call(d3.axisBottom(xScale));

            // Add x-axis label
            chartContainer.append('text')
                .attr('transform', `translate(${this.size.width / 2}, ${this.size.height - this.margin.top + 80})`) // Adjust for bottom spacing
                .style('text-anchor', 'middle')
                .text('Mental Health Condition')
                .style('font-size', '14px');

            chartContainer.append('g')
                .attr('transform', `translate(${this.margin.left}, 0)`)
                .call(d3.axisLeft(yScale));

            // Add y-axis label
            chartContainer.append('text')
                .attr('transform', 'rotate(-90)')
                .attr('y', this.margin.left / 3)
                .attr('x', -(this.size.height / 2))
                .attr('dy', '-3.5em')
                .style('text-anchor', 'middle')
                .text('Number of Students')
                .style('font-size', '14px');

            // Add the bars
            chartContainer.append('g')
                .selectAll('rect')
                .data(this.bars)
                .join('rect')
                .attr('x', (d: CategoricalBar) => xScale(d.category) as number)
                .attr('y', (d: CategoricalBar) => yScale(d.value) as number)
                .attr('width', xScale.bandwidth())
                .attr('height', (d: CategoricalBar) => Math.abs(yScale(0) - yScale(d.value)))
                .attr('fill', (d: CategoricalBar) => d.color)
                .on('click', (event, d: CategoricalBar) => {
                    this.handleBarClick(d);
                });

            // Add text labels on top of the bars
            chartContainer.append('g')
                .selectAll('text')
                .data(this.bars)
                .join('text')
                .attr('x', (d: CategoricalBar) => (xScale(d.category) as number) + xScale.bandwidth() / 2)
                .attr('y', (d: CategoricalBar) => yScale(d.value) - 5)
                .attr('text-anchor', 'middle')
                .style('font-size', '0.8rem')
                .style('fill', 'black')
                .text((d: CategoricalBar) => d.value);

            // Add legend for color explanation
            let legend = chartContainer.append('g')
                .attr('transform', `translate(${this.size.width - 50}, ${this.margin.top + 20})`); // Adjusted for better positioning

            legend.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', 20)
                .attr('height', 20)
                .attr('fill', 'red');

            legend.append('text')
                .attr('x', 30)
                .attr('y', 15)
                .text('Yes')
                .style('font-size', '14px');

            legend.append('rect')
                .attr('x', 0)
                .attr('y', 30)
                .attr('width', 20)
                .attr('height', 20)
                .attr('fill', 'blue');

            legend.append('text')
                .attr('x', 30)
                .attr('y', 45)
                .text('No')
                .style('font-size', '14px');
        },
        handleBarClick(barData: CategoricalBar) {
            // Implement your logic here, for example:
            alert(`Category: ${barData.category}, Value: ${barData.value}`);
        }
    },
    watch: {
        rerender(newSize) {
            if (!isEmpty(newSize)) {
                d3.select('#bar-svg').selectAll('*').remove();
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
    <div class="chart-container d-flex" ref="barContainer">
        <svg id="bar-svg" width="1000" height="400">  <!-- Enlarged chart -->
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
