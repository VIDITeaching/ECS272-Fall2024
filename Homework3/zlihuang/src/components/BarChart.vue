<script lang="ts">
import * as d3 from "d3";
import { isEmpty, debounce } from 'lodash';

import { Bar, ComponentSize, Margin } from '../types';

export default {
    data() {
        return {
            mergedData: [] as d3.DSVRowString<string>[],    
            size: { width: 0, height: 0 } as ComponentSize,
            margin: {left: 50, right: 20, top: 40, bottom: 80} as Margin,
        }
    },
    created() {
        this.loadAndMergeData();
        window.addEventListener('resize', debounce(this.onResize, 100));
    },
    destroyed() {
        window.removeEventListener('resize', this.onResize);
    },
    methods: {
        onResize() {
            const target = this.$refs.barContainer as HTMLElement;
            if (target) {
                this.size = { width: target.clientWidth * 0.8, height: target.clientHeight * 0.6 };
            }
            d3.select('#bar-svg').selectAll('*').remove(); 
            this.initChart(); 
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
            const barWidth = (this.size.width - this.margin.left - this.margin.right) / (2 * xCategories.length) - 10;

            let xScale = d3.scaleBand()
                .rangeRound([this.margin.left, this.size.width - this.margin.right])
                .domain(xCategories)
                .padding(0.2) // spacing between the categories


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
                .attr('transform', `translate(${this.size.width / 2 - this.margin.left-40}, ${this.size.height - this.margin.top -10})`)
                .append('text')
                .text('Alcohol Consumption Levels (1 to 5)')
            
            const tooltip = chartContainer.append("text")
                .attr("class", "tooltip")
                .style("opacity", 0)
                .style("font-size", "12px")
                .style("fill", "black");
            
            const dalcbars = chartContainer.selectAll('.dalc-bar')
                .data(xCategories)
                .join('rect')
                .attr("class", "dalc-bar")
                .attr("x", d => (xScale(d) || 0) )
                .attr("y", (d, i) => yScale(dalcCounts[i]))
                .attr("width", barWidth)
                .attr("height", (d, i) => this.size.height - this.margin.bottom - yScale(dalcCounts[i]))
                .attr('fill', 'teal')
                .on("mouseover", (event, d) => {
                    const index = xCategories.indexOf(d);
                    this.$emit('bar-hover', { type: 'Dalc', level: d });
                    tooltip
                        .attr("x", (xScale(d) || 0) + barWidth / 2)
                        .attr("y", yScale(dalcCounts[index]) - 5)
                        .attr("text-anchor", "middle")
                        .text(dalcCounts[index])
                        .style("opacity", 1);
                })
                .on("mouseout", () => {
                    tooltip.style("opacity", 0);
                    this.$emit('bar-hover', null);
                })
                .transition() 
                .duration(800) 
                .attr("y", (d, i) => yScale(dalcCounts[i]))
                .attr("height", (d, i) => this.size.height - this.margin.bottom - yScale(dalcCounts[i]));

            const walcbars= chartContainer.selectAll('.walc-bar')
                .data(xCategories)
                .join('rect')
                .attr("class", "walc-bar")
                .attr("x", d => (xScale(d) || 0) + barWidth) 
                .attr("y", (d, i) => yScale(walcCounts[i]))
                .attr("width", barWidth)
                .attr("height", (d, i) => this.size.height - this.margin.bottom - yScale(walcCounts[i]))
                .attr('fill', 'orange')
                .on("mouseover", (event, d) => {
                    const index = xCategories.indexOf(d);
                    this.$emit('bar-hover', { type: 'Walc', level: d });
                    tooltip
                        .attr("x", (xScale(d) || 0) + barWidth * 1.5)
                        .attr("y", yScale(walcCounts[index]) - 5)
                        .attr("text-anchor", "middle")
                        .text(walcCounts[index])
                        .style("opacity", 1);
                })
                .on("mouseout", () => {
                    tooltip.style("opacity", 0);
                    this.$emit('bar-hover', null);
                })
                .transition() 
                .duration(800) 
                .attr("y", (d, i) => yScale(walcCounts[i]))
                .attr("height", (d, i) => this.size.height - this.margin.bottom - yScale(walcCounts[i]));

            const title = chartContainer.append('g')
                .append('text') 
                .attr('transform', `translate(${this.size.width / 2}, ${this.size.height - this.margin.top +10})`)
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
                d3.select('#bar-svg').selectAll('*').remove()
                this.initChart()
            }
        }
    },

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
        <svg id="bar-svg" :width="size.width" :height="size.height">
        </svg>
    </div>
</template>

<style scoped>
.chart-container {
    height: 100vh; 
    width: 100vw; 
    max-height: 100%;
    max-width: 100%; 
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    overflow: hidden; 
}
</style>

