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
      // Group people into age categories and calculate average income
      const ageGroups = [
        { range: '18-24', label: 'Young adults', low: 18, high: 24 },
        { range: '25-34', label: 'Emerging adulthood', low: 25, high: 34 },
        { range: '35-44', label: 'Mid-career', low: 35, high: 44 },
        { range: '45-54', label: 'Later career', low: 45, high: 54 },
        { range: '55-64', label: 'Pre-retirement', low: 55, high: 64 },
        { range: '65+', label: 'Retirement age', low: 65, high: 100 }, // Assume 100 as upper bound
      ]

      // Process data for each age group
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

        // Count the number of each risk rating
        const riskCounts = d3.rollup(
          groupData,
          v => v.length,
          d => d['Risk Rating'],
        )

        const totalPeople = d3.sum([...riskCounts.values()])

        // Calculate percentages of each risk category
        const lowRiskPercentage = (riskCounts.get('Low') || 0) / totalPeople
        const mediumRiskPercentage =
          (riskCounts.get('Medium') || 0) / totalPeople
        const highRiskPercentage = (riskCounts.get('High') || 0) / totalPeople

        return {
          range: group.range,
          averageIncome: Math.round(averageIncome), // Rounded average income
          risks: {
            low: lowRiskPercentage || 0,
            medium: mediumRiskPercentage || 0,
            high: highRiskPercentage || 0,
          },
        }
      })

      const width = 550 // Reduced width to make space for the legend
      const height = 300
      const margin = { top: 40, right: 30, bottom: 60, left: 60 }

      const svg = d3
        .select(this.$refs.barChart)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)

      // X scale: Age groups
      const x = d3
        .scaleBand()
        .domain(processedData.map(d => d.range))
        .range([0, width])
        .padding(0.3) // Increased padding to make bars thinner

      // Y scale: Average income
      const y = d3
        .scaleLinear()
        .domain([0, d3.max(processedData, d => d.averageIncome)])
        .range([height, 0])

      // X-axis
      svg
        .append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('text-anchor', 'middle')
        .style('fill', 'black') // Black text for X-axis

      // Y-axis
      svg
        .append('g')
        .call(
          d3
            .axisLeft(y)
            .ticks(10)
            .tickFormat(d => `$${d / 1000}k`),
        ) // Increments of $10,000
        .selectAll('text')
        .style('fill', 'black') // Black text for Y-axis

      // Color scale for risk ratings
      const colorScale = d3
        .scaleOrdinal()
        .domain(['Low', 'Medium', 'High'])
        .range(['blue', 'orange', 'red'])

      // Bars - stacked segments based on risk ratings
      svg
        .selectAll('.bar')
        .data(processedData)
        .enter()
        .append('g')
        .each(function (d) {
          const barGroup = d3.select(this)

          // High risk (bottom segment)
          barGroup
            .append('rect')
            .attr('x', () => x(d.range))
            .attr('y', () => y(d.averageIncome * d.risks.high))
            .attr('width', x.bandwidth())
            .attr('height', () => height - y(d.averageIncome * d.risks.high))
            .attr('fill', colorScale('High'))

          // Medium risk (middle segment)
          barGroup
            .append('rect')
            .attr('x', () => x(d.range))
            .attr('y', () =>
              y(d.averageIncome * (d.risks.high + d.risks.medium)),
            )
            .attr('width', x.bandwidth())
            .attr('height', () => height - y(d.averageIncome * d.risks.medium))
            .attr('fill', colorScale('Medium'))

          // Low risk (top segment)
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
        })

      // Text labels on top of bars (green color)
      svg
        .selectAll('.label')
        .data(processedData)
        .enter()
        .append('text')
        .attr('x', d => x(d.range) + x.bandwidth() / 2)
        .attr('y', d => y(d.averageIncome) - 5)
        .attr('text-anchor', 'middle')
        .style('fill', 'green') // Green text for income
        .text(d => `$${d.averageIncome}`)
    },
  },
}
</script>

<style scoped>
.chart-container {
  background-color: white; /* White background for the container */
  padding: 20px;
  border: 1px solid black; /* Box surrounding the chart */
}

/* Title Styling */
.chart-title {
  color: black !important; /* Force the title text to be black */
}

.bar-graph-box {
  position: relative;
  width: 800px; /* Increased width to accommodate legend */
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border: 2px solid black; /* Box around the chart */
}

.legend {
  position: absolute;
  top: 0;
  right: 0px; /* Moved the legend further right */
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

/* Force black font color for all text inside bar-graph-box */
.bar-graph-box h2,
.bar-graph-box g text,
.bar-graph-box text,
.bar-graph-box .legend {
  color: black !important; /* Ensure black font color */
}

/* SVG Text Labels */
.bar-graph-box text {
  font-family: Arial, sans-serif;
  color: black !important; /* Force the text color to black */
}
</style>
