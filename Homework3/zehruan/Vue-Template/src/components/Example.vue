

<script lang="ts">
import * as d3 from "d3";
import axios from 'axios';
import { isEmpty, debounce } from 'lodash';

import { Bar, ComponentSize, Margin } from '../types';
import { useStore } from '../stores/exampleStore'; // Import the store here
import { defineComponent, computed } from 'vue'; 

interface MentalStateData {
    mentalState: string;
    have: number;
    dontHave: number;
}

export default defineComponent({
    setup() {
        const store = useStore(); // Initialize the store
        const count = computed(() => store.count);
        return {
            store, // Return the store to access it in methods and template
            count,
            increment: store.increment,
        };
    },
    data() {
        return {
            bars: [] as MentalStateData[],
            size: { width: 0, height: 0 } as ComponentSize,
            margin: { left: 50, right: 150, top: 20, bottom: 50 } as Margin, // Increased right margin
            selectedMentalState: null as string | null, // Add this line
        };
    },
    computed: {
        rerender() {
            return (!isEmpty(this.bars)) && this.size;
        },
    },
    created() {
        // Reading the Student Mental health data
        this.read();
    },
    methods: {
        updateBarOpacity() {
            let bars = d3.select('#bar-svg').selectAll('.bar-group rect');
            bars.style('opacity', (d: MentalStateData) => {
                if (this.selectedMentalState === null) {
                    return 1;
                } else if (d.mentalState === this.selectedMentalState) {
                    return 1;
                } else {
                    return 0.5; // Adjust opacity as desired
                }
            });
        },
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

            const mentalStates = ["Depression", "Anxiety", "Panic Attack"];
            const dataKeys = {
                'Depression': 'depression',
                'Anxiety': 'anxiety',
                'Panic Attack': 'panicAttack'
            };

            let counts: { [key: string]: { have: number, dontHave: number } } = {};
            mentalStates.forEach(ms => {
                counts[ms] = { have: 0, dontHave: 0 };
            });

            readFromCSV.forEach((d) => {
                mentalStates.forEach(ms => {
                    let key = dataKeys[ms];
                    if (d[key] === 'Yes') {
                        counts[ms].have++;
                    } else {
                        counts[ms].dontHave++;
                    }
                });
            });

            this.bars = mentalStates.map(ms => {
                return {
                    mentalState: ms,
                    have: counts[ms].have,
                    dontHave: counts[ms].dontHave
                };
            });
        },
        initChart() {
            let chartContainer = d3.select('#bar-svg');

            const mentalStates = ["Depression", "Anxiety", "Panic Attack"];

            let xScale = d3.scaleBand()
                .rangeRound([this.margin.left, this.size.width - this.margin.right])
                .domain(mentalStates)
                .padding(0.3);

            let yMax = d3.max(this.bars.map(d => Math.max(d.have, d.dontHave))) as number;

            let yScale = d3.scaleLinear()
                .range([this.size.height - this.margin.bottom, this.margin.top])
                .domain([0, yMax]);

            chartContainer.append('g')
                .attr('transform', `translate(0, ${this.size.height - this.margin.bottom})`)
                .call(d3.axisBottom(xScale));

            // Add x-axis label
            chartContainer.append('text')
                .attr('transform', `translate(${this.size.width / 2}, ${this.size.height - this.margin.top + 20})`) // Adjust for bottom spacing
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

            // Create groups for each mental state
            let barGroups = chartContainer.append('g')
                .selectAll('.bar-group')
                .data(this.bars)
                .enter()
                .append('g')
                .attr('class', 'bar-group')
                .attr('transform', (d: MentalStateData) => `translate(${xScale(d.mentalState)}, 0)`);

            // Add the 'Don't Have' bars (back bars)
            barGroups.append('rect')
                .attr('x', 0)
                .attr('y', (d: MentalStateData) => yScale(d.dontHave))
                .attr('width', xScale.bandwidth())
                .attr('height', (d: MentalStateData) => yScale(0) - yScale(d.dontHave))
                .attr('fill', '#ff7f0e') // Color for 'Don't Have'
                .on('click', (event, d: MentalStateData) => {
                    this.handleBarClick(d);
                });

            // Add the 'Have' bars (front bars)
            let haveBarWidth = xScale.bandwidth() * 0.8;

            barGroups.append('rect')
                .attr('x', (xScale.bandwidth() - haveBarWidth) / 2)
                .attr('y', (d: MentalStateData) => yScale(d.have))
                .attr('width', haveBarWidth)
                .attr('height', (d: MentalStateData) => yScale(0) - yScale(d.have))
                .attr('fill', '#1f77b4') // Color for 'Have'
                .on('click', (event, d: MentalStateData) => {
                    this.handleBarClick(d);
                });

            // Add text labels for 'Have' bars
            barGroups.append('text')
                .attr('x', xScale.bandwidth() / 2)
                .attr('y', (d: MentalStateData) => yScale(d.have) - 5)
                .attr('text-anchor', 'middle')
                .style('font-size', '0.8rem')
                .style('fill', 'black')
                .text((d: MentalStateData) => d.have);

            // Add text labels for 'Don't Have' bars
            barGroups.append('text')
                .attr('x', xScale.bandwidth() / 2)
                .attr('y', (d: MentalStateData) => yScale(d.dontHave) - 5)
                .attr('text-anchor', 'middle')
                .style('font-size', '0.8rem')
                .style('fill', 'black')
                .text((d: MentalStateData) => d.dontHave);

            // Add legend for color explanation
            let legend = chartContainer.append('g')
                .attr('transform', `translate(${this.size.width - this.margin.right + 20}, ${this.margin.top})`);


            legend.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', 20)
                .attr('height', 20)
                .attr('fill', '#1f77b4');

            legend.append('text')
                .attr('x', 30)
                .attr('y', 15)
                .text('Have')
                .style('font-size', '14px');

            legend.append('rect')
                .attr('x', 0)
                .attr('y', 30)
                .attr('width', 20)
                .attr('height', 20)
                .attr('fill', '#ff7f0e');

            legend.append('text')
                .attr('x', 30)
                .attr('y', 45)
                .text("Don't Have")
                .style('font-size', '14px');
        },
        handleBarClick(barData: MentalStateData) {
            // Toggle selection
            if (this.selectedMentalState === barData.mentalState) {
                this.selectedMentalState = null; // Unselect if already selected
            } else {
                this.selectedMentalState = barData.mentalState;
            }

            // Map the mental state to match the expected format in your data
            const mentalStateMapping: { [key: string]: string } = {
                Depression: 'depression',
                Anxiety: 'anxiety',
                'Panic Attack': 'panicAttack',
            };
            const mappedMentalState = mentalStateMapping[barData.mentalState];

            // Update the reactive store variable
            this.store.myGlobalVariable = mappedMentalState;
        },

    },
    watch: {
        selectedMentalState(newVal, oldVal) {
            this.updateBarOpacity();
        },
        rerender(newSize) {
            if (!isEmpty(newSize)) {
                d3.select('#bar-svg').selectAll('*').remove();
                this.initChart();
            }
        },
    },

    mounted() {
        window.addEventListener('resize', debounce(this.onResize, 100));
        this.onResize();
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.onResize);
    },
});
</script>


<template>
    <div class="chart-container d-flex" ref="barContainer">
        <svg id="bar-svg" width="600" height="600">  <!-- Enlarged chart -->
            <!-- The chart will be inserted here -->
        </svg>
    </div>
</template>

<style scoped>
.chart-container {
    width: 100%;
}
</style>
