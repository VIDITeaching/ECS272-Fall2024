import { defineStore } from 'pinia';

interface GlobalState {
    chosenState: string;
  }

export const useGlobalStore = defineStore('global', {
  state: () => ({
    chosenState: 'Overall' // default pick Overall
  }),

  actions: {
    setGlobalVar(newValue: string) {
      this.chosenState = newValue;
    }
  }
});