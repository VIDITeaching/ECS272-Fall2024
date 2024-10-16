<template>
  <div id="app">
    <h1>CSV Visualizations</h1>
    <!-- Only render visualizations if csvData is not null -->
    <div v-if="csvData">
      <Visualization1 :data="csvData" />
      <Visualization2 :data="csvData" />
      <Visualization3 :data="csvData" />
    </div>
    <div v-else>
      Loading data...
    </div>
  </div>
</template>

<script>
import Visualization1 from './components/Visualization1.vue';
import Visualization2 from './components/Visualization2.vue';
import Visualization3 from './components/Visualization3.vue';
import { parseCSV } from './utils/csvParser';

export default {
  components: {
    Visualization1,
    Visualization2,
    Visualization3,
  },
  data() {
    return {
      csvData: null,
    };
  },
  mounted() {
    this.loadCSV();
  },
  methods: {
    loadCSV() {
      console.log("Fetching CSV data...");
      fetch('/data/financial_risk_assessment.csv')
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.text();
        })
        .then(csv => {
          console.log("CSV data fetched, parsing...");
          this.csvData = parseCSV(csv);
          console.log("CSV parsed:", this.csvData);
        })
        .catch(err => console.error('Error loading CSV:', err));
    },
  },
};
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  text-align: center;
}
</style>

