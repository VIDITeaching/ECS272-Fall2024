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

<!--This is using the grid component from Vuetify to do layout design -->
<template>
  <v-container id="chart-container" fluid class="bg-teal">
    <v-card :color="secondary" class="ma-2 pa-4">

    <!--My title -->
      <v-row no-gutters align="center">
        <v-col align="center">
          <v-card-title>
            <div>
              <h3 class="headline pink--text text--accent-2">Student Mental Health Visualized Analysis</h3>
              <div>Connecting mental disorders with gender, age, year of study, cgpa, and martial status</div>
            </div>
          </v-card-title>
        </v-col>
      </v-row>
    
    <!--Visualization Container -->
      <!--Diagram 1 (left) -->
      <v-row>
        <v-card>
          <v-col cols=auto align="start">
            <v-row no-gutters align="center">
              <v-col align="center">
                <v-card-title>
                    <h4 class="headline pink--text text--accent-2">Number of Student and Mental State</h4>
                </v-card-title>
              </v-col>
            </v-row>
            <Example />
          </v-col>
        </v-card>

      <!--Diagram 2&3 (right) -->
        <v-col cols=auto>
          <v-card> 
            <v-row no-gutters align="center">
              <v-col align="center">
                <v-card-title>
                    <h4 class="headline pink--text text--accent-2">Parallel Sets</h4>
                </v-card-title>
              </v-col>
            </v-row>
            <Example2 />
          </v-card> 
          
          <v-row no-gutters>
            <v-col cols=auto>
              <v-card> 
                <v-row no-gutters align="center">
                  <v-col align="center">
                    <v-card-title>
                        <h4 class="headline pink--text text--accent-2">Distribution of Student by CGPA</h4>
                    </v-card-title>
                  </v-col>
                </v-row>
                <Example3 />
              </v-card> 
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card>
    
    <!--Testing for future-->
    <v-row no-gutters class="bg-teal">
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