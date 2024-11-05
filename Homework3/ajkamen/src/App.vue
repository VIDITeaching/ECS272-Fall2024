<template>
  <div id="app">
    <div v-if="csvData" class="visualization-container">
      <component :is="currentVisualization" :data="csvData" />
      <div class="button-bar">
        <button @click="currentVisualization = 'Visualization1'">Vis 1</button>
        <button @click="currentVisualization = 'Visualization2'">Vis 2</button>
        <button @click="currentVisualization = 'Visualization3'">Vis 3</button>
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
      currentVisualization: 'Visualization1', // Start with the first visualization
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
  justify-content: center;
  align-items: center;
}

.visualization-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80%;
  max-width: 600px; /* Adjust based on the size you want */
}

.button-bar {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

button {
  padding: 8px 16px;
  cursor: pointer;
}

button:focus {
  outline: none;
}
</style>
