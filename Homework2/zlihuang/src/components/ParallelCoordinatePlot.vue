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
            mergedData: [] as d3.DSVRowString<string>[],      // Merged data
            size: { width: 0, height: 0 } as ComponentSize,
            margin: { left: 50, right: 20, top: 30, bottom: 80 } as Margin,
        }
    },
    created() {
        this.loadAndMergeData();
    },
    methods: {
        onResize() {
            const target = this.$refs.chartContainer as HTMLElement;
            if (target) {
                this.size = { width: target.clientWidth, height: target.clientHeight };
            }
        },
        async loadAndMergeData() {
            try {
                const matData = await d3.csv('data/student-mat.csv');
                const porData = await d3.csv('data/student-por.csv');
                
                const commonKeys = ['school', 'sex', 'age', 'address', 'famsize', 'Pstatus', 'Medu', 'Fedu', 'Mjob', 'Fjob', 'reason', 'nursery', 'internet'];

                const combinedData = matData.map(student => {
                    const correspondingPorStudent = porData.find(porStudent =>
                        commonKeys.every(key => student[key] === porStudent[key])
                    );

                    return correspondingPorStudent ? { ...student, ...correspondingPorStudent } : null;
                });
                this.mergedData = combinedData.filter(student => student !== null);
                this.initChart();
            } catch (error) {
                console.error("Error loading or merging data:", error);
            }
        },
        initChart() {
            const dimensions = ['Dalc', 'Walc', 'famrel', 'freetime', 'goout', 'G3'];
            const chartContainer = d3.select('#parallel-svg');

            chartContainer.selectAll('*').remove();

            const xScale = d3.scalePoint()
                .range([this.margin.left, this.size.width - this.margin.right])
                .domain(dimensions);

            const yScales: Record<string, d3.ScaleLinear<number, number>> = {};
            dimensions.forEach(dimension => {
                yScales[dimension] = d3.scaleLinear()
                .range([this.size.height - this.margin.bottom, this.margin.top])
                .domain(d3.extent(this.mergedData, d => +d[dimension]) as [number, number]);
            });

            // Draw axes for each dimension
            chartContainer.selectAll('.axis')
                .data(dimensions)
                .enter().append('g')
                .attr('class', 'axis')
                .attr('transform', d => `translate(${xScale(d)},0)`)
                .each((d, i, nodes) => {
                    d3.select(nodes[i]).call(d3.axisLeft(yScales[d]));
                });

            // Draw parallel lines for each student
            chartContainer.selectAll('.line')
                .data(this.mergedData)
                .enter().append('path')
                .attr('d', d => {
                    return d3.line()(
                        dimensions.map(dim => [
                            xScale(dim), // x position based on the dimension
                            yScales[dim](+d[dim]) // y position based on the student's value for that dimension
                        ] as [number, number])
                    );
                })
                .style('fill', 'none')
                .style('stroke', d => d3.interpolateViridis(+d.G3 / 20))
                .style('opacity', 0.5);

            // Add axis labels
            chartContainer.selectAll('.axis-label')
                .data(dimensions)
                .enter().append('text')
                .attr('x', d => xScale(d)!)
                .attr('y', this.margin.top - 10)
                .style('text-anchor', 'middle')
                .text(d => d);
            

            chartContainer.append("text")
                .attr("x", (this.size.width / 2))   // Center the title horizontally
                .attr("y", 400-this.margin.bottom+30)     // Position it above the plot
                .attr("text-anchor", "middle")
                .style("font-size", "16px")         // Adjust font size as needed
                .style("font-weight", "bold")       // Make the title bold
                .text("Multidimensional factor related to alcohol consumption");
            }
    },
    watch: {
        rerender(newSize) {
            if (!isEmpty(newSize)) {
                d3.select('#bar-svg').selectAll('*').remove(); // Clean all the elements in the chart
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
        <svg id="parallel-svg" width="100%" height="100%">
        </svg>
    </div>
</template>

<style scoped>
.chart-container {
    height: 400px;
}
</style>
