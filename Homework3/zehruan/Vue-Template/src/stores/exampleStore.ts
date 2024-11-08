// exampleStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useStore = defineStore('exampleStore', () => {
  const count = ref(0);
  const myGlobalVariable = ref('depression'); // Initialize with a default value

  const increment = () => {
    count.value++;
  };

  return {
    count,
    myGlobalVariable,
    increment,
  };
});
