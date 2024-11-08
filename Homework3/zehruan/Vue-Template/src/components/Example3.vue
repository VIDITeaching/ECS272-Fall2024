<script lang="ts">
import * as d3 from 'd3';
import { isEmpty, debounce } from 'lodash';
import { useStore } from '../stores/exampleStore'; // Import the store

interface MentalHealthEntry {
    cgpa: string | null;
    depression: string;
    anxiety: string;
    panicAttack: string;
}

export default {
    data() {
        return {
            fullData: [] as MentalHealthEntry[], // Store the full data
            pieData: [] as any[], // Store the aggregated data
            size: { width: 0, height: 0 }, // SVG size
            margin: { left: 50, right: 50, top: 0, bottom: 100 }, // Increased top margin
            // Remove `selectedMentalState` from data
            selectedResponse: 'yes', // Default response ('yes' or 'no')
            debouncedOnResize: null as any, // For debounced resize
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
            return !isEmpty(this.pieData) && this.size.width > 0 && this.size.height > 0;
        },
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
            try {
                const data = await d3.csv('../../data/Student Mental health.csv', (d: any) => {
                    const standardizeResponse = (response: string) => response?.trim().toLowerCase() ?? '';
                    return {
                        cgpa: d['What is your CGPA?'] ? d['What is your CGPA?'].trim() : null,
                        depression: standardizeResponse(d['Do you have Depression?']),
                        anxiety: standardizeResponse(d['Do you have Anxiety?']),
                        panicAttack: standardizeResponse(d['Do you have Panic attack?']),
                    } as MentalHealthEntry;
                });

                // Filter out entries with null CGPA
                this.fullData = data.filter((d) => d.cgpa !== null) as MentalHealthEntry[];
                this.updatePieData();
            } catch (error) {
                console.error('Error loading data:', error);
            }
        },
        updatePieData() {
            // Filter data based on selected mental state and response
            const filteredData = this.fullData.filter(
                (d) => d[this.selectedMentalState] === this.selectedResponse
            );

            if (filteredData.length === 0) {
                this.pieData = [];
                return;
            }

            // Group the filtered data by CGPA ranges and count occurrences
            const groupedData = d3.rollup(
                filteredData,
                (v) => v.length,
                (d) => d.cgpa
            );

            // Format the data for the pie chart
            this.pieData = Array.from(groupedData, ([cgpa, count]) => ({
                cgpa: cgpa,
                count: count,
            }));

            // Sort the data for consistent color mapping
            this.pieData.sort((a, b) => a.cgpa.localeCompare(b.cgpa));

            // Define a categorical color scale based on CGPA ranges
            const cgpaRanges = this.pieData.map((d) => d.cgpa);
            const colorScale = d3.scaleOrdinal()
                .domain(cgpaRanges)
                .range(d3.schemeBlues[cgpaRanges.length] || d3.schemeCategory10);

            // Apply color to each pie slice based on CGPA range
            this.pieData.forEach((d) => {
                d.color = colorScale(d.cgpa);
            });
        },
        initChart() {
            if (this.pieData.length === 0) {
                // Handle case when there is no data to display
                d3.select('#pie-svg').selectAll('*').remove();
                // Optionally, display a message to the user
                const svg = d3.select('#pie-svg')
                    .attr('width', this.size.width)
                    .attr('height', this.size.height);
                svg.append('text')
                    .attr('class', 'no-data')
                    .attr('x', this.size.width / 2)
                    .attr('y', this.size.height / 2)
                    .attr('text-anchor', 'middle')
                    .style('font-size', '16px')
                    .text('No data available for the selected condition.');
                return;
            }

            const { width, height } = this.size;
            const radius = Math.min(width, height) / 2 - 50; // Adjust radius based on size

            // Select the SVG element and set its dimensions
            const svg = d3.select('#pie-svg')
                .attr('width', width)
                .attr('height', height);

            // Remove any existing message
            svg.selectAll('text.no-data').remove();

            // Create or select the chart group
            let chartGroup = svg.select('g.chart-group');
            if (chartGroup.empty()) {
                chartGroup = svg.append('g')
                    .attr('class', 'chart-group')
                    .attr('transform', `translate(${width / 2 - 50}, ${(height / 2) + (this.margin.top / 2)})`);
            } else {
                // Update the chart group's transform in case of resize
                chartGroup.attr('transform', `translate(${width / 2 - 50}, ${(height / 2) + (this.margin.top / 2)})`);
            }

            // Define the pie layout
            const pie = d3.pie<any>()
                .value((d: any) => d.count > 0 ? d.count : 0.01) // Assign minimal value to zero-value slices
                .sort(null);

            const arc = d3.arc<any>()
                .innerRadius(0)
                .outerRadius(radius);

            // Bind data to the slices
            const data_ready = pie(this.pieData);

            // Select existing slices and bind new data
            const slices = chartGroup.selectAll('path.slice')
                .data(data_ready, (d: any) => d.data.cgpa);

            // Handle exit selection (remove old slices)
            slices.exit()
                .transition()
                .duration(500)
                .attrTween('d', function(d) {
                    const interpolator = d3.interpolate(this._current, { startAngle: d.startAngle, endAngle: d.startAngle });
                    this._current = interpolator(0);
                    return (t) => arc(interpolator(t));
                })
                .remove();

            // Handle update selection (update existing slices)
            slices.transition()
                .duration(500)
                .attrTween('d', function(d) {
                    const interpolator = d3.interpolate(this._current, d);
                    this._current = interpolator(0);
                    return (t) => arc(interpolator(t));
                })
                .attr('fill', (d: any) => d.data.count > 0 ? d.data.color : '#ccc');

            // Handle enter selection (create new slices)
            slices.enter()
                .append('path')
                .attr('class', 'slice')
                .attr('fill', (d: any) => d.data.count > 0 ? d.data.color : '#ccc')
                .attr('stroke', 'white')
                .style('stroke-width', '1px')
                .each(function(d) { 
                    this._current = { startAngle: d.startAngle, endAngle: d.startAngle }; 
                })
                .transition()
                .duration(500)
                .attrTween('d', function(d) {
                    const interpolator = d3.interpolate(this._current, d);
                    this._current = interpolator(0);
                    return (t) => arc(interpolator(t));
                });

            // ** Labels Removed **

            // Add Legend
            const legendRectSize = 18;
            const legendSpacing = 4;

            // Remove any existing legend
            svg.selectAll('.legend').remove();

            // Create legend group
            const legend = svg.selectAll('.legend')
                .data(this.pieData)
                .enter()
                .append('g')
                .attr('class', 'legend')
                .attr('transform', (d, i) => {
                    // Adjust the legend position
                    const legendHeight = legendRectSize + legendSpacing;
                    const offset = legendHeight * this.pieData.length / 2;
                    const horz = width / 2 + radius + 20; // Position to the right of the pie
                    const vert = (i * legendHeight) + (height / 2 - offset);
                    return `translate(${horz}, ${vert})`;
                });

            // Append colored rectangles to the legend
            legend.append('rect')
                .attr('width', legendRectSize)
                .attr('height', legendRectSize)
                .style('fill', d => d.color)
                .style('stroke', d => d.color);

            // Append text labels to the legend
            legend.append('text')
                .attr('x', legendRectSize + legendSpacing)
                .attr('y', legendRectSize - legendSpacing)
                .text(d => `CGPA: ${d.cgpa} (${d.count})`)
                .style('font-size', '12px')
                .attr('fill', '#000'); // Optional: Set text color
        }
    },
    watch: {
        rerender(newVal) {
            if (newVal) {
                this.initChart();
            }
        },
        selectedMentalState() {
            // Update the data when the selected mental state changes
            this.updatePieData();
        },
        selectedResponse() {
            // Update the data when the selected response changes
            this.updatePieData();
        },
        pieData() {
            // Redraw the chart whenever pieData changes
            this.initChart();
        },
    },
    mounted() {
        // Debounced resize event listener
        this.debouncedOnResize = debounce(this.onResize, 100);
        window.addEventListener('resize', this.debouncedOnResize);
        this.onResize();
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.debouncedOnResize);
    },
};
</script>


<template>
    <div>
        <!-- Mental State Switch -->
        <div class="control-panel">
            <div class="control-item">
                <label>Select Mental State:</label>
                <select v-model="selectedMentalState">
                    <option value="depression">Depression</option>
                    <option value="anxiety">Anxiety</option>
                    <option value="panicAttack">Panic Attack</option>
                </select>
            </div>
            <div class="control-item">
                <label>Select Response:</label>
                <select v-model="selectedResponse">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                </select>
            </div>
        </div>
        <!-- Chart Container -->
        <div class="chart-container d-flex" ref="pieContainer">
            <svg id="pie-svg" width="200" height="300">
                <!-- The chart will be inserted here -->
            </svg>
        </div>
    </div>
    <div id="tooltip" class="tooltip"></div>
</template>

<style scoped>
.chart-container {
    width: 170%;
}

.control-panel {
    margin-bottom: 10px;
    display: flex;
    gap: 20px;
}

.control-item {
    display: flex;
    align-items: center;
}

.control-item label {
    margin-right: 5px;
}

svg {
    width: 100%;
}

.tooltip {
    position: absolute;
    display: none;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid #ccc;
    padding: 5px;
    pointer-events: none;
    font-size: 12px;
    z-index: 10;
}
</style>



