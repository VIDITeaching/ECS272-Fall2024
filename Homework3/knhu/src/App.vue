<template>
  <div class="dashboard">
    <div class="bar-chart">
      <BarChart :data="barChartData" />
    </div>
    <div class="scatter-plot">
      <ScatterPlot :data="scatterPlotData" />
    </div>
    <div class="sankey-diagram">
      <SankeyDiagram :data="sankeyData" />
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3-fetch';
import BarChart from './components/BarChart.vue';
import ScatterPlot from './components/ScatterPlot.vue';
import SankeyDiagram from './components/SankeyDiagram.vue';

export default {
  components: { BarChart, ScatterPlot, SankeyDiagram },
  data() {
    return {
      barChartData: [],
      scatterPlotData: [],
      sankeyData: []
    };
  },
  async created() {
    const rawData = await d3.csv('../../data/top_10_car_prices.csv');

    // Transform data for BarChart (Top 10 makes by count)
    const makeCounts = d3.rollup(rawData, v => v.length, d => d.make);
    this.barChartData = Array.from(makeCounts, ([make, count]) => ({ make, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Transform data for ScatterPlot (Odometer vs Selling Price)
    this.scatterPlotData = rawData.map(d => ({
      odometer: +d.odometer,
      sellingprice: +d.sellingprice
    }));

    // Transform data for SankeyDiagram (Make -> Model -> Body)
    this.sankeyData = rawData.map(d => ({
      make: d.make,
      model: d.model,
      body: d.body
    }));
  }
};
</script>

<style scoped>
.dashboard {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: auto;
  gap: 20px;
  padding: 20px;
}

.bar-chart {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
}

.scatter-plot {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
}

.sankey-diagram {
  grid-column: 1 / 3; /* Span across both columns */
  grid-row: 2 / 3;
  margin-top: 20px;
}

/* Responsive adjustments for smaller screens */
@media (max-width: 1200px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
  .bar-chart, .scatter-plot, .sankey-diagram {
    grid-column: 1 / 2;
  }
}

@media (max-width: 768px) {
  .bar-chart, .scatter-plot {
    height: 40vh;
  }
  .sankey-diagram {
    height: 60vh;
  }
}

@media (max-width: 480px) {
  .bar-chart, .scatter-plot {
    height: 35vh;
  }
  .sankey-diagram {
    height: 50vh;
  }
}
</style>
