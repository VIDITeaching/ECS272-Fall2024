<script lang="ts">
// This is used if you're using TypeScript.
import { defineComponent } from 'vue';

// This is the same as NotesWithStore.vue, but written in Vue's option API and without using the store.
export default defineComponent({
  data(): {count: number} { // this is also syntax from TypeScript
    return {
      count: 0
    }
  },
  props: {
    msg: String, // This is the props passed down from the parent component
  },
})
</script>

<!-- The following is showcasing how to use UI components from Vuetify-->
<template>
  <v-card class="ma-2 pa-4">
    <h3 class="ma-2">{{ msg }}</h3>

    <v-divider class="pt-1 pb-1"/>
    <p class="pb-1">
      Edit
      <code>components/Notes.vue</code> to try different UI components from Vuetify
    </p>

    <v-card-text>
      This template uses Vuetify 3, a UI library based on Google's Material Design that can help you design the layout and populate template components in a consistent style.<br />
    </v-card-text>

    <v-btn @click="count++" elevation="2">
      Have clicked this {{ count }} times
    </v-btn>
  </v-card>

</template>

<style scoped>
</style>
