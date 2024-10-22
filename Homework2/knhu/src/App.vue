<script lang="ts">
import ParallelCoordinates from './components/ParallelCoordinates.vue';
import PieChart from './components/PieChart.vue';
import BarChart from './components/BarChart.vue';

export default {
  components: {
    ParallelCoordinates,
    BarChart,
    PieChart,
  }
}
</script>

<!-- This is using the grid component from Vuetify to do layout design -->
<template>
  <v-container id="main-container" class="d-flex flex-column flex-nowrap" fluid>
    <v-row no-gutters>
      <v-col cols="5">
        <BarChart />
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col>
        <ParallelCoordinates msg="This is a message sent from App.vue as component property"/>
        <PieChart msg="This is a message sent from App.vue as component property"/> 
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
#main-container {
  height: 100%;
}
</style>
