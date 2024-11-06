<script lang="ts">

import { ref, onMounted, onUnmounted } from 'vue';
import USMap from './components/USMap.vue'
import TreeMap from './components/TreeMap.vue'
import BrandLabel from './components/BrandLabel.vue'
import HistogramChart from './components/HistogramChart.vue'

export default {
  components: {
    USMap,
    TreeMap,
    BrandLabel,
    HistogramChart,
  },

  setup() {
    const scale = ref(1);

    const updateScale = () => {
      const width = window.innerWidth;
      scale.value = width / 1650; // Adjust 1920 to your base width for scaling
    };

    onMounted(() => {
      window.addEventListener('resize', updateScale);
      updateScale(); // Set initial scale
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateScale);
    });

    return { scale };
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

      <v-col cols="1">
        <TreeMap msg="Top Make"/>
      </v-col>

      <v-col cols="9">
        <HistogramChart msg="Top Seller"/>
        <USMap msg="Top Selling Make in Each States"/>
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
