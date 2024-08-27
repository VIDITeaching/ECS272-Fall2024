import { defineStore } from 'pinia'


export const useStore = defineStore('theStore', {
    state: () => ({
        count: 0,
    }),
    actions: {
        increment() {
            console.log('why')
            this.count++;
        }
    }
})