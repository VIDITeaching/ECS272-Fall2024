<template>
  <div v-if="data" class="invisible-chart-container">
    <h2 class="chart-title">Gender Distribution of High-Risk Clients</h2>
    <div class="pie-chart-box">
      <div ref="pieChart"></div>
      <div class="legend">
        <div class="legend-item">
          <span class="legend-color" style="background-color: #1f77b4;"></span> Male
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background-color: #ff7f0e;"></span> Female
        </div>
         <div class="legend-item">
          <span class="legend-color" style="background-color: #800080;"></span> Non-binary
        </div>
      </div>
    </div>
  </div>
  <div v-else>Loading data...</div>
</template>

<script>
import * as d3 from 'd3';

export default {
  props: ['data'],
  mounted() {
    if (this.data) {
      this.drawPieChart();
    }
  },
  methods: {
    drawPieChart() {
      // Filter data to only include high-risk clients
      const highRiskData = this.data.filter(d => d["Risk Rating"] === "High");

      // Count males and females in the high-risk category
      const genderCount = d3.rollup(
        highRiskData,
        v => v.length,
        d => d["Gender"]
      );

      const genderData = Array.from(genderCount, ([key, value]) => ({ gender: key, count: value }));
      
      console.log("High-risk gender data:", genderData);

      const width = 400;
      const height = 300;
      const radius = Math.min(width, height) / 2;
      const svg = d3.select(this.$refs.pieChart)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

      // Color scale for gender
      const color = d3.scaleOrdinal()
        .domain(["Male", "Female", "Non-binary"])
        .range(["#1f77b4", "#ff7f0e", "#800080"]);

      // Pie chart layout
      const pie = d3.pie()
        .value(d => d.count)
        .sort(null);

      const data_ready = pie(genderData);

      // Create the pie slices
      svg.selectAll('path')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', d3.arc()
          .innerRadius(0)
          .outerRadius(radius))
        .attr('fill', d => color(d.data.gender))
        .attr('stroke', 'white')
        .style('stroke-width', '2px');

      // Add text labels to slices
      svg.selectAll('text')
        .data(data_ready)
        .enter()
        .append('text')
        .text(d => `${d.data.gender}: ${d.data.count}`)
        .attr('transform', d => `translate(${d3.arc()
          .innerRadius(0)
          .outerRadius(radius)
          .centroid(d)})`)
        .style('text-anchor', 'middle')
        .style('fill', 'black');
    }
  }
};
</script>

<style scoped>
/* Invisible chart container */
.invisible-chart-container {
  padding: 20px;
  background-color: transparent; /* Invisible background */
}

/* Box for Pie Chart */
.pie-chart-box {
  position: relative;
  width: 500px;
  height: 300px;
  margin: 0 auto;
  padding: 20px;
}

/* Title Styling */
/* .chart-title {
  color: black !important; /* Force title to be black */
/* }  */

/* Legend Styling */
.legend {
  position: absolute;
  top: 0;
  right: 0px;
  padding: 5px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 5px 0;
}

.legend-color {
  width: 15px;
  height: 15px;
  margin-right: 5px;
  border: 1px solid black;
}
</style>
