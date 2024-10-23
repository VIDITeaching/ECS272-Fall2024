// src/App.tsx
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import { grey } from '@mui/material/colors';
import BarChartOverview from './components/BarChartOverview';
import ScatterPlot from './components/HexbinPlot';
import ParallelCoordinatesPlot from './components/ParallelCoordinatesPlot';

// Adjust the color theme for material UI
const theme = createTheme({
  palette: {
    primary: {
      main: grey[700],
    },
    secondary: {
      main: grey[700],
    },
  },
});

function Layout() {
  return (
    <Grid container spacing={2} direction='column' id="main-container">
      <Grid item xs={12}>
        <BarChartOverview />
      </Grid>
      <Grid item xs={12}>
        <ScatterPlot />
      </Grid>
      <Grid item xs={12}>
        <ParallelCoordinatesPlot />
      </Grid>
    </Grid>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Layout />
    </ThemeProvider>
  );
}

export default App;
