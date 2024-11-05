<template>
  <div v-if="data">
    <h2 class="chart-title">
      Average Income by Selected Category with Risk Distribution
    </h2>

    <!-- Bracket Selection Buttons -->
    <div class="bracket-buttons">
      <button
        v-for="option in xAxisOptions"
        :key="option"
        @click="setXAxis(option)"
      >
        {{ option }}
      </button>
    </div>

    <!-- Bar Chart and Legend -->
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
  </div>
  <div v-else>Loading data...</div>
</template>

<script>
import * as d3 from 'd3'

export default {
  props: ['data'],
  data() {
    return {
      xAxisCategory: 'Age Bracket', // Default x-axis category
      xAxisOptions: [
        'Age Bracket',
        'Credit Score Bracket',
        'Loan Amount Bracket',
        'Debt-to-Income Ratio Bracket',
      ], // Removed 'Income Bracket'
    }
  },
  computed: {
    formattedXAxisOptions() {
      // Remove " Bracket" from each option's label for display
      return this.xAxisOptions.map(option => option.replace(' Bracket', ''))
    },
  },
  mounted() {
    if (this.data) {
      this.addBrackets()
      this.drawBarChart()
    }
  },
  methods: {
    addBrackets() {
      this.data.forEach(d => {
        // Age Bracket
        if (d['Age'] >= 18 && d['Age'] <= 24) d['Age Bracket'] = '18-24'
        else if (d['Age'] >= 25 && d['Age'] <= 34) d['Age Bracket'] = '25-34'
        else if (d['Age'] >= 35 && d['Age'] <= 44) d['Age Bracket'] = '35-44'
        else if (d['Age'] >= 45 && d['Age'] <= 54) d['Age Bracket'] = '45-54'
        else if (d['Age'] >= 55 && d['Age'] <= 64) d['Age Bracket'] = '55-64'
        else if (d['Age'] >= 65) d['Age Bracket'] = '65+'

        // Income Bracket
        // if (d['Income'] <= 36669) d['Income Bracket'] = '20k-36k'
        // else if (d['Income'] <= 53333) d['Income Bracket'] = '36k-53k'
        // else if (d['Income'] <= 69997) d['Income Bracket'] = '53k-70k'
        // else if (d['Income'] <= 86661) d['Income Bracket'] = '70k-86k'
        // else if (d['Income'] <= 103329) d['Income Bracket'] = '86k-103k'
        // else d['Income Bracket'] = '103k-120k'

        // Credit Score Bracket
        if (d['Credit Score'] <= 633) d['Credit Score Bracket'] = '600-633'
        else if (d['Credit Score'] <= 666) d['Credit Score Bracket'] = '634-666'
        else if (d['Credit Score'] <= 699) d['Credit Score Bracket'] = '667-699'
        else if (d['Credit Score'] <= 733) d['Credit Score Bracket'] = '700-733'
        else if (d['Credit Score'] <= 766) d['Credit Score Bracket'] = '734-766'
        else d['Credit Score Bracket'] = '767-799'

        // Loan Amount Bracket
        if (d['Loan Amount'] <= 11666) d['Loan Amount Bracket'] = '5k-12k'
        else if (d['Loan Amount'] <= 18332) d['Loan Amount Bracket'] = '12k-18k'
        else if (d['Loan Amount'] <= 24998) d['Loan Amount Bracket'] = '18k-25k'
        else if (d['Loan Amount'] <= 31665) d['Loan Amount Bracket'] = '25k-32k'
        else if (d['Loan Amount'] <= 38331) d['Loan Amount Bracket'] = '32k-38k'
        else d['Loan Amount Bracket'] = '38k-50k'

        // Debt-to-Income Ratio Bracket
        if (d['Debt-to-Income Ratio'] <= 0.2)
          d['Debt-to-Income Ratio Bracket'] = '0.1-0.2'
        else if (d['Debt-to-Income Ratio'] <= 0.3)
          d['Debt-to-Income Ratio Bracket'] = '0.2-0.3'
        else if (d['Debt-to-Income Ratio'] <= 0.4)
          d['Debt-to-Income Ratio Bracket'] = '0.3-0.4'
        else if (d['Debt-to-Income Ratio'] <= 0.5)
          d['Debt-to-Income Ratio Bracket'] = '0.4-0.5'
        else if (d['Debt-to-Income Ratio'] <= 0.6)
          d['Debt-to-Income Ratio Bracket'] = '0.5-0.6'
        else d['Debt-to-Income Ratio Bracket'] = '0.6+'
      })
    },
    setXAxis(category) {
      this.xAxisCategory = category
      this.drawBarChart() // Redraw the chart with new x-axis
    },
    drawBarChart() {
      const xAxisCategory = this.xAxisCategory
      const groupedData = d3.groups(this.data, d => d[xAxisCategory])

      // Sort the groupedData based on logical order for each xAxisCategory
      const sortedData = groupedData.sort(([a], [b]) => {
        const orderMap = {
          'Age Bracket': ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
          'Income Bracket': [
            '20k-36k',
            '36k-53k',
            '53k-70k',
            '70k-86k',
            '86k-103k',
            '103k-120k',
          ],
          'Credit Score Bracket': [
            '600-633',
            '634-666',
            '667-699',
            '700-733',
            '734-766',
            '767-799',
          ],
          'Loan Amount Bracket': [
            '5k-12k',
            '12k-18k',
            '18k-25k',
            '25k-32k',
            '32k-38k',
            '38k-50k',
          ],
          'Debt-to-Income Ratio Bracket': [
            '0.1-0.2',
            '0.2-0.3',
            '0.3-0.4',
            '0.4-0.5',
            '0.5-0.6',
            '0.6+',
          ],
        }
        return (
          orderMap[xAxisCategory].indexOf(a) -
          orderMap[xAxisCategory].indexOf(b)
        )
      })

      const processedData = sortedData.map(([key, groupData]) => {
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
          range: key,
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

      d3.select(this.$refs.barChart).select('svg').remove() // Clear existing SVG before redraw

      const svg = d3
        .select(this.$refs.barChart)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .call(
          d3.zoom().on('zoom', event => svg.attr('transform', event.transform)),
        )
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

          // High risk
          barGroup
            .append('rect')
            .attr('x', x(d.range))
            .attr('y', height) // Start at bottom for animation
            .attr('width', x.bandwidth())
            .attr('height', 0)
            .attr('fill', colorScale('High'))
            .transition()
            .duration(800)
            .attr('y', y(d.averageIncome * d.risks.high))
            .attr('height', height - y(d.averageIncome * d.risks.high))

          // Medium risk
          barGroup
            .append('rect')
            .attr('x', x(d.range))
            .attr('y', height)
            .attr('width', x.bandwidth())
            .attr('height', 0)
            .attr('fill', colorScale('Medium'))
            .transition()
            .duration(800)
            .delay(200)
            .attr('y', y(d.averageIncome * (d.risks.high + d.risks.medium)))
            .attr('height', height - y(d.averageIncome * d.risks.medium))

          // Low risk
          barGroup
            .append('rect')
            .attr('x', x(d.range))
            .attr('y', height)
            .attr('width', x.bandwidth())
            .attr('height', 0)
            .attr('fill', colorScale('Low'))
            .transition()
            .duration(800)
            .delay(400)
            .attr(
              'y',
              y(
                d.averageIncome * (d.risks.high + d.risks.medium + d.risks.low),
              ),
            )
            .attr('height', height - y(d.averageIncome * d.risks.low))

          barGroup
            .on('mouseover', function (event) {
              tooltip.transition().duration(200).style('opacity', 1)
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
              tooltip.transition().duration(200).style('opacity', 0)
            })
        })
    },
  },
}
</script>

<style scoped>
.tooltip {
  font-weight: bold;
  color: black;
  transition: opacity 0.2s ease;
}

.chart-title {
  color: black;
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
  right: 0;
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
</style>
