<template>
  <div class="chart-container" ref="pieContainer" style="width: 100vw; height: 100vh;">
    <!-- Container for dropdown and label -->
    <div class="dropdown-container">
      <p>Select a State:</p> <!-- Text above the dropdown -->
      <select v-model="selectedState" @change="updatePieChart">
        <option v-for="state in states" :key="state" :value="state">{{ state }}</option>
      </select>
    </div>

    <svg id="pie-svg">
      <!-- Chart elements will be inserted here -->
    </svg>
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
}

.dropdown-container p {
  margin: 0 0 5px 0;
  font-weight: bold;
}

select {
  background-color: #d3d3d3;  /* Light gray background */
  border: 1px solid #ccc;  /* Optional border to define the edges */
  padding: 5px 10px;  /* Padding inside the dropdown */
  font-size: 14px;  /* Optional, adjust font size */
  border-radius: 4px;  /* Optional, rounded corners */
}
</style>

<script lang="ts">
import * as d3 from "d3";
import { debounce, isEmpty } from 'lodash';

interface PieSegment {
  label: string;
  value: number;
}

export default {
  data() {
    return {
      segments: [] as PieSegment[], // Store the pie data (car body type and their counts)
      size: { width: 0, height: 0 }, // Chart size
      margin: { left: 50, right: 50, top: 50, bottom: 50 }, // Adjust margins for better spacing
      selectedState: 'ca', // Default selected state
      states: [
        "ca", "tx", "pa", "mn", "az", "wi", "tn", "md", "fl", "ne", 
        "nj", "nv", "oh", "mi", "ga", "va", "sc", "nc", "in", "il", 
        "co", "ut", "mo", "ny", "ma", "pr", "or", "la", "wa", "hi", 
        "qc", "ab", "on", "ok", "ms", "nm", "al", "ns"
      ],
      carDataByState: {} // Object to store data grouped by state
    };
  },
  computed: {
    rerender() {
      return !isEmpty(this.segments) && this.size;
    }
  },
  created() {
    // Load and process CSV data
    d3.csv('../../data/car_prices.csv').then((data: any[]) => {
      // Normalize body type names
      const normalizeBodyType = (body: string) => {
        body = body.toLowerCase();
        if (body.includes('sedan')) return 'Sedan';
        if (body.includes('suv')) return 'SUV';
        if (body.includes('truck')) return 'Truck';
        if (body.includes('coupe')) return 'Coupe';
        if (body.includes('convertible')) return 'Convertible';
        return body.charAt(0).toUpperCase() + body.slice(1); // Capitalize other names
      };

      // Group data by state and car body type
      const groupByState = d3.rollups(
        data.filter(d => d.body && d.body.trim() !== ""), // Exclude entries without a body type
        v => d3.rollups(v, count => count.length, d => normalizeBodyType(d.body)),
        d => d.state // Grouping by state
      );

      // Convert to a dictionary for easy lookup
      groupByState.forEach(([state, bodyTypes]) => {
        this.carDataByState[state] = bodyTypes.map(([bodyType, count]) => ({ label: bodyType, value: count }));
      });

      // Initial load of pie chart for the default state (CA)
      this.updatePieChart();
    });
  },
  methods: {
    onResize() {
      const container = this.$refs.pieContainer as HTMLElement;
      this.size.width = container.clientWidth;
      this.size.height = container.clientHeight;
    },
    updatePieChart() {
      // Clear the previous chart before updating
      d3.select('#pie-svg').selectAll('*').remove(); // Clear all chart elements

      // Get the data for the selected state
      const data = this.carDataByState[this.selectedState];

      // Calculate the total count of cars for percentage calculation
      const totalCount = d3.sum(data, d => d.value);

      // Sort body types by value (descending) and take the top 8
      const topBodyTypes = data
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

      // Calculate the "Other" category value
      const otherValue = data
        .slice(8) // Take everything after the top 8
        .reduce((sum, d) => sum + d.value, 0);

      // If "Other" exists, add it to the segments
      const segments = topBodyTypes.map(d => ({
        label: `${d.label} (${((d.value / totalCount) * 100).toFixed(1)}%)`, 
        value: d.value
      }));

      if (otherValue > 0) {
        segments.push({
          label: `Other (${((otherValue / totalCount) * 100).toFixed(1)}%)`,
          value: otherValue
        });
      }

      // Set the segments for the pie chart
      this.segments = segments;

      // Re-render the pie chart with the new data
      this.initChart();
    },
    initChart() {
      // Decrease the radius by 20% to make the chart smaller
      const radius = (Math.min(this.size.width, this.size.height) / 2 - Math.max(this.margin.left, this.margin.right)) * 0.8;

      const svg = d3.select("#pie-svg")
        .attr("viewBox", `0 0 ${this.size.width} ${this.size.height}`)
        .attr("width", "100%")
        .attr("height", "100%");

      const chartContainer = svg.append('g')
        .attr('transform', `translate(${this.size.width / 2}, ${this.size.height / 2})`);

      const pie = d3.pie<PieSegment>()
        .value(d => d.value)
        .sort(null);

      const arc = d3.arc<d3.PieArcDatum<PieSegment>>()
        .innerRadius(0)
        .outerRadius(radius);

      const color = d3.scaleOrdinal(d3.schemeCategory10);

      // Pie slices
      chartContainer.selectAll('path')
        .data(pie(this.segments))
        .enter()
        .append('path')
        .attr('d', arc as any)  // Define the arc
        .attr('fill', (d, i) => color(i.toString()) as string)  // Assign colors
        .attr('stroke', 'white')
        .style('stroke-width', '2px');

      // Add percentage labels slightly away from the center of each pie slice
      chartContainer.selectAll('text')
        .data(pie(this.segments))
        .enter()
        .append('text')
        .attr('transform', d => {
          // Calculate the centroid and adjust it outward by multiplying with a factor (e.g., 1.4)
          const [x, y] = arc.centroid(d);
          const offsetFactor = 1.4; // Adjust this factor to control the distance from the center
          return `translate(${x * offsetFactor}, ${y * offsetFactor})`;
        })
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', 'white')
        .text(d => {
          return `${d.data.label}`;
        });

      // Title
      svg.append('text')
        .attr('x', this.size.width / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', '16px')
        .text(`Car Body Type Distribution in ${this.selectedState}`);

      // Legend
      const legend = svg.append('g')
        .attr('transform', `translate(${this.size.width - this.margin.right - 450}, ${this.margin.top})`);

      this.segments.forEach((segment, i) => {
        const legendRow = legend.append('g')
          .attr('transform', `translate(0, ${i * 20})`);

        legendRow.append('rect')
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', color(i.toString()));

        legendRow.append('text')
          .attr('x', 20)
          .attr('y', 10)
          .attr('text-anchor', 'start')
          .style('font-size', '12px')
          .text(segment.label);
      });
    }},
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
};
</script>