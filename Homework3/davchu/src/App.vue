<script lang="ts">
import PieChart from './components/PieChart.vue';
import Sankey from './components/Sankey.vue';
import BarChart from './components/BarChart.vue';
import { Bar } from 'vue-chartjs';

export default {
  components: {
    BarChart,
    PieChart,
    Sankey,
  },
  data() {
    return {
      selectedState: null, // No state selected initially
    };
  },
  methods: {
    onStateSelected(state: string) {
      this.selectedState = state; // Update the selected state when a state is clicked on the bar chart
    },
  },
};
</script>

<!-- This is using the grid component from Vuetify to do layout design -->
<template>
  <v-container id="main-container" class="dashboard" fluid>
    <v-row no-gutters>
      <!-- BarChart and PieChart in the same row with equal height -->
      <v-col cols="6" class="chart-col">
        <!-- Pass the selected state to BarChart component -->
        <BarChart @stateSelected="onStateSelected" />
      </v-col>
      <v-col cols="6" class="chart-col">
        <!-- Conditionally render PieChart based on selectedState -->
        <template v-if="!selectedState">
          <!-- Default view or placeholder when no state is selected -->
          <div>
            <!-- You can display a default chart here if desired -->
             <PieChart />
          </div>
        </template>
        <template v-else>
          <!-- Pass the selectedState prop to PieChart -->
          <PieChart :selectedState="selectedState" />
        </template>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col>
        <Sankey />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
#main-container {
  height: 100%;
}

.chart-col {
  display: flex;
  justify-content: center;
  align-items: center;
}

v-col.chart-col {
  height: 400px; /* Or any fixed height you want to set for the charts */
}
</style>
