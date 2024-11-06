<template>
  <div class="bar-chart-wrapper">
    <button class="sort-button" @click="toggleSortReset">{{ buttonLabel }}</button>
    <div class="chart-container" ref="barContainer">
      <svg id="bar-svg"></svg>
    </div>
    <!-- Tooltip Element -->
    <div v-if="tooltipVisible" class="tooltip" :style="tooltipStyle">
      <strong>{{ tooltipData.category }}:</strong> {{ tooltipData.value }}
    </div>
  </div>
</template>

<script lang="ts">
import * as d3 from "d3";
import { debounce, isEmpty } from 'lodash';

interface CategoricalBar {
  category: string;
  value: number;
}

export default {
  name: 'BarChart',
  data() {
    return {
      bars: [] as CategoricalBar[], // Store the bar data
      originalBars: [] as CategoricalBar[], // Store original data to reset
      size: { width: 0, height: 0 },
      margin: { left: 80, right: 40, top: 50, bottom: 130 },
      xScale: null as any,
      buttonLabel: "Sort by Value", // Button label toggles between Sort and Reset
      tooltipVisible: false,
      tooltipData: { category: '', value: 0 },
      tooltipStyle: { left: '0px', top: '0px' }
    };
  },
  computed: {
    rerender() {
      return !isEmpty(this.bars) && this.size;
    }
  },
  created() {
    d3.csv('../../data/car_prices.csv').then((data: any[]) => {
      const validStateData = data.filter(d => /^[a-z]{2}$/.test(d.state));
      const stateCarCounts = d3.rollups(
        validStateData,
        v => v.length,
        d => d.state
      )
        .map(([state, count]) => ({ category: state, value: count }));

      this.bars = stateCarCounts;
      this.originalBars = [...stateCarCounts]; // Save a copy of the original data
      this.initChart();
    });
  },
  methods: {
    onResize() {
      const container = this.$refs.barContainer as HTMLElement;
      this.size.width = container.clientWidth;
      this.size.height = container.clientHeight;
      d3.select("#bar-svg").selectAll("*").remove(); // Clear previous chart
      this.initChart();
    },
    initChart() {
      const svg = d3.select("#bar-svg")
        .attr("viewBox", `0 0 ${this.size.width} ${this.size.height}`)
        .attr("width", "100%")
        .attr("height", "100%");

      const chartWidth = Math.max(this.size.width, this.bars.length * 10);
      svg.attr("width", chartWidth);

      const chartContainer = svg.append('g')
        .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

      this.xScale = d3.scaleBand()
        .domain(this.bars.map(d => d.category))
        .range([0, chartWidth - this.margin.left - this.margin.right])
        .padding(0.1);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(this.bars, d => d.value)!])
        .range([this.size.height - this.margin.top - this.margin.bottom, 0]);

      // Chart Title
      svg.append('text')
        .attr('x', this.size.width / 2)
        .attr('y', this.margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text('Car Counts by State');

      // X-axis
      chartContainer.append('g')
        .attr('transform', `translate(0, ${this.size.height - this.margin.top - this.margin.bottom})`)
        .call(d3.axisBottom(this.xScale))
        .selectAll('text')
        .style('text-anchor', 'end')
        .style('font-size', '9px')
        .attr('x', 3);

      // Y-axis
      chartContainer.append('g')
        .call(d3.axisLeft(yScale));

      // X-axis label
      svg.append('text')
        .attr('x', this.size.width / 2)
        .attr('y', this.size.height - this.margin.bottom / 3)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('State');

      // Y-axis label
      svg.append('text')
        .attr('x', -this.size.height / 2)
        .attr('y', this.margin.left / 3)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Car Count');

        const padding = 5; // Padding area around each bar

        chartContainer.selectAll('.bar')
          .data(this.bars)
          .enter()
          .append('rect')
          .attr('class', 'hover-area')
          .attr('x', (d: CategoricalBar) => this.xScale(d.category)! - padding) // Expanding the area
          .attr('y', 0)
          .attr('width', (d: CategoricalBar) => this.xScale.bandwidth() + 2 * padding) // Expand the width
          .attr('height', this.size.height - this.margin.top - this.margin.bottom)
          .attr('fill', 'transparent') // Make the hover area invisible
          .on('mouseover', (event, d) => this.showTooltip(event, d))
          .on('mousemove', this.moveTooltip)
          .on('mouseout', this.hideTooltip)
          .on('click', (event, d) => {
            this.$emit('stateSelected', d.category);
          });

        chartContainer.selectAll('.bar')
          .data(this.bars)
          .enter()
          .append('rect')
          .attr('class', 'bar')
          .attr('x', (d: CategoricalBar) => this.xScale(d.category)!)
          .attr('y', (d: CategoricalBar) => yScale(d.value))
          .attr('width', this.xScale.bandwidth()) // Actual bar width
          .attr('height', (d: CategoricalBar) => this.size.height - this.margin.top - this.margin.bottom - yScale(d.value))
          .attr('fill', 'teal')
          .on('mouseover', (event, d) => this.showTooltip(event, d))
          .on('mousemove', this.moveTooltip)
          .on('mouseout', this.hideTooltip)
          .on('click', (event, d) => {
            this.$emit('stateSelected', d.category); // Emit selected state to parent
          });
      },
    showTooltip(event, data) {
      this.tooltipData = {
        category: data.category,
        value: data.value
      };
      this.tooltipVisible = true;
    },
    moveTooltip(event) {
      this.tooltipStyle = {
        left: `${event.pageX + 10}px`,
        top: `${event.pageY + 10}px`
      };
    },
    hideTooltip() {
      this.tooltipVisible = false;
    },
    toggleSortReset() {
      if (this.buttonLabel === "Sort by Value") {
        this.sortBars();
        this.buttonLabel = "Reset";
      } else {
        this.resetBars();
        this.buttonLabel = "Sort by Value";
      }
    },
    sortBars() {
      this.bars.sort((a, b) => b.value - a.value);
      this.xScale.domain(this.bars.map(d => d.category));

      d3.select("#bar-svg")
        .selectAll('.bar')
        .data(this.bars, d => d.category)
        .transition()
        .duration(750)
        .attr('x', (d: CategoricalBar) => this.xScale(d.category)!);

      d3.select("#bar-svg")
        .selectAll('.label')
        .data(this.bars, d => d.category)
        .transition()
        .duration(750)
        .attr('x', (d: CategoricalBar) => this.xScale(d.category)! + this.xScale.bandwidth() / 2);
    },
    resetBars() {
      this.bars = [...this.originalBars];
      this.xScale.domain(this.bars.map(d => d.category));

      d3.select("#bar-svg")
        .selectAll('.bar')
        .data(this.bars, d => d.category)
        .transition()
        .duration(750)
        .attr('x', (d: CategoricalBar) => this.xScale(d.category)!);

      d3.select("#bar-svg")
        .selectAll('.label')
        .data(this.bars, d => d.category)
        .transition()
        .duration(750)
        .attr('x', (d: CategoricalBar) => this.xScale(d.category)! + this.xScale.bandwidth() / 2);
    }
  },
  watch: {
    rerender(newSize) {
      if (!isEmpty(newSize)) {
        d3.select('#bar-svg').selectAll('*').remove();
        this.initChart();
      }
    }
  },
  mounted() {
    window.addEventListener('resize', debounce(this.onResize, 100));
    this.onResize();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
  }
}
</script>

<style scoped>
.bar-chart-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.chart-container {
  display: flex;
  width: 48.6vw;  /* 10% smaller */
  height: 43.2vh; /* 10% smaller */
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid #ccc;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  background-color: #f9f9f9;
  transform: translateX(20px); /* Move left by 10px */
}

.sort-button {
  margin-bottom: 16px;
  padding: 10px 20px;
  font-size: 16px;
  color: #fff;
  background-color: teal;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.sort-button:hover {
  background-color: #007b7b;
}

.tooltip {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
}
</style>
