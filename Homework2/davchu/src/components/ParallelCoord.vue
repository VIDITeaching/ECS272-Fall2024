<template>
    <div class="chart-container" ref="parallelContainer" style="width: 100vw; height: 100vh;">
      <svg id="parallel-svg">
        <!-- Parallel coordinates plot will be inserted here -->
      </svg>
    </div>
  </template>
  
  <script lang="ts">
  import * as d3 from "d3";
  import { debounce, isEmpty } from 'lodash';
  
  export default {
    data() {
      return {
        data: [], // Store the CSV data for parallel plot
        dimensions: ['year', 'condition', 'sellingprice'], // Parallel plot dimensions (year, condition, sellingprice)
        size: { width: 0, height: 0 }, // Chart size
        margin: { left: 50, right: 50, top: 50, bottom: 50 }, // Adjust margins for better spacing
      };
    },
    computed: {
      rerender() {
        return !isEmpty(this.data) && this.size;
      }
    },
    created() {
      // Load CSV data and process it
      d3.csv('../../data/car_prices.csv').then((data: any[]) => {
        // Filter out rows with missing or invalid data for year, condition, and sellingprice
        this.data = data.filter(d => 
          d.year && d.condition && d.sellingprice &&
          !isNaN(+d.year) && !isNaN(+d.condition) && !isNaN(+d.sellingprice)
        );
        this.initChart(); // Initialize the parallel coordinates plot after loading data
      });
    },
    methods: {
      onResize() {
        const container = this.$refs.parallelContainer as HTMLElement;
        this.size.width = container.clientWidth;
        this.size.height = container.clientHeight;
      },
      initChart() {
        const svg = d3.select("#parallel-svg")
          .attr("viewBox", `0 0 ${this.size.width} ${this.size.height}`)
          .attr("width", "100%")
          .attr("height", "100%");
  
        const chartWidth = this.size.width - this.margin.left - this.margin.right;
        const chartHeight = this.size.height - this.margin.top - this.margin.bottom;
  
        const chartContainer = svg.append('g')
          .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
  
        // Define the dimensions (year, condition, sellingprice)
        const dimensions = this.dimensions;
  
        // Create a scale for each dimension
        const yScales: any = {};
        dimensions.forEach(dim => {
          // Numerical data uses a linear scale
          yScales[dim] = d3.scaleLinear()
            .domain(d3.extent(this.data, d => +d[dim]) as [number, number])
            .range([chartHeight, 0]);
        });
  
        // X Scale for dimension positions
        const xScale = d3.scalePoint()
          .domain(dimensions)
          .range([0, chartWidth]);
  
        // Define a color scale with distinct colors for the year
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
          .domain([...new Set(this.data.map(d => +d.year))]); // Unique years for the color scale
  
        // Path generator for drawing the lines between axes
        const path = (d) => d3.line()(dimensions.map(p => [xScale(p), yScales[p](d[p])])); 
  
        // Draw the lines for each data point
        chartContainer.selectAll("path")
          .data(this.data)
          .enter()
          .append("path")
          .attr("d", path)
          .style("fill", "none")
          .style("stroke", d => colorScale(+d.year))  // Color by year
          .style("opacity", 0.6);
  
        // Draw axis for each dimension
        dimensions.forEach(dim => {
          chartContainer.append("g")
            .attr("transform", `translate(${xScale(dim)}, 0)`)
            .each(function() { d3.select(this).call(d3.axisLeft(yScales[dim])); })
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(dim)
            .style("fill", "black");
        });
  
        // Add title to the chart
        svg.append("text")
          .attr("x", this.size.width / 2)
          .attr("y", this.margin.top / 2)
          .attr("text-anchor", "middle")
          .style("font-size", "20px")
          .style("font-weight", "bold")
          .text("Parallel Coordinates Plot: Year, Condition, and Selling Price");
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
  
  <style scoped>
  .chart-container {
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
  }
  </style>
  