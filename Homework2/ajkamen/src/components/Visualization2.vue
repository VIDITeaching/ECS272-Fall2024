<template>
  <div v-if="data">
    <h2>Income Distribution by Gender</h2>
    <div ref="pieChart"></div>
    <div id="legend"></div> <!-- Legend -->
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
      const groupedData = d3.rollup(
        this.data.filter(d => d["Income"] !== "" && !isNaN(+d["Income"])),
        v => d3.sum(v, d => +d["Income"]),
        d => d["Gender"]
      );

      const data = Array.from(groupedData, ([key, value]) => ({ category: key, value }));

      const width = 400;
      const height = 400;
      const radius = Math.min(width, height) / 2;

      const svg = d3.select(this.$refs.pieChart)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

      const pie = d3.pie()
        .value(d => d.value)(data);

      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

      const color = d3.scaleOrdinal(d3.schemeCategory10);

      svg.selectAll('path')
        .data(pie)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i));

      // Add legend
      const legend = d3.select('#legend')
        .selectAll('.legend-item')
        .data(data)
        .enter()
        .append('div')
        .attr('class', 'legend-item')
        .style('display', 'flex')
        .style('align-items', 'center');

      legend.append('div')
        .style('background-color', (d, i) => color(i))
        .style('width', '15px')
        .style('height', '15px')
        .style('margin-right', '10px');

      legend.append('div')
        .text(d => d.category);
    },
  },
};
</script>

<style scoped>
.legend-item {
  margin-top: 5px;
}
</style>
