import React from 'react';
import BubbleChart from './components/BubbleChart'; 
import BarChart from './components/BarChart'; 
import ParallelCoordinatesPlot from './components/ParallelCoordinatesPlot'; 
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';

const theme = createTheme({
  palette: {
    primary: {
      main: grey[700],
    },
    secondary: {
      main: grey[700],
    }
  },
});

function Layout() {
  return (
    <Grid container style={{ height: '100vh' }} direction="row">
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <div style={{ textAlign: 'center', paddingTop: '5px' }}>
          <h2>Parallel Coordinates</h2>
          <ParallelCoordinatesPlot />
        </div>
      </Grid>

      <Grid item xs={12} sm={12} md={12} lg={12}>
        <Grid container style={{ height: '100%' }}>
          <Grid item xs={6} sm={6} md={6} lg={6}>
            <div style={{ textAlign: 'center', paddingTop: '5px' }}>
              <h2>Parental Education vs Student Grades </h2>
              <BubbleChart />
            </div>
          </Grid >
          <Grid item xs={6} sm={6} md={6} lg={6}>
            <div style={{ textAlign: 'center', paddingTop: '5px' }}>
              <h2>Parental Education vs Alcohol Consumption</h2>
              <BarChart />
            </div>
          </Grid>
        </Grid>
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