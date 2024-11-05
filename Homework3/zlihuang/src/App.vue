<script lang="ts">

import Notes from './components/Notes.vue'
import NotesWithStore from './components/NotesWithStore.vue'
import BarChart from './components/BarChart.vue'
import ScatterPlot from './components/ScatterPlot.vue'
import SankeyChart from './components/SankeyChart.vue'
interface BarHoverData {
    type: 'Dalc' | 'Walc';
    level: string;
}
export default {
  components: {
    Notes,
    NotesWithStore,
    BarChart,
    ScatterPlot,
    SankeyChart,
  },
  data() {
    return {
      filteredScatterData: undefined as BarHoverData | undefined,
      highlightedNode: undefined as BarHoverData | undefined
    };
  },
  methods: {
    updateData(data: BarHoverData) {
      this.filteredScatterData = data;
      this.highlightedNode = data;
    },
  }
}
</script>

<template>
  <v-container id="main-container" class="d-flex flex-column justify-space-between">
    <v-row style="height:5%;">
      <label style="font-weight: bold;font-size: 26px;">Impact of drinking habits on academic performance</label>
    </v-row>
    <v-row no-gutters class="flex-grow-1" style="height: 65%;position: relative;">
      <v-col cols="6" class="d-flex" >
        <BarChart @bar-hover="updateData" />
        <textarea style="position: absolute; bottom:30px; left: 0; width: 50%;height: 190px;font-size: 14px;" disabled>Explanation(It needs time to load):
1.Hang on the bar, the scatter will  delete other scatter of
the same type, the sankey will highlight relevant node and links with animation
2. Hang on the bar,it will show the amount.Hang on the scatter point, it will 
show the x-value,y-value and how many people(count).Hang  on the nodes, it will
highlight relevant links and hang on the links, it will  show the Percentage of 
a single link to two adjacent nodes.
3. Grade category: good:>15  mid:>10  bad:Remaining
        </textarea>
      </v-col>
      <v-col cols="6" class="d-flex">
        <ScatterPlot :filteredData="filteredScatterData"/>
      </v-col>
    </v-row>
    <v-row no-gutters class="flex-grow-1" style="height: 35%;">
        <v-col cols="12">
            <SankeyChart :highlightedNode="highlightedNode"/>
        </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
#main-container {
    height: 100vh;
    overflow: hidden;
}

.v-row > .v-col {
    height: 100%; 
}
html, body {
    height: 100%;
    overflow: hidden; /* Prevent scrolling on the entire page */
}
</style>