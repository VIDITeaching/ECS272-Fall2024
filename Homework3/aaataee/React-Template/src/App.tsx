import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import StreamPlot from './components/StreamPlot';
import ScatterPlot from './components/ScatterPlot';
import ParallelCoordinates from './components/ParallelCoordinate';
import { useEffect, useState } from 'react';
import { VehicleData } from './types';
import { LoadData } from './tools/LoadData';
import FilterComponent from './components/FilterComponent';

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

function Layout({ data }: { data: VehicleData[] }) {
  return (
    <Grid container spacing={2} id="main-container">
      <Grid container item xs={12} sm={12} md={12} lg={12}>
        <Grid item xs={10} sm={10} md={10} lg={10}>
          <ScatterPlot data={data} />
        </Grid>
        <Grid item xs={10} sm={4} md={4} lg={4}>
          <ParallelCoordinates data={data} />
        </Grid>
        <Grid item xs={10} sm={6} md={6} lg={6}>
          <StreamPlot data={data} />
        </Grid>
      </Grid>
    </Grid>
  );
}

function App() {
  const [data, setData] = useState<VehicleData[]>([]);
  const [filteredData, setFilteredData] = useState<VehicleData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const halfData = await LoadData();
      setData(halfData);
      setFilteredData(halfData);  // Initialize filtered data
    };

    fetchData();
  }, []);

  const handleFilterChange = (filters: {
    selectedMakes: string[];
    yearRange: [number, number];
    profitRange: [number, number];
  }) => {
    const { selectedMakes, yearRange, profitRange } = filters;

    const newFilteredData = data.filter(d =>
      (selectedMakes.length === 0 || selectedMakes.includes(d.make)) &&
      d.year >= yearRange[0] &&
      d.year <= yearRange[1] &&
      d.profit >= profitRange[0] &&
      d.profit <= profitRange[1]
    );

    setFilteredData(newFilteredData);
  };

  return (
    <ThemeProvider theme={theme}>
      <FilterComponent
        makes={[...new Set(data.map(d => d.make))]}  // Extract unique makes
        onFilterChange={handleFilterChange}
      />
      <Layout data={filteredData} />
    </ThemeProvider>
  );
}

export default App;