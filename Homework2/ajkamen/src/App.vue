<template>
  <div id="app">
    <h1>CSV Visualizations</h1>
    <div v-if="csvData" class="grid-container">
      <div class="grid-item vis1">
        <Visualization1 :data="csvData" />
      </div>
      <div class="grid-item vis2">
        <Visualization2 :data="csvData" />
      </div>
      <div class="grid-item vis3">
        <Visualization3 :data="csvData" />
      </div>
    </div>
    <div v-else>Loading data...</div>
  </div>
</template>

<script>
import Visualization1 from './components/Visualization1.vue'
import Visualization2 from './components/Visualization2.vue'
import Visualization3 from './components/Visualization3.vue'
import { parseCSV } from './utils/csvParser'

export default {
  components: {
    Visualization1,
    Visualization2,
    Visualization3,
  },
  data() {
    return {
      csvData: null,
    }
  },
  mounted() {
    this.loadCSV()
  },
  methods: {
    loadCSV() {
      fetch('/data/financial_risk_assessment.csv')
        .then(response => response.text())
        .then(csv => {
          this.csvData = parseCSV(csv)
        })
        .catch(err => console.error('Error loading CSV:', err))
    },
  },
}
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  text-align: center;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    'vis1 vis2'
    'vis3 vis3';
  gap: 20px;
  padding: 20px;
  width: 100%;
  height: 100%;
}

/* Remove the background-color and border */
.grid-item {
  padding: 10px; /* Optionally, you can remove this padding as well */
  box-shadow: none; /* Remove shadow effect */
}

.vis1 {
  grid-area: vis1;
}

.vis2 {
  grid-area: vis2;
}

.vis3 {
  grid-area: vis3;
  justify-self: center; /* Center it horizontally */
  width: 80%; /* Allow it to take full width, but .chart-box will control the internal size */
}

@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr;
    grid-template-areas:
      'vis1'
      'vis2'
      'vis3';
  }
}
</style>
