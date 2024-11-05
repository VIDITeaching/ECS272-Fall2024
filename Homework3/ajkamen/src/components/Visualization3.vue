<template>
  <div v-if="data" class="chart-container">
    <h2 class="chart-title">
      Sankey Diagram: Risk Rating and Financial Metrics
    </h2>
    <div class="chart-box">
      <div ref="sankeyDiagram"></div>
      <div class="legend-box">
        <div class="legend">
          <div class="legend-item">
            <span class="legend-color" style="background-color: #9b2226"></span>
            High Risk
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #f4a261"></span>
            Medium Risk
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #2a9d8f"></span>
            Low Risk
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else>Loading data...</div>
</template>

<script>
import * as d3 from 'd3'
import { sankey, sankeyLinkHorizontal } from 'd3-sankey'

export default {
  props: ['data'],
  mounted() {
    this.normalizeData()
    this.renderSankey()
  },
  methods: {
    normalizeData() {
      this.data.forEach(d => {
        d['Risk Rating'] = (d['Risk Rating'] || '').trim()

        // Age brackets
        if (d['Age'] >= 18 && d['Age'] <= 24) d['Age Bracket'] = '18-24'
        else if (d['Age'] >= 25 && d['Age'] <= 34) d['Age Bracket'] = '25-34'
        else if (d['Age'] >= 35 && d['Age'] <= 44) d['Age Bracket'] = '35-44'
        else if (d['Age'] >= 45 && d['Age'] <= 54) d['Age Bracket'] = '45-54'
        else if (d['Age'] >= 55 && d['Age'] <= 64) d['Age Bracket'] = '55-64'
        else if (d['Age'] >= 65) d['Age Bracket'] = '65+'

        // Income brackets
        if (d['Income'] <= 36669) d['Income Bracket'] = '20k-36k'
        else if (d['Income'] <= 53333) d['Income Bracket'] = '36k-53k'
        else if (d['Income'] <= 69997) d['Income Bracket'] = '53k-70k'
        else if (d['Income'] <= 86661) d['Income Bracket'] = '70k-86k'
        else if (d['Income'] <= 103329) d['Income Bracket'] = '86k-103k'
        else d['Income Bracket'] = '103k-120k'

        // Credit Score brackets
        if (d['Credit Score'] <= 633) d['Credit Score Bracket'] = '600-633'
        else if (d['Credit Score'] <= 666) d['Credit Score Bracket'] = '634-666'
        else if (d['Credit Score'] <= 699) d['Credit Score Bracket'] = '667-699'
        else if (d['Credit Score'] <= 733) d['Credit Score Bracket'] = '700-733'
        else if (d['Credit Score'] <= 766) d['Credit Score Bracket'] = '734-766'
        else d['Credit Score Bracket'] = '767-799'

        // Loan Amount brackets
        if (d['Loan Amount'] <= 11666) d['Loan Amount Bracket'] = '5k-12k'
        else if (d['Loan Amount'] <= 18332) d['Loan Amount Bracket'] = '12k-18k'
        else if (d['Loan Amount'] <= 24998) d['Loan Amount Bracket'] = '18k-25k'
        else if (d['Loan Amount'] <= 31665) d['Loan Amount Bracket'] = '25k-32k'
        else if (d['Loan Amount'] <= 38331) d['Loan Amount Bracket'] = '32k-38k'
        else d['Loan Amount Bracket'] = '38k-50k'

        // Debt-to-Income Ratio brackets
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
    renderSankey() {
      const width = 1000
      const height = 600
      const margin = { top: 60, right: 20, bottom: 60, left: 60 }
      const categoryMap = {
        Low: 'Risk Rating',
        Medium: 'Risk Rating',
        High: 'Risk Rating',
        '18-24': 'Age',
        '25-34': 'Age',
        '35-44': 'Age',
        '45-54': 'Age',
        '55-64': 'Age',
        '65+': 'Age',
        '20k-36k': 'Income',
        '36k-53k': 'Income',
        '53k-70k': 'Income',
        '70k-86k': 'Income',
        '86k-103k': 'Income',
        '103k-120k': 'Income',
        '600-633': 'Credit Score',
        '634-666': 'Credit Score',
        '667-699': 'Credit Score',
        '700-733': 'Credit Score',
        '734-766': 'Credit Score',
        '767-799': 'Credit Score',
        '5k-12k': 'Loan Amount',
        '12k-18k': 'Loan Amount',
        '18k-25k': 'Loan Amount',
        '25k-32k': 'Loan Amount',
        '32k-38k': 'Loan Amount',
        '38k-50k': 'Loan Amount',
        '0.1-0.2': 'Debt-to-Income Ratio',
        '0.2-0.3': 'Debt-to-Income Ratio',
        '0.3-0.4': 'Debt-to-Income Ratio',
        '0.4-0.5': 'Debt-to-Income Ratio',
        '0.5-0.6': 'Debt-to-Income Ratio',
        '0.6+': 'Debt-to-Income Ratio',
      }

      const svg = d3
        .select(this.$refs.sankeyDiagram)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)

      const sankeyGenerator = sankey()
        // .nodeId(d => d.name)
        .nodeWidth(20)
        .nodePadding(15)
        // .nodeAlign(d3.sankeyJustify)
        .extent([
          [1, 1],
          [width - 1, height - 5],
        ])

      const color = d3
        .scaleOrdinal()
        .domain(['High', 'Medium', 'Low'])
        .range(['#9b2226', '#f4a261', '#2a9d8f']) // Muted tones

      const nodes = []
      const links = []

      const addNode = name => {
        const existingNode = nodes.findIndex(node => node.name === name)
        if (existingNode !== -1) return existingNode

        nodes.push({ name })
        return nodes.length - 1
      }

      this.data.forEach(d => {
        const riskIndex = addNode(d['Risk Rating'])
        const ageIndex = addNode(d['Age Bracket'])
        const incomeIndex = addNode(d['Income Bracket'])
        const creditScoreIndex = addNode(d['Credit Score Bracket'])
        const loanAmountIndex = addNode(d['Loan Amount Bracket'])
        const debtIncomeIndex = addNode(d['Debt-to-Income Ratio Bracket'])

        const addOrUpdateLink = (source, target) => {
          const existingLink = links.find(
            link => link.source === source && link.target === target,
          )
          if (existingLink) {
            existingLink.value += 1
          } else {
            links.push({ source, target, value: 1 })
          }
        }

        addOrUpdateLink(riskIndex, ageIndex)
        addOrUpdateLink(ageIndex, incomeIndex)
        addOrUpdateLink(incomeIndex, creditScoreIndex)
        addOrUpdateLink(creditScoreIndex, loanAmountIndex)
        addOrUpdateLink(loanAmountIndex, debtIncomeIndex)
      })

      const graph = { nodes, links }

      sankeyGenerator(graph)

      // Draw links with animation
      svg
        .append('g')
        .attr('fill', 'none')
        .selectAll('path')
        .data(graph.links)
        .enter()
        .append('path')
        .attr('d', sankeyLinkHorizontal())
        .attr('stroke-width', d => Math.max(1, d.width))
        .attr('stroke', d => color(d.source.name))
        .style('opacity', 0)
        .transition()
        .duration(800)
        .style('opacity', 0.7)

      // Add tooltip interactions separately to avoid conflicts with transitions
      svg
        .selectAll('path')
        .on('mouseover', function (event, d) {
          d3.select(this).style('opacity', 1)
        })
        .on('mouseout', function () {
          d3.select(this).style('opacity', 0.7)
        })
        .append('title')
        .text(
          d =>
            `Flow from ${categoryMap[d.source.name]} (${d.source.name}) to ${categoryMap[d.target.name]} (${d.target.name})\nFlow Value: ${d.value}\nPercentage of ${categoryMap[d.source.name]}: ${((d.value / d.source.value) * 100).toFixed(1)}%`,
        )

      // Draw nodes with hover effect for highlighting
      svg
        .append('g')
        .selectAll('rect')
        .data(graph.nodes)
        .enter()
        .append('rect')
        .attr('x', d => d.x0)
        .attr('y', d => d.y0)
        .attr('height', d => d.y1 - d.y0)
        .attr('width', d => d.x1 - d.x0)
        .attr('fill', d => color(d.name))
        .attr('stroke', '#333')
        .attr('stroke-width', 0.5)
        .on('mouseover', function () {
          d3.select(this).attr('stroke', '#000').attr('stroke-width', 1.5)
        })
        .on('mouseout', function () {
          d3.select(this).attr('stroke', '#333').attr('stroke-width', 0.5)
        })
        .append('title')
        .text(d => `${d.name}\nTotal Value: ${d.value}`)

      // Node labels
      svg
        .append('g')
        .selectAll('text.node-label')
        .data(graph.nodes)
        .enter()
        .append('text')
        .attr('class', 'node-label')
        .attr('x', d => d.x0 - 6)
        .attr('y', d => (d.y1 + d.y0) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .style('pointer-events', 'none')
        .style('font-size', '10px')
        .style('fill', '#333')
        .text(d => d.name)

      // Add labels along each "x-axis" section for categories
      const categories = [
        'Risk Rating',
        'Age Bracket',
        'Income Bracket',
        'Credit Score Bracket',
        'Loan Amount Bracket',
        'Debt-to-Income Ratio Bracket',
      ]
      categories.forEach((category, i) => {
        svg
          .append('text')
          .attr('class', 'axis-label')
          .attr(
            'x',
            i === categories.length - 1
              ? i * (width / (categories.length - 1)) - 10
              : i * (width / (categories.length - 1)),
          )
          .attr('y', -margin.top / 2)
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .text(category.replace(' Bracket', ''))
      })
    },
  },
}
</script>

<style scoped>
.chart-container {
  padding: 5px;
}

.chart-box {
  padding: 20px;
  width: 1400px;
  max-width: 1400px;
  margin: 0 auto;
  border: 1px solid black;
  background-color: white;
  position: relative;
}

.legend-box {
  background-color: white;
  padding: 10px;
  border: 1px solid black;
  position: absolute;
  top: 10px;
  right: 10px;
}

.legend {
  display: flex;
  flex-direction: column;
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

.node-label {
  font-size: 10px;
  fill: #333;
  font-weight: bold;
  pointer-events: none;
}

.axis-label {
  font-size: 12px;
  fill: #333;
  font-weight: bold;
}
</style>
