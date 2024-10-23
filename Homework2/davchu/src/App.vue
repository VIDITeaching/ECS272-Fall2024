<script lang="ts">

import Notes from './components/Notes.vue'
import NotesWithStore from './components/NotesWithStore.vue'
import Example from './components/Example.vue'
import PieChart from './components/PieChart.vue'
import ParallelCoord from './components/ParallelCoord.vue'
import BarChart from './components/BarChart.vue'
import { Bar } from 'vue-chartjs'

export default {
  components: {
    Notes,
    NotesWithStore,
    BarChart,
    PieChart,
    ParallelCoord,
  }
}
</script>

<!--This is using the grid component from Vuetify to do layout design-->
<template>
  <v-container id="main-container" class="d-flex flex-column flex-nowrap" fluid>
    <v-row no-gutters>
      <v-col cols="5">
        <BarChart />
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col>
        <PieChart />
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col>
        <ParallelCoord />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
#main-container{
  height: 100%;
}
</style>
