<script lang="ts">

import Notes from './components/Notes.vue'
import NotesWithStore from './components/NotesWithStore.vue'
import Example from './components/Example.vue'
import Example2 from './components/Example2.vue'
import Example3 from './components/Example3.vue'

export default {
  components: {
    Notes,
    Example,
    Example2,
    Example3,
    NotesWithStore,
  }
}
</script>

<!--This is using the grid component from Vuetify to do layout design-->
<template>
  <v-container id="chart-container" fluid>
    <v-row no-gutters align="start">
      <v-col cols=auto>
        <Example />
      </v-col>
    </v-row>
    <v-row no-gutters align="end">
      <v-col cols=auto order=1>
        <Example2 />
      </v-col>
      <v-col cols=auto order=2>
        <Example3 />
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col>
        <Notes msg="This is a message sent from App.vue as component property"/>
        <NotesWithStore msg="This is a message sent from App.vue as component property"/>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
#main-container{
  height: 100%;
  width: 100%;
}
</style>