<script lang="ts">
import * as d3 from "d3";
import { debounce, isEmpty } from 'lodash';

import { Bar, ComponentSize, Margin } from '../types';
// A "extends" B means A inherits the properties and methods from B.
interface CategoricalBar extends Bar{
    category: string;
    value: number;
}

export default {
  data() {
    return {
      bars: [] as CategoricalBar[], // Store the bar data (car makes and their counts)
      size: { width: 0, height: 0 }, // Chart size
      margin: { left: 80, right: 40, top: 50, bottom: 130 }, // Adjusted left margin for more space for y-axis label
    };
  },
  computed: {
    // Re-render the chart whenever the window is resized or the data changes (and data is non-empty)
    rerender() {
      return !isEmpty(this.bars) && this.size;
    }
  },
  created() {
    // Load CSV data and process it
    d3.csv('../../data/car_prices.csv').then((data: any[]) => {
      const carMakeCount = d3.rollups(data, v => v.length, d => d.make)
        .map(([make, count]) => ({ category: make, value: count }))
        .sort((a,b) => a.value - b.value);
      this.bars = carMakeCount;
      this.initChart(); // Initialize the chart after loading data
    });
  },
  methods: {
    onResize() {
      // Handle window resize and set container dimensions
      const container = this.$refs.barContainer as HTMLElement;
      this.size.width = container.clientWidth;
      this.size.height = container.clientHeight;
    },
    initChart() {
      const svg = d3.select("#bar-svg")
        .attr("viewBox", `0 0 ${this.size.width} ${this.size.height}`)  // Set responsive scaling with viewBox
        .attr("width", "100%")
        .attr("height", "100%");  // Ensure SVG fills the container fully

      const totalCarMakes = this.bars.length;
      const chartWidth = Math.max(this.size.width, totalCarMakes * 10);  // Reduced width per bar (dynamic scaling)

      // Set the new dynamic width for the SVG to fit all bars
      svg.attr("width", chartWidth);  // Ensure width allows for scrolling

      const chartContainer = svg.append('g')
        .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

      // X Scale (for categories, along the X axis)
      const xScale = d3.scaleBand()
        .domain(this.bars.map(d => d.category))
        .range([0, chartWidth - this.margin.left - this.margin.right])
        .padding(0.1);  // Increase padding to avoid label overlap

      // Y Scale (for values, along the Y axis)
      const yScale = d3.scaleLinear()
        .domain([0, d3.max(this.bars, d => d.value)!])
        .range([this.size.height - this.margin.top - this.margin.bottom, 0]);

      // X Axis (car makes)
      chartContainer.append('g')
        .attr('transform', `translate(0, ${this.size.height - this.margin.top - this.margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-65)')  // Rotated more for better readability
        .style('text-anchor', 'end')  // Ensure text alignment is appropriate
        .style('font-size', '9px');  // Reduced font size for readability and compactness

      // Y Axis (car counts)
      chartContainer.append('g')
        .call(d3.axisLeft(yScale));

      // X-axis label
      svg.append("text")
        .attr("x", (chartWidth - this.margin.left - this.margin.right) / 2 + this.margin.left)
        .attr("y", this.size.height - 50)  // Position below the x-axis
        .attr("text-anchor", "middle")
        .style("font-size", "10px")  // Slightly smaller font for label
        .text("Car Make");

      // Y-axis label
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", this.margin.left / 4)  // Increase this value to move the label further from the y-axis
        .attr("x", - (this.size.height / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "10px")  // Slightly smaller font for label
        .text("Total Number of Cars Sold");

      // Bars
      const bars = chartContainer.selectAll('.bar')
        .data(this.bars)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', (d: CategoricalBar) => xScale(d.category)!)
        .attr('y', (d: CategoricalBar) => yScale(d.value))
        .attr('width', xScale.bandwidth())
        .attr('height', (d: CategoricalBar) => this.size.height - this.margin.top - this.margin.bottom - yScale(d.value))
        .attr('fill', 'teal');

      // Add value labels on top of each bar
      chartContainer.selectAll('.label')
        .data(this.bars)
        .enter()
        .append('text')
        .attr('class', 'label')
        .attr('x', (d: CategoricalBar) => xScale(d.category)! + xScale.bandwidth() / 2) // Centered on each bar
        .attr('y', (d: CategoricalBar) => yScale(d.value) - 5)  // Positioned slightly above the bar
        .attr('text-anchor', 'middle')
        .style('font-size', '5px')  // Font size for labels
        .style('font-weight', 'bold')
        .text((d: CategoricalBar) => d.value.toLocaleString());  // Format the value with commas

      // Title
      svg.append('text')
        .attr('x', (chartWidth - this.margin.left - this.margin.right) / 2 + this.margin.left)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', '16px')  // Smaller title font
        .text('Car Make Distribution by Number of Cars Sold');
    }
  },
  watch: {
    rerender(newSize) {
      if (!isEmpty(newSize)) {
        d3.select('#bar-svg').selectAll('*').remove(); // Clear previous chart elements
        this.initChart();
      }
    }
  },
  mounted() {
    window.addEventListener('resize', debounce(this.onResize, 100));
    this.onResize(); // Initialize size on mount
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
  }
}
</script>

<template>
  <div class="chart-container" ref="barContainer" style="width: 100vw; height: 100vh; overflow-x: auto;"> <!-- Full width and height of viewport with horizontal scrolling -->
    <svg id="bar-svg">
      <!-- Chart elements will be inserted here -->
    </svg>
  </div>
</template>

<style scoped>
.chart-container {
  display: flex;
  width: 100%;
  height: 100%;
  overflow-x: auto; /* Ensure horizontal scrolling is enabled */
  overflow-y: hidden; /* Prevent vertical scrolling */
}
</style>
