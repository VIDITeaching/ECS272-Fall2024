import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { Box } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import VennDiagramComponent from './components/VennDiagramC';
import HeatMap from './components/HeatMap';
import Sankey from './components/Sankey';

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
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState('Depression');

  return (
    <Grid
      container
      spacing={0.5}
      justifyContent="center"
      alignItems="flex-start"
      id="main-container"
      style={{ padding: '0px', maxWidth: '1200px', margin: '0 auto' }}
    >
      {/* Heading Section */}
      <Grid item xs={12}>
      <h1 style={{ textAlign: 'center', marginBottom: '5px' }}>
        Analysis of Student Mental Health Conditions with Academics
      </h1>
      <h4 style={{ textAlign: 'center', color: grey[700], marginTop: '0' }}>
        By Mahima Rudrapati UID: 924165953
      </h4>
      <Box display="flex" justifyContent="center">
        <Button
          variant="contained"
          color="primary"
          style={{ width: '100px', height: '30px', fontSize: '14px' }}
          onClick={() => setSelectedRegion(null)}
        >
          Reset
        </Button>
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        sx={{
          mt: '10px', 
          mb: '4px',
          gap: '1px', 
        }}
      >
        <p style={{ fontSize: '12px', margin: 0 }}>Hover over different regions of the chart to know more!</p>
        <p style={{ fontSize: '12px', margin: 0 }}>Click on the Venn diagram to have more control over the subsets of mental conditions.</p>
      </Box>
    </Grid>

      {/* Left Column for Venn Diagram and Heat Map */}
      <Grid
        item
        xs={12}
        md={6}
        container
        direction="column"
        alignItems="center"
        spacing={3}
      >
        {/* Reset Button */}

        <Grid item style={{ width: '100%', maxWidth: '900px' }}>
          <VennDiagramComponent
            selectedRegion={selectedRegion}
            onRegionClick={(regionCode) => setSelectedRegion(regionCode)}
          />
        </Grid>

        {/* Heat Map */}
        <Grid item style={{ width: '100%', maxWidth: '900px' }}>
          <HeatMap selectedRegion={selectedRegion} />
        </Grid>
      </Grid>

      {/* Right Column for Sankey Chart */}
      <Grid
        item
        xs={12}
        md={6}
        container
        direction="column"
        alignItems="center"
        spacing={3}
      >
        <Grid item style={{ width: '100%', maxWidth: '1000px' }}>
          {/* Dropdown */}
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <label htmlFor="condition-select">Select Mental Condition: </label>
            <select
              id="condition-select"
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
            >
              <option value="Depression">Depression</option>
              <option value="Panic attack">Panic attack</option>
              <option value="Anxiety">Anxiety</option>
            </select>
          </div>
          <Sankey selectedCondition={selectedCondition} />
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
