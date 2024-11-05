<script lang="ts">
import * as d3 from "d3";
import { isEmpty, debounce } from 'lodash';

import { Bar, ComponentSize, Margin } from '../types';
interface CategoricalBar extends Bar{
    category: string;
}

export default {
    data() {
        return {
            mergedData: [] as d3.DSVRowString<string>[],      // Merged data
            size: { width: 0, height: 0 } as ComponentSize,
            margin: {left: 50, right: 20, top: 20, bottom: 80} as Margin,
        }
    },
    created() {
        this.loadAndMergeData();
    },
    methods: {
        onResize() {
            const target = this.$refs.barContainer as HTMLElement;
            if (target) {
                this.size = { width: target.clientWidth+30, height: target.clientHeight };
            }
        },
        async loadAndMergeData() {
            try {
                const matData = await d3.csv('data/student-mat.csv');
                const porData = await d3.csv('data/student-por.csv');
                
                const commonKeys = ['school', 'sex', 'age', 'address', 'famsize', 'Pstatus', 'Medu', 'Fedu', 'Mjob', 'Fjob', 'reason', 'nursery','internet'];

                const combinedData = matData.map(student => {
                    const correspondingPorStudent = porData.find(porStudent =>
                        commonKeys.every(key => student[key] === porStudent[key])
                    );

                    // If a match is found, merge the data
                    return correspondingPorStudent ? { ...student, ...correspondingPorStudent }: null;
                });
                this.mergedData = combinedData.filter(student => student !== null);

                this.initChart();
            } catch (error) {
                console.error("Error loading or merging data:", error);
            }
        },
        initChart() {
            let chartContainer = d3.select("#bar-svg");

            const dalcCounts = Array(5).fill(0);
            const walcCounts = Array(5).fill(0);

            // Count the occurrences of each Dalc and Walc value
            this.mergedData.forEach(student => {
                if (parseInt(student.Dalc) > 0 && parseInt(student.Dalc) <= 5) {
                    dalcCounts[parseInt(student.Dalc) - 1]++; 
                }
                if (parseInt(student.Walc) > 0 && parseInt(student.Walc) <= 5) {
                    walcCounts[parseInt(student.Walc) - 1]++; 
                }
            });
            const xCategories = ['1', '2', '3', '4', '5'];
            const barWidth = 40; 
            const gapBetweenBars = 10; 

            let xScale = d3.scaleBand()
                .rangeRound([this.margin.left, this.size.width - this.margin.right])
                .domain(xCategories)
                .padding(0.1) // spacing between the categories


            let yScale = d3.scaleLinear()
                .range([this.size.height - this.margin.bottom, this.margin.top]) 
                .domain([0, d3.max([...dalcCounts, ...walcCounts])]) 

            const xAxis = chartContainer.append('g')
                .attr('transform', `translate(0, ${this.size.height - this.margin.bottom})`)
                .call(d3.axisBottom(xScale))

            const yAxis = chartContainer.append('g')
                .attr('transform', `translate(${this.margin.left}, 0)`)
                .call(d3.axisLeft(yScale))

            const yLabel = chartContainer.append('g')
                .attr('transform', `translate(${this.margin.left / 2 - 10}, ${this.size.height / 2}) rotate(-90)`)
                .append('text')
                .text('Number of Students')


            const xLabel = chartContainer.append('g')
                .attr('transform', `translate(${this.size.width / 2 - this.margin.left-40}, ${this.size.height - this.margin.top -20})`)
                .append('text')
                .text('Alcohol Consumption Levels (1 to 5)')
            
            const dalcbars = chartContainer.selectAll('.dalc-bar')
                .data(xCategories)
                .join('rect')
                .attr("class", "dalc-bar")
                .attr("x", d => (xScale(d) || 0) + barWidth*1/4)
                .attr("y", (d, i) => yScale(dalcCounts[i]))
                .attr("width", barWidth)
                .attr("height", (d, i) => this.size.height - this.margin.bottom - yScale(dalcCounts[i]))
                .attr('fill', 'teal')
                .attr('transform', `translate(${gapBetweenBars}, 0)`);

            const dalcbarText=chartContainer.selectAll('.dalc-text')
                .data(xCategories)
                .join('text')
                .attr('class', 'dalc-text')
                .attr('x', (d, i) => (xScale(d)||0)+ barWidth) 
                .attr('y', (d, i) => yScale(dalcCounts[i]) - 5) 
                .attr('text-anchor', 'middle')
                .text((d, i) => dalcCounts[i]) 
                .style('font-size', '12px')
                .style('fill', 'black'); 

            const walcbars= chartContainer.selectAll('.walc-bar')
                .data(xCategories)
                .join('rect')
                .attr("class", "walc-bar")
                .attr("x", d => (xScale(d) || 0) + barWidth*1.25 + gapBetweenBars) 
                .attr("y", (d, i) => yScale(walcCounts[i]))
                .attr("width", barWidth)
                .attr("height", (d, i) => this.size.height - this.margin.bottom - yScale(walcCounts[i]))
                .attr('fill', 'orange');

            const walcbarText=chartContainer.selectAll('.walc-text')
                .data(xCategories)
                .join('text')
                .attr('class', 'walc-text')
                .attr('x', (d, i) => (xScale(d) || 0) + barWidth*1.75 + gapBetweenBars) 
                .attr('y', (d, i) => yScale(walcCounts[i]) - 5) 
                .attr('text-anchor', 'middle') 
                .text((d, i) => walcCounts[i]) 
                .style('font-size', '12px')
                .style('fill', 'black'); 

            const title = chartContainer.append('g')
                .append('text') 
                .attr('transform', `translate(${this.size.width / 2}, ${this.size.height - this.margin.top + 5})`)
                .style('text-anchor', 'middle')
                .style('font-weight', 'bold')
                .text('Alcohol consumption during workday and weekend') 
            
            const indicatorGroup = chartContainer.append('g').attr('class', 'indicators');

            indicatorGroup.append('rect')
                .attr('x', this.size.width - this.margin.right - 130) 
                .attr('y', this.margin.top)
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', 'teal');

            indicatorGroup.append('text')
                .attr('x', this.size.width - this.margin.right - 110)
                .attr('y', this.margin.top + 12) 
                .text('workday consumption')
                .style('font-size', '12px')
                .style('fill', 'black');

            indicatorGroup.append('rect')
                .attr('x', this.size.width - this.margin.right - 130)
                .attr('y', this.margin.top + 30) 
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', 'orange');

            indicatorGroup.append('text')
                .attr('x', this.size.width - this.margin.right - 110) 
                .attr('y', this.margin.top + 42)
                .text('weekend consumption')
                .style('font-size', '12px')
                .style('fill', 'black');
        }
    },
    watch: {
        rerender(newSize) {
            if (!isEmpty(newSize)) {
                d3.select('#bar-svg').selectAll('*').remove() // Clean all the elements in the chart
                this.initChart()
            }
        }
    },
    // The following are general setup for resize events.
    mounted() {
        window.addEventListener('resize', debounce(this.onResize, 100)) 
        this.onResize()
    },
    beforeDestroy() {
       window.removeEventListener('resize', this.onResize)
    }
}

</script>


<template>
    <div class="chart-container d-flex" ref="barContainer">
        <svg id="bar-svg" width="100%" height="100%">
        </svg>
    </div>
</template>

<style scoped>
.chart-container{
    height: 1400px;
    width: 120%;
}
</style>

