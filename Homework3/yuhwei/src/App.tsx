import React, { useState } from 'react';
import BubbleChart from './components/BubbleChart'; 
import BarChart from './components/BarChart'; 
import SankeyDiagram from './components/SankeyDiagram'; 
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
  
  const [selectedBar, setSelectedBar] = useState('');
  return (
    <Grid container style={{ height: '100vh' }} direction="row">
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <div style={{ textAlign: 'center', paddingTop: '5px' }}>
          <h2>Overview of Parental Education Levels and Students Behavior</h2>
          <SankeyDiagram />
        </div>
      </Grid>

      <Grid item xs={12} sm={12} md={12} lg={12}>
        <Grid container style={{ height: '100%' }}>
          <Grid item xs={6} sm={6} md={6} lg={6}>
            <div style={{ textAlign: 'center', paddingTop: '5px' }}>
              <h2>Parental education relate to Alcohol consumption</h2>
              <BarChart selectedBar={selectedBar} setSelectedBar={setSelectedBar} />
            </div>

          </Grid >
          <Grid item xs={6} sm={6} md={6} lg={6}>
            
            <div style={{ textAlign: 'center', paddingTop: '5px' }}>
              <h2>Parental Education relate to Student Grades </h2>
              <BubbleChart selectedBar={selectedBar}/>
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