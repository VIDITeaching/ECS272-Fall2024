<template>
  <div class="chart-container" ref="pieContainer" style="width: 100vw; height: 100vh;">
    <svg id="pie-svg">
      <!-- Chart elements will be inserted here -->
    </svg>
  </div>
</template>

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
      segments: [] as PieSegment[], // Store the pie data (car condition and their counts)
      size: { width: 0, height: 0 }, // Chart size
      margin: { left: 50, right: 50, top: 50, bottom: 50 }, // Adjust margins for better spacing
    };
  },
  computed: {
    rerender() {
      return !isEmpty(this.segments) && this.size;
    }
  },
  created() {
    // Load CSV data and process it
    d3.csv('../../data/car_prices.csv').then((data: any[]) => {
      // Group data by 'condition' and count occurrences
      const conditionCount = d3.rollups(data, v => v.length, d => d.condition)
        .map(([condition, count]) => ({ label: `Condition ${condition}`, value: count }))
        .sort((a, b) => a.value - b.value);
      this.segments = conditionCount;
      this.initChart(); // Initialize the chart after loading data
    });
  },
  methods: {
    onResize() {
      const container = this.$refs.pieContainer as HTMLElement;
      this.size.width = container.clientWidth;
      this.size.height = container.clientHeight;
    },
    initChart() {
      const radius = Math.min(this.size.width, this.size.height) / 2 - Math.max(this.margin.left, this.margin.right);

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

      const labelArc = d3.arc<d3.PieArcDatum<PieSegment>>()
        .innerRadius(radius * 0.7)
        .outerRadius(radius * 0.7);

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

      // Add label lines
      chartContainer.selectAll('polyline')
        .data(pie(this.segments))
        .enter()
        .append('polyline')
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .attr('fill', 'none')
        .attr('points', d => {
          const posA = arc.centroid(d);  // Get the centroid of the arc
          const posB = labelArc.centroid(d);  // Get the position for the label
          const posC = labelArc.centroid(d);  // Calculate the outer position
          const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
          posC[0] = radius * (midAngle < Math.PI ? 1.3 : -1.3);  // Move to the right or left depending on the segment
          return [posA, posB, posC];
        });

      // Add labels with percentages
      chartContainer.selectAll('text')
        .data(pie(this.segments))
        .enter()
        .append('text')
        .attr('transform', d => {
          const pos = labelArc.centroid(d);
          const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
          pos[0] = radius * (midAngle < Math.PI ? 1.4 : -1.4);  // Adjust label position horizontally
          return `translate(${pos})`;
        })
        .attr('text-anchor', d => {
          const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
          return midAngle < Math.PI ? 'start' : 'end';
        })
        .attr('dy', '0.35em')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .text(d => {
          const percentage = ((d.value / d3.sum(this.segments.map(s => s.value))) * 100).toFixed(1);
          return `${d.data.label}: ${percentage}%`;
        });

      // Title
      svg.append('text')
        .attr('x', this.size.width / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', '16px')
        .text('Car Condition Distribution with Percentages');
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

<style scoped>
.chart-container {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
}
</style>
