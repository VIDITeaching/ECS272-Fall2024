<template>
  <div v-if="data" class="chart-container">
    <h2 class="chart-title">
      Average Income by Age Group and Risk Distribution
    </h2>
    <!-- Title -->
    <div class="bar-graph-box">
      <div ref="barChart"></div>
      <div class="legend">
        <div class="legend-item">
          <span class="legend-color" style="background-color: blue"></span> Low
          Risk
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background-color: orange"></span>
          Medium Risk
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background-color: red"></span> High
          Risk
        </div>
      </div>
    </div>
    <div id="tooltip" class="tooltip" style="opacity: 0"></div>
    <!-- Tooltip div -->
  </div>
  <div v-else>Loading data...</div>
</template>

<script>
import * as d3 from 'd3'

export default {
  props: ['data'],
  mounted() {
    if (this.data) {
      this.drawBarChart()
    }
  },
  methods: {
    drawBarChart() {
      const ageGroups = [
        { range: '18-24', label: 'Young adults', low: 18, high: 24 },
        { range: '25-34', label: 'Emerging adulthood', low: 25, high: 34 },
        { range: '35-44', label: 'Mid-career', low: 35, high: 44 },
        { range: '45-54', label: 'Later career', low: 45, high: 54 },
        { range: '55-64', label: 'Pre-retirement', low: 55, high: 64 },
        { range: '65+', label: 'Retirement age', low: 65, high: 100 },
      ]

      const processedData = ageGroups.map(group => {
        const groupData = this.data.filter(
          d =>
            d['Income'] !== '' &&
            !isNaN(+d['Income']) &&
            !isNaN(+d['Age']) &&
            +d['Age'] >= group.low &&
            +d['Age'] <= group.high,
        )

        const averageIncome =
          groupData.length > 0 ? d3.mean(groupData, d => +d['Income']) : 0

        const riskCounts = d3.rollup(
          groupData,
          v => v.length,
          d => d['Risk Rating'],
        )

        const totalPeople = d3.sum([...riskCounts.values()])

        const lowRiskPercentage = (riskCounts.get('Low') || 0) / totalPeople
        const mediumRiskPercentage =
          (riskCounts.get('Medium') || 0) / totalPeople
        const highRiskPercentage = (riskCounts.get('High') || 0) / totalPeople

        return {
          range: group.range,
          averageIncome: Math.round(averageIncome),
          risks: {
            low: lowRiskPercentage || 0,
            medium: mediumRiskPercentage || 0,
            high: highRiskPercentage || 0,
          },
        }
      })

      const width = 550
      const height = 300
      const margin = { top: 40, right: 30, bottom: 60, left: 60 }

      const svg = d3
        .select(this.$refs.barChart)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)

      const x = d3
        .scaleBand()
        .domain(processedData.map(d => d.range))
        .range([0, width])
        .padding(0.3)

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(processedData, d => d.averageIncome)])
        .range([height, 0])

      svg
        .append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('text-anchor', 'middle')
        .style('fill', 'black')

      svg
        .append('g')
        .call(
          d3
            .axisLeft(y)
            .ticks(10)
            .tickFormat(d => `$${d / 1000}k`),
        )
        .selectAll('text')
        .style('fill', 'black')

      const colorScale = d3
        .scaleOrdinal()
        .domain(['Low', 'Medium', 'High'])
        .range(['blue', 'orange', 'red'])

      const tooltip = d3
        .select('#tooltip')
        .style('position', 'absolute')
        .style('background-color', 'white')
        .style('border', '1px solid black')
        .style('padding', '5px')
        .style('opacity', 0)

      svg
        .selectAll('.bar')
        .data(processedData)
        .enter()
        .append('g')
        .each(function (d) {
          const barGroup = d3.select(this)

          barGroup
            .append('rect')
            .attr('x', () => x(d.range))
            .attr('y', () => y(d.averageIncome * d.risks.high))
            .attr('width', x.bandwidth())
            .attr('height', () => height - y(d.averageIncome * d.risks.high))
            .attr('fill', colorScale('High'))

          barGroup
            .append('rect')
            .attr('x', () => x(d.range))
            .attr('y', () =>
              y(d.averageIncome * (d.risks.high + d.risks.medium)),
            )
            .attr('width', x.bandwidth())
            .attr('height', () => height - y(d.averageIncome * d.risks.medium))
            .attr('fill', colorScale('Medium'))

          barGroup
            .append('rect')
            .attr('x', () => x(d.range))
            .attr('y', () =>
              y(
                d.averageIncome * (d.risks.high + d.risks.medium + d.risks.low),
              ),
            )
            .attr('width', x.bandwidth())
            .attr('height', () => height - y(d.averageIncome * d.risks.low))
            .attr('fill', colorScale('Low'))

          barGroup
            .on('mouseover', function (event) {
              tooltip.style('opacity', 1)
            })
            .on('mousemove', function (event) {
              tooltip
                .html(
                  `<strong>${d.range}</strong><br/>
                   Low Risk: ${(d.risks.low * 100).toFixed(1)}%<br/>
                   Medium Risk: ${(d.risks.medium * 100).toFixed(1)}%<br/>
                   High Risk: ${(d.risks.high * 100).toFixed(1)}%`,
                )
                .style('left', event.pageX + 10 + 'px')
                .style('top', event.pageY - 30 + 'px')
            })
            .on('mouseout', function () {
              tooltip.style('opacity', 0)
            })
        })

      svg
        .selectAll('.label')
        .data(processedData)
        .enter()
        .append('text')
        .attr('x', d => x(d.range) + x.bandwidth() / 2)
        .attr('y', d => y(d.averageIncome) - 5)
        .attr('text-anchor', 'middle')
        .style('fill', 'green')
        .text(d => `$${d.averageIncome}`)
    },
  },
}
</script>

<style scoped>
.chart-container {
  background-color: white;
  padding: 20px;
  border: 1px solid black;
}

.tooltip {
  font-weight: bold; /* Make the tooltip text bold */
  color: black; /* Set the font color to black */
}

.chart-title {
  color: black !important;
}

.bar-graph-box {
  position: relative;
  width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border: 2px solid black;
}

.legend {
  position: absolute;
  top: 0;
  right: 0px;
  padding: 5px;
  border: 1px solid black;
  background-color: white;
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

.tooltip {
  font-size: 12px;
  pointer-events: none;
}

.bar-graph-box h2,
.bar-graph-box g text,
.bar-graph-box text,
.bar-graph-box .legend {
  color: black !important;
}

.bar-graph-box text {
  font-family: Arial, sans-serif;
  color: black !important;
}
</style>
