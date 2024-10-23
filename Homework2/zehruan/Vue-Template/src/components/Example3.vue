<script lang="ts">
import * as d3 from "d3";
import { isEmpty, debounce } from 'lodash';

export default {
    data() {
        return {
            pieData: [] as any[], // Store the aggregated depression data by CGPA
            size: { width: 0, height: 0 }, // SVG size
            margin: { left: 50, right: 20, top: 100, bottom: 100 }, // Increased top margin to provide space for the title
        };
    },
    computed: {
        rerender() {
            return (!isEmpty(this.pieData)) && this.size;
        }
    },
    created() {
        // Load the Student Mental health data on creation
        this.read();
    },
    methods: {
        onResize() {
            let target = this.$refs.pieContainer as HTMLElement;
            if (!target) return;
            this.size = { width: target.clientWidth, height: target.clientHeight };
        },
        async read() {
            // Read the CSV data
            let readFromCSV = await d3.csv('../../data/Student Mental health.csv', (d: any) => {
                return {
                    depression: d['Do you have Depression?'] ?? '',
                    cgpa: d['What is your CGPA?'] ?? ''
                };
            });

            // Filter to keep only students with depression
            let filteredData = readFromCSV.filter(d => d.depression === 'Yes');

            // Group the filtered data by CGPA and count occurrences
            const groupedData = d3.rollup(
                filteredData,
                v => v.length, // Count the number of students in each CGPA group
                d => d.cgpa
            );

            // Format the data for the pie chart
            this.pieData = Array.from(groupedData, ([cgpa, count]) => ({
                category: `CGPA: ${cgpa}`,
                count: count
            }));

            // Define the color scale based on the student count
            const maxCount = d3.max(this.pieData, d => d.count);
            const colorScale = d3.scaleLinear<string>()
                .domain([0, maxCount])
                .range(["lightblue", "darkblue"]); // Lighter for lower counts, darker for higher counts

            // Apply color to each pie slice based on count
            this.pieData.forEach(d => {
                d.color = colorScale(d.count);
            });
        },
        initChart() {
            const chartContainer = d3.select('#pie-svg');

            // Define the pie chart layout
            const pie = d3.pie<any>()
                .value((d: any) => d.count);

            const arc = d3.arc<any>()
                .innerRadius(0)
                .outerRadius(150); // Define the pie size

            const outerArc = d3.arc<any>()
                .innerRadius(180) // Radius for the labels
                .outerRadius(180);

            // Adjust pie group positioning to lower it for space between title and pie
            const pieGroup = chartContainer.append('g')
                .attr('transform', `translate(${this.size.width / 2}, ${(this.size.height / 2) + 50})`); // Adjust position of pie lower

            pieGroup.selectAll('path')
                .data(pie(this.pieData))
                .enter()
                .append('path')
                .attr('d', arc)
                .attr('fill', (d: any) => d.data.color) // Use the dynamically generated color
                .attr('stroke', 'white');

            // Add lines from the arcs to the labels
            pieGroup.selectAll('polyline')
                .data(pie(this.pieData))
                .enter()
                .append('polyline')
                .attr('stroke', 'black')
                .attr('stroke-width', 1)
                .attr('fill', 'none')
                .attr('points', (d: any) => {
                    const posA = arc.centroid(d); // Line start (from slice)
                    const posB = outerArc.centroid(d); // Line end (from label position)
                    return [posA, posB]; // Points for polyline (from slice to outside)
                });

            // Add labels to the pie chart
            pieGroup.selectAll('text')
                .data(pie(this.pieData))
                .enter()
                .append('text')
                .attr('transform', (d: any) => `translate(${outerArc.centroid(d)})`) // Move labels outside the chart
                .attr('text-anchor', (d: any) => d.endAngle > Math.PI ? 'end' : 'start') // Adjust label alignment
                .text((d: any) => `${d.data.category}: ${d.data.count}`)
                .style('font-size', '12px'); // Reduce font size if needed

            // Add a title
            chartContainer.append('text')
                .attr('x', this.size.width / 2)
                .attr('y', this.margin.top / 2) // Position the title slightly above the chart, more space with increased margin
                .attr('text-anchor', 'middle')
                .style('font-size', '18px')
                .style('font-weight', 'bold')
                .text('Distribution of Students with Depression by CGPA');
        }
    },
    watch: {
        rerender(newSize) {
            if (!isEmpty(newSize)) {
                d3.select('#pie-svg').selectAll('*').remove();
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
    <div class="chart-container d-flex" ref="pieContainer">
        <svg id="pie-svg" width="800" height="400"> <!-- Adjust size for pie chart -->
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
