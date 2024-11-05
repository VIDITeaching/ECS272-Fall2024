<script lang="ts">

import Notes from './components/Notes.vue'
import NotesWithStore from './components/NotesWithStore.vue'
import Example from './components/Example.vue'
import BarChart from './components/BarChart.vue'
import ScatterPlot from './components/ScatterPlot.vue'
import ParallelCoordinatePlot from './components/ParallelCoordinatePlot.vue'
export default {
  components: {
    Notes,
    Example,
    NotesWithStore,
    BarChart,
    ScatterPlot,
    ParallelCoordinatePlot,
  }
}
</script>

<!--This is using the grid component from Vuetify to do layout design-->
<template>
  <v-container id="main-container" class="d-flex flex-column" fluid>
    <v-row no-gutters>
      <v-col cols="5" class="d-flex">
        <BarChart/>
      </v-col>
      <v-col cols="5" class="d-flex" style="margin-left: 5%;">
        <ScatterPlot/>
      </v-col>
    </v-row>
    <v-row class="flex-grow-0" style="margin-top: auto;">
      <v-col cols="12">
        <ParallelCoordinatePlot />
      </v-col>
    </v-row>
    <!-- <v-row no-gutters>
      <v-col>
        <Notes msg="This is a message sent from App.vue as component property"/>
      </v-col>
    </v-row> -->
  </v-container>
</template>

<style scoped>
#main-container{
  height: 100%;
}
</style>