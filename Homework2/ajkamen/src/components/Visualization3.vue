<template>
  <div v-if="data" class="chart-container">
    <h2 class="chart-title">Parallel Coordinates Plot: Risk Rating and Financial Metrics</h2>
    <div class="chart-box">
      <div ref="parallelCoordinatesPlot"></div>
      <div class="legend-box">
        <div class="legend">
          <div class="legend-item">
            <span class="legend-color" style="background-color: #ff0000;"></span> High Risk
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #ffff00;"></span> Medium Risk
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #0000ff;"></span> Low Risk
          </div>
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
      this.normalizeData();
      this.drawParallelCoordinatesPlot();
    }
  },
  methods: {
    normalizeData() {
      this.data.forEach(d => {
        // Age brackets
        if (d['Age'] >= 18 && d['Age'] <= 24) d['Age Bracket'] = '18-24';
        else if (d['Age'] >= 25 && d['Age'] <= 34) d['Age Bracket'] = '25-34';
        else if (d['Age'] >= 35 && d['Age'] <= 44) d['Age Bracket'] = '35-44';
        else if (d['Age'] >= 45 && d['Age'] <= 54) d['Age Bracket'] = '45-54';
        else if (d['Age'] >= 55 && d['Age'] <= 64) d['Age Bracket'] = '55-64';
        else if (d['Age'] >= 65) d['Age Bracket'] = '65+';

        // Income brackets
        if (d['Income'] <= 36669) d['Income Bracket'] = '20k-36k';
        else if (d['Income'] <= 53333) d['Income Bracket'] = '36k-53k';
        else if (d['Income'] <= 69997) d['Income Bracket'] = '53k-70k';
        else if (d['Income'] <= 86661) d['Income Bracket'] = '70k-86k';
        else if (d['Income'] <= 103329) d['Income Bracket'] = '86k-103k';
        else d['Income Bracket'] = '103k-120k';

        // Credit Score brackets
        if (d['Credit Score'] <= 633) d['Credit Score Bracket'] = '600-633';
        else if (d['Credit Score'] <= 666) d['Credit Score Bracket'] = '634-666';
        else if (d['Credit Score'] <= 699) d['Credit Score Bracket'] = '667-699';
        else if (d['Credit Score'] <= 733) d['Credit Score Bracket'] = '700-733';
        else if (d['Credit Score'] <= 766) d['Credit Score Bracket'] = '734-766';
        else d['Credit Score Bracket'] = '767-799';

        // Loan Amount brackets
        if (d['Loan Amount'] <= 11666) d['Loan Amount Bracket'] = '5k-12k';
        else if (d['Loan Amount'] <= 18332) d['Loan Amount Bracket'] = '12k-18k';
        else if (d['Loan Amount'] <= 24998) d['Loan Amount Bracket'] = '18k-25k';
        else if (d['Loan Amount'] <= 31665) d['Loan Amount Bracket'] = '25k-32k';
        else if (d['Loan Amount'] <= 38331) d['Loan Amount Bracket'] = '32k-38k';
        else d['Loan Amount Bracket'] = '38k-50k';

        // Debt-to-Income Ratio brackets
        if (d['Debt-to-Income Ratio'] <= 0.2) d['Debt-to-Income Ratio Bracket'] = '0.1-0.2';
        else if (d['Debt-to-Income Ratio'] <= 0.3) d['Debt-to-Income Ratio Bracket'] = '0.2-0.3';
        else if (d['Debt-to-Income Ratio'] <= 0.4) d['Debt-to-Income Ratio Bracket'] = '0.3-0.4';
        else if (d['Debt-to-Income Ratio'] <= 0.5) d['Debt-to-Income Ratio Bracket'] = '0.4-0.5';
        else if (d['Debt-to-Income Ratio'] <= 0.6) d['Debt-to-Income Ratio Bracket'] = '0.5-0.6';
        else d['Debt-to-Income Ratio Bracket'] = '0.6+';
      });
    },

    drawParallelCoordinatesPlot() {
      // Adjust margins, especially at the bottom
      const margin = { top: 30, right: 30, bottom: 50, left: 50 };  // Increased bottom margin to 50
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      const svg = d3.select(this.$refs.parallelCoordinatesPlot)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom + 30)  // Added 30 to the total height for extra padding
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      const dimensions = [
        'Age Bracket',
        'Income Bracket',
        'Credit Score Bracket',
        'Loan Amount Bracket',
        'Debt-to-Income Ratio Bracket'
      ];

      const y = {};
      dimensions.forEach(dim => {
        y[dim] = d3.scalePoint()
          .domain(this.data.map(d => d[dim]))
          .range([height, 0]);
      });

      const x = d3.scalePoint()
        .range([0, width])
        .padding(1)
        .domain(dimensions);

      const color = d3.scaleOrdinal()
        .domain(['Low', 'Medium', 'High'])
        .range(['#0000ff', '#ffff00', '#ff0000']);

      function path(d) {
        return d3.line()(dimensions.map(dim => [x(dim), y[dim](d[dim])]));
      }

      // Draw the lines
      svg.selectAll('myPath')
        .data(this.data)
        .enter()
        .append('path')
        .attr('d', path)
        .style('fill', 'none')
        .style('stroke', d => color(d['Risk Rating']))
        .style('opacity', 0.5);

      // Add each axis
      dimensions.forEach(dim => {
        svg.append('g')
          .attr('transform', `translate(${x(dim)}, 0)`)
          .each(function(d) {
            d3.select(this).call(d3.axisLeft().scale(y[dim]));
          })
          .append('text')
          .style('text-anchor', 'middle')
          .attr('y', -9)
          .text(dim.replace(' Bracket', ''))
          .style('fill', 'black');
      });

      // Add point labels for each line (below the dots)
      svg.selectAll('.line-label')
        .data(this.data)
        .enter()
        .append('g')
        .each(function(d) {
          dimensions.forEach(dim => {
            svg.append('text')
              .attr('x', x(dim))
              .attr('y', y[dim](d[dim]) + 15)
              .text(d[dim])
              .style('text-anchor', 'middle')
              .style('fill', 'black')
              .style('font-size', '10px');
          });
        });
    }
  }
};
</script>

<style scoped>
.chart-container {
  background-color: white;
  padding: 20px;
  position: relative;
}

/* Force black font color for all text inside chart-container */
.chart-container h2,
.chart-container g text,
.chart-container text,
.chart-container .legend {
  color: black !important;
}

/* This is the enclosing box for the entire chart including the legend */
.chart-box {
  background-color: white;
  padding: 20px;
  border: 1px solid black; /* Black border around the chart */
  position: relative;
  margin-top: 10px; /* Adds some spacing below the title */
}

/* Legend Styling */
.legend-box {
  background-color: white;
  padding: 10
}

.legend-box {
  background-color: white;
  padding: 10px;
  width: 900px;
  border: 1px solid black; /* Box around the legend */
  position: absolute;
  top: 10px;  /* Place it inside the chart-box */
  right: 10px; /* Align it to the right */
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

.legend-item span {
  font-size: 12px;
  color: black !important; /* Force font color to black */
}
</style>
