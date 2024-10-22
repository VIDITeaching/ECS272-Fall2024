<script lang="ts">
import * as d3 from "d3";
import { debounce, isEmpty } from 'lodash';

interface CarData {
  make: string;
  odometer: number;
  sellingprice: number;
  year: number;
  age: number;
}

export default {
  data() {
    return {
      cars: [] as CarData[], // Store the car data
      size: { width: 0, height: 0 }, // Chart size
      margin: { left: 70, right: 150, top: 70, bottom: 70 }, // Adjusted margin for legend
      currentYear: 2024, // Updated current year (2024)
      features: ["Odometer", "Selling Price", "Car Age"], // Features to be compared
      topManufacturers: 5, // Limit to top 5 manufacturers
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
      // Preprocess the data
      const processedData = data
        .filter(d => +d.odometer && +d.sellingprice && +d.year) // Filter out invalid rows
        .map(d => ({
          make: d.make,
          odometer: +d.odometer,
          sellingprice: +d.sellingprice,
          year: +d.year,
          age: this.currentYear - +d.year  // Calculate car age
        }));

      // Find the top manufacturers by count of cars
      const topMakes = d3.rollups(
        processedData,
        v => v.length,
        d => d.make
      )
        .sort((a, b) => b[1] - a[1])  // Sort by count
        .slice(0, this.topManufacturers)  // Take top 10 manufacturers
        .map(d => d[0]);  // Extract just the make names

      // Filter data to include only cars from the top 10 manufacturers
      this.cars = processedData.filter(d => topMakes.includes(d.make));
      
      this.initChart(); // Initialize the chart after loading data
    });
  },
  methods: {
    onResize() {
      // Handle window resize
      const container = this.$refs.parallelContainer as HTMLElement;
      this.size.width = container.clientWidth;
      this.size.height = container.clientHeight;
    },
    initChart() {
      const svg = d3.select("#parallel-svg")
        .attr("viewBox", `0 0 ${this.size.width} ${this.size.height}`)  // Set responsive scaling with viewBox
        .attr("width", "100%")
        .attr("height", "100%");

      const chartContainer = svg.append('g')
        .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

      const width = this.size.width - this.margin.left - this.margin.right;
      const height = this.size.height - this.margin.top - this.margin.bottom;

      // Define scales for each feature
      const scales = {
        Odometer: d3.scaleLinear().domain([0, d3.max(this.cars, d => d.odometer)!]).range([height, 0]),
        "Selling Price": d3.scaleLinear().domain([0, d3.max(this.cars, d => d.sellingprice)!]).range([height, 0]),
        "Car Age": d3.scaleLinear().domain([0, d3.max(this.cars, d => d.age)!]).range([height, 0]),
      };

      const dimensions = this.features;

      // Axis positions
      const xScale = d3.scalePoint()
        .domain(dimensions)
        .range([0, width])
        .padding(1);

      // Color scale for car manufacturers
      const colorScale = d3.scaleOrdinal()
        .domain([...new Set(this.cars.map(d => d.make))])
        .range(d3.schemeCategory10);

      // Line generator for parallel coordinates
      const line = d3.line()
        .defined((d: any) => d !== null)  // Skip null values
        .y((d: any, i: number) => scales[dimensions[i]](d))
        .x((_, i: number) => xScale(dimensions[i]));

      // Draw the lines
      chartContainer.selectAll("path")
        .data(this.cars)
        .enter()
        .append("path")
        .attr("d", d => line([d.odometer, d.sellingprice, d.age]))
        .attr("stroke", d => colorScale(d.make))
        .attr("stroke-width", 1)
        .attr("fill", "none")
        .attr("opacity", 0.5);

      // Add axes for each feature
      dimensions.forEach(dim => {
        chartContainer.append("g")
          .attr("transform", `translate(${xScale(dim)}, 0)`)
          .call(d3.axisLeft(scales[dim]));

        // Add axis labels
        chartContainer.append("text")
          .attr("x", xScale(dim))
          .attr("y", -10)
          .style("text-anchor", "middle")
          .text(dim);
      });

      // Title
      svg.append('text')
        .attr('x', this.size.width / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', '16px')
        .text('Top 5 Car Manufactuers: How Odometer, Price, and Age correlate');

      // Add Legend for Car Manufacturers
      const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${this.size.width - this.margin.right + 10}, 50)`);

      const manufacturers = [...new Set(this.cars.map(d => d.make))];

      // Draw colored squares for legend
      legend.selectAll('rect')
        .data(manufacturers)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d, i) => i * 20)
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', d => colorScale(d));

      // Add text labels for legend
      legend.selectAll('text')
        .data(manufacturers)
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
        d3.select('#parallel-svg').selectAll('*').remove(); // Clear previous chart elements
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
  <div class="chart-container" ref="parallelContainer" style="width: 100vw; height: 100vh;"> <!-- Full width and height of viewport -->
    <svg id="parallel-svg">
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
