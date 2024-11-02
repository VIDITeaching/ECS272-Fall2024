import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import WorldMap from './components/WorldMap';
import ParallelCoordinatesPlot from './components/ParallelCoordinatesPlot';
import BumpChart from './components/BumpChart';
import Histogram from './components/Histogram';

// Adjust the color theme for material ui
const theme = createTheme({
  palette: {
    primary:{
      main: grey[700],
    },
    secondary:{
      main: grey[700],
    }
  },
})



function Layout() {
  const [selectedGender, setSelectedGender] = useState("Women");

  return (
    
    <Grid
      container
      spacing={2}
      direction="column" 
    >
      {/* First Row: Geographical Map and Right Section side by side */}
      <Grid item container xs={12} id="main-container">
        {/* Left: Geographical Map */}
        <Grid item xs={12} md={7} id="map-container" style={{ width: '100%', height: '100%' }}>
          <h2>2024 Paris Swimming Olympics Dashboard - Yueqiao Chen</h2>
          <WorldMap style={{ width: '100%', height: '100%' }} />
        </Grid>
        {/* Right: Histogram and Parallel Coordinates Plot */}
        <Grid item xs={12} id="parallel-plot-container" md={5} direction="column">
          {/* Right Section: Histogram at the top, Parallel Plot at the bottom */}
          {/* Histogram */}
          <Grid item xs={12} id="histogram-container" >
            <Histogram style={{ width: '100%', height: '100%' }} 
            selectedGender={selectedGender} />
          </Grid>

            {/* Parallel Coordinates Plot*/}
          <Grid item xs={12} style={{ flexGrow: 1}}>
            <BumpChart style={{ width: '100%', height: '100%' }} selectedGender={selectedGender} setSelectedGender={setSelectedGender} />
          </Grid>

        </Grid>
      </Grid>
    </Grid>
)};


// For how Grid works, refer to https://mui.com/material-ui/react-grid/

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Layout />
    </ThemeProvider>
  )
}

export default App
