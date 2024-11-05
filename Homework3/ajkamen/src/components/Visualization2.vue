<template>
  <div v-if="data" class="invisible-chart-container">
    <h2 class="chart-title">
      {{ selectedCategory }} Distribution of {{ selectedRisk }}-Risk Clients
    </h2>

    <!-- Dropdown for selecting risk level -->
    <div class="filter-dropdown">
      <label for="riskSelect">Select Risk Level: </label>
      <select id="riskSelect" v-model="selectedRisk" @change="updateChart">
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
    </div>

    <!-- Dropdown for selecting category -->
    <div class="filter-dropdown">
      <label for="categorySelect">Select Category: </label>
      <select
        id="categorySelect"
        v-model="selectedCategory"
        @change="updateChart"
      >
        <option value="Gender">Gender</option>
        <option value="Years at Current Job">Years at Current Job</option>
        <option value="Employment Status">Employment Status</option>
        <option value="Loan Purpose">Loan Purpose</option>
      </select>
    </div>

    <div class="pie-chart-box">
      <div ref="pieChart"></div>
      <div class="legend">
        <div
          v-for="(color, label) in currentLegend"
          :key="label"
          class="legend-item"
        >
          <span class="legend-color" :style="{ backgroundColor: color }"></span>
          {{ label }}
        </div>
      </div>
    </div>
  </div>
  <div v-else>Loading data...</div>
</template>

<script>
import * as d3 from 'd3'

export default {
  props: ['data'],
  data() {
    return {
      selectedRisk: 'High', // Default selected risk level
      selectedCategory: 'Gender', // Default selected category
    }
  },
  mounted() {
    if (this.data) {
      this.addCategoryBrackets() // Add category brackets to data
      this.drawPieChart() // Initial draw
    }
  },
  computed: {
    currentLegend() {
      // Define legends for each category dynamically
      const categoryLegends = {
        Gender: {
          Male: '#1f77b4',
          Female: '#ff7f0e',
          'Non-binary': '#800080',
        },
        'Years at Current Job': {
          '0-5': '#1f77b4',
          '5-10': '#ff7f0e',
          '10-15': '#2ca02c',
          '16+': '#d62728',
        },
        'Employment Status': {
          Unemployed: '#1f77b4',
          Employed: '#ff7f0e',
          'Self-employed': '#2ca02c',
        },
        'Loan Purpose': {
          Personal: '#1f77b4',
          Auto: '#ff7f0e',
          Home: '#2ca02c',
          Business: '#d62728',
        },
      }
      return categoryLegends[this.selectedCategory]
    },
  },
  methods: {
    addCategoryBrackets() {
      this.data.forEach(d => {
        // Years at Current Job Brackets
        const years = +d['Years at Current Job']
        if (years <= 5) d['Years at Current Job Bracket'] = '0-5'
        else if (years <= 10) d['Years at Current Job Bracket'] = '5-10'
        else if (years <= 15) d['Years at Current Job Bracket'] = '10-15'
        else d['Years at Current Job Bracket'] = '16+'
      })
    },
    updateChart() {
      d3.select(this.$refs.pieChart).selectAll('*').remove() // Clear the existing chart
      this.drawPieChart() // Redraw chart with new data
    },
    drawPieChart() {
      const filteredData = this.data.filter(
        d => d['Risk Rating'] === this.selectedRisk,
      )

      let categoryCount
      if (this.selectedCategory === 'Gender') {
        categoryCount = d3.rollup(
          filteredData,
          v => v.length,
          d => d['Gender'],
        )
      } else if (this.selectedCategory === 'Years at Current Job') {
        categoryCount = d3.rollup(
          filteredData,
          v => v.length,
          d => d['Years at Current Job Bracket'],
        )
      } else if (this.selectedCategory === 'Employment Status') {
        categoryCount = d3.rollup(
          filteredData,
          v => v.length,
          d => d['Employment Status'],
        )
      } else if (this.selectedCategory === 'Loan Purpose') {
        categoryCount = d3.rollup(
          filteredData,
          v => v.length,
          d => d['Loan Purpose'],
        )
      }

      const categoryData = Array.from(categoryCount, ([key, value]) => ({
        category: key,
        count: value,
      }))

      const totalCount = d3.sum(categoryData, d => d.count)

      const width = 500 // Increased size for better readability
      const height = 400
      const radius = Math.min(width, height) / 2

      const svg = d3
        .select(this.$refs.pieChart)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`)

      const color = d3
        .scaleOrdinal()
        .domain(categoryData.map(d => d.category))
        .range(Object.values(this.currentLegend)) // Use legend colors

      const pie = d3
        .pie()
        .value(d => d.count)
        .sort(null)

      const data_ready = pie(categoryData)

      const tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'white')
        .style('border', '1px solid black')
        .style('padding', '5px')

      svg
        .selectAll('path')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', d3.arc().innerRadius(0).outerRadius(0))
        .attr('fill', d => color(d.data.category))
        .attr('stroke', 'white')
        .style('stroke-width', '2px')
        .transition()
        .duration(800)
        .attrTween('d', function (d) {
          const i = d3.interpolate(d.startAngle + 0.1, d.endAngle)
          return t => {
            d.endAngle = i(t)
            return d3.arc().innerRadius(0).outerRadius(radius)(d)
          }
        })

      svg
        .selectAll('path')
        .on('mouseover', function (event, d) {
          tooltip.style('opacity', 1).html(
            `<strong>${d.data.category}</strong><br/>
               Count: ${d.data.count}<br/>
               Percentage: ${((d.data.count / totalCount) * 100).toFixed(1)}%`,
          )
          d3.select(this)
            .transition()
            .duration(200)
            .attr(
              'd',
              d3
                .arc()
                .innerRadius(0)
                .outerRadius(radius + 10),
            )
        })
        .on('mousemove', function (event) {
          tooltip
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 30 + 'px')
        })
        .on('mouseout', function () {
          tooltip.style('opacity', 0)
          d3.select(this)
            .transition()
            .duration(200)
            .attr('d', d3.arc().innerRadius(0).outerRadius(radius))
        })

      svg
        .selectAll('text')
        .data(data_ready)
        .enter()
        .append('text')
        .text(d => `${d.data.category}: ${d.data.count}`)
        .attr(
          'transform',
          d =>
            `translate(${d3
              .arc()
              .innerRadius(0)
              .outerRadius(radius - 30)
              .centroid(d)})`,
        )
        .style('text-anchor', 'middle')
        .style('fill', 'black')
    },
  },
}
</script>

<style scoped>
/* Tooltip Styling */
.tooltip {
  font-size: 12px;
  pointer-events: none;
}

/* Invisible chart container */
.invisible-chart-container {
  padding: 20px;
  background-color: transparent;
}

/* Box for Pie Chart */
.pie-chart-box {
  position: relative;
  width: 600px; /* Increased width */
  height: 400px; /* Increased height */
  margin: 0 auto;
  padding: 20px;
}

/* Title Styling */
.chart-title {
  color: black !important;
}

/* Filter dropdown */
.filter-dropdown {
  margin: 10px;
}

.legend {
  position: absolute;
  top: 0;
  right: 0;
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
