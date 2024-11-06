<script lang="ts">

import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useGlobalStore } from './stores/store';
import USMap from './components/USMap.vue'
import TreeMap from './components/TreeMap.vue'
import BrandLabel from './components/BrandLabel.vue'
import HistogramChart from './components/HistogramChart.vue'
import AreaStackGraph from './components/AreaStackGraph.vue'

export default {
  components: {
    USMap,
    TreeMap,
    BrandLabel,
    HistogramChart,
    AreaStackGraph
  },

  setup() {
    const scale = ref(1);

    const globalState = useGlobalStore();

    const updateScale = () => {
      const width = window.innerWidth;
      scale.value = width / 1650; // Adjust 1920 to your base width for scaling
    };

    const treeMapMsg = computed(() => `${globalState.chosenState} Top Make`);

    onMounted(() => {
      window.addEventListener('resize', updateScale);
      updateScale(); // Set initial scale
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateScale);
    });

    return { scale, globalState, treeMapMsg };
  }
}
</script>

<!--This is using the grid component from Vuetify to do layout design-->
<template>
  <v-container id="main-container" class="scale-container" fluid :style="{ transform: `scale(${scale})` }">
    <v-row no-gutters>
      <v-col cols="2">
        <BrandLabel />
      </v-col>

      <v-col cols="3">
        <TreeMap :msg="treeMapMsg"/>
      </v-col>

      <v-col cols="7">
      <!-- <v-col>  -->
        <AreaStackGraph msg="Top Make Total Selling Price over time"/>
        <USMap msg="Top Selling Make in Each States (click each states to toggle the chart, no data for white states)"/>
      </v-col>
    </v-row>

  </v-container>
</template>

<style scoped>
  #main-container{
    height: 100%;
  }
  .scale-container {
    transition: transform 0.3s ease-in-out; 
    transform-origin: top left;
  }
</style>
