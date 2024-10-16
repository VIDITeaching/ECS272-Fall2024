<template>
  <div v-if="data">
    <h2>Income Trend by Age</h2>
    <div ref="lineChart"></div>
  </div>
  <div v-else>Loading data...</div>
</template>

<script>
import * as d3 from 'd3';

export default {
  props: ['data'],
  mounted() {
    if (this.data) {
      this.drawLineChart();
    }
  },
  methods: {
    drawLineChart() {
      const data = this.data
        .filter(d => d["Age"] !== "" && !isNaN(+d["Age"]) && d["Income"] !== "" && !isNaN(+d["Income"]))
        .map(d => ({
          age: +d["Age"],
          income: +d["Income"]
        }));

      const width = 600;
      const height = 300;
      const margin = { top: 40, right: 30, bottom: 40, left: 60 };

      const svg = d3.select(this.$refs.lineChart)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      const x = d3.scaleLinear()
        .domain([d3.min(data, d => d.age), d3.max(data, d => d.age)])
        .range([0, width]);

      svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .append('text')
        .attr('x', width / 2)
        .attr('y', margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .text('Age');

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.income)])
        .range([height, 0]);

      svg.append('g')
        .call(d3.axisLeft(y))
        .append('text')
        .attr('x', -height / 2)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .text('Income');

      svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 2)
        .attr('d', d3.line()
          .x(d => x(d.age))
          .y(d => y(d.income)));
    },
  },
};
</script>

<style scoped>
</style>
