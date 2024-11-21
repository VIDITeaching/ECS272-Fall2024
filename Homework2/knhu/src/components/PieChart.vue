<script lang="ts">
import * as d3 from "d3";
import { debounce, isEmpty } from 'lodash';

interface CarData {
  body: string;
  count: number;
}

export default {
  data() {
    return {
      cars: [] as CarData[], // Store the car data
      size: { width: 0, height: 0 }, // Chart size
      margin: { left: 20, right: 250, top: 50, bottom: 50 }, // Adjusted margin for legend
      topBodyStyles: 10, // Number of top body styles to display
    };
  },
  computed: {
    // Re-render the chart whenever the window is resized or the data changes
    rerender() {
      return (!isEmpty(this.cars)) && this.size;
    }
  },
  created() {
    // Load CSV data and process it
    d3.csv('../../data/car_prices.csv').then((data: any[]) => {
      // Preprocess the data, normalize to lowercase for consistent labeling
      const processedData = data
        .filter(d => d.body) // Filter out invalid rows with no body style
        .map(d => ({
          body: d.body.toLowerCase() // Normalize to lowercase
        }));

      // Count occurrences of each body style
      const bodyStyleCount = d3.rollups(
        processedData,
        v => v.length,
        d => d.body
      ).sort((a, b) => b[1] - a[1]); // Sort by count in descending order

      // Limit to the top 10 body styles after normalizing and combining duplicates
      const topBodyStyles = bodyStyleCount.slice(0, this.topBodyStyles);

      // Store body style counts in the cars array
      this.cars = topBodyStyles.map(([body, count]) => ({ body, count }));

      this.initChart(); // Initialize the chart after loading data
    });
  },
  methods: {
    onResize() {
      // Handle window resize
      const container = this.$refs.pieContainer as HTMLElement;
      this.size.width = container.clientWidth;
      this.size.height = container.clientHeight;
    },
    initChart() {
      const svg = d3.select("#pie-svg")
        .attr("viewBox", `0 0 ${this.size.width} ${this.size.height}`)  // Set responsive scaling with viewBox
        .attr("width", "100%")
        .attr("height", "100%");

      const chartContainer = svg.append('g')
        .attr("transform", `translate(${this.size.width / 3}, ${this.size.height / 2})`);

      const radius = Math.min(this.size.width, this.size.height) / 2.5 - this.margin.left; // Reduced radius for better label spacing

      // Color scale for body styles
      const colorScale = d3.scaleOrdinal()
        .domain(this.cars.map(d => d.body))
        .range(d3.schemeCategory10);

      // Create the pie layout
      const pie = d3.pie<any>()
        .value(d => d.count)
        .sort(null);

      // Create arc generator
      const arc = d3.arc<any>()
        .outerRadius(radius)
        .innerRadius(0);

      // Create arc generator for labels
      const labelArc = d3.arc<any>()
        .outerRadius(radius - 40) // Move the labels outside of the pie slices
        .innerRadius(radius - 40);

      // Bind data and create pie slices
      const slices = chartContainer.selectAll(".arc")
        .data(pie(this.cars))
        .enter()
        .append("g")
        .attr("class", "arc");

      // Append the pie slices
      slices.append("path")
        .attr("d", arc)
        .attr("fill", d => colorScale(d.data.body));

      // Append percentage labels outside the pie chart
      slices.append("text")
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .style("font-size", "10px") // Adjust font size for readability
        .text(d => `${((d.data.count / d3.sum(this.cars, d => d.count)) * 100).toFixed(1)}%`);

      // Add a title
      svg.append('text')
        .attr('x', this.size.width / 2)
        .attr('y', this.margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', '16px')
        .text('Top 10 Car Body Styles by Percentage (Normalized)');

      // Add legend for car body styles, adjusting for wider spacing
      const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${this.size.width - this.margin.right}, 50)`);

      const bodyStyles = this.cars.map(d => d.body);

      // Draw colored squares for legend
      legend.selectAll('rect')
        .data(bodyStyles)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d, i) => i * 20)
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', d => colorScale(d));

      // Add text labels for legend
      legend.selectAll('text')
        .data(bodyStyles)
        .enter()
        .append('text')
        .attr('x', 25)
        .attr('y', (d, i) => i * 20 + 14)
        .style('font-size', '12px')
        .text(d => d);
    }
  },
  watch: {
    rerender(newSize) {
      if (!isEmpty(newSize)) {
        d3.select('#pie-svg').selectAll('*').remove(); // Clear previous chart elements
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
  <div class="chart-container" ref="pieContainer" style="width: 100vw; height: 100vh;"> <!-- Full width and height of viewport -->
    <svg id="pie-svg">
      <!-- Chart elements will be inserted here -->
    </svg>
  </div>
</template>

<style scoped>
.chart-container {
  display: flex;
  width: 100%;
  height: 100%;
}
</style>
