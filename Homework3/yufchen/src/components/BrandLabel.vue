<script lang="ts">
  import { defineComponent } from 'vue';
  
  export default defineComponent({
    name: 'BrandColors',
    data() {
      return {
        brands: {
          Ford: '#1f77b4',
          Chevrolet: '#2ca02c',
          Nissan: '#d62728',
          Toyota: '#e377c2',
          Dodge: '#9467bd',
          Honda: '#8c564b',
          Hyundai: '#7f7f7f',
          BMW: '#ff7f0e',
          Benz: '#3a4566',
          Infiniti: '#ede139',
          Kia: '#39e4ed',
          Lincoln: '#3409e0',
        }
      };
    }
  });
</script>

<template>
  <div class="brand-colors">
    <div v-for="(color, brand) in brands" :key="brand" class="brand-row">
      <div :style="{ backgroundColor: color }" class="color-square"></div>
      <span>{{ brand }}</span>
    </div>
  </div>
</template>
  
<style scoped>
  .brand-colors {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .brand-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    margin-top: 10px;
  }

  .color-square {
    width: 20px;
    height: 20px;
    margin-right: 10px;
  }
</style>