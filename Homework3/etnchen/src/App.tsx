import Example from './components/Example';
import BarChart from './components/BarChart';
import Pie from './components/Pie';
import Sankey from './components/Sankey'; // Ensure this component is correctly named
import Notes from './components/Notes';
import { NotesWithReducer, CountProvider } from './components/NotesWithReducer';
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import { Typography } from '@mui/material';
import Paper from '@mui/material/Paper'; // Correct import
import { useEffect, useState } from 'react';

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
// Define the type for the selected country, could be null or string
type Country = string | null;

// Define the props type for BarChart and Sankey components
interface BarChartProps {
  onBarClick: (country: string[]) => void;
}

interface SankeyProps {
  selectedCountry: Country;
}
// For how Grid works, refer to https://mui.com/material-ui/react-grid/

function Layout() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  // Handler to update selected country when a bar is clicked
  const handleBarClick = (country: string) => {
    setSelectedCountries((prevCountries) =>
      prevCountries.includes(country)
        ? prevCountries.filter((c) => c !== country) // Remove if already selected
        : [...prevCountries, country] // Add if not already selected
    );

  };

  useEffect(() => {
    console.log("Selected Countries:", selectedCountries);
  }, [selectedCountries]); // Dependency on selectedCountries

  return (
    <Grid container spacing={2} direction='column' id="main-container" >
      
      {/* Main Visualizations */}
      <Grid container item spacing={2}>
        {/* Sankey Section on the left */}
        <Grid item xs={12} sm={6}>
          <Paper elevation={3} style={{ padding: '16px', height: '100%' }}>
            <Typography variant="h6" >Bar Chart Overview -- clickable</Typography>
              <BarChart onBarClick={handleBarClick} />
          </Paper>
        </Grid>

        {/* Bar Chart and Pie Chart on the right, stacked */}
        <Grid item xs={12} sm={6}>  
          <Grid container direction="column" spacing={2}>
            {/* Bar Chart */}
            <Grid item xs={12} style={{ flex: 1 }}>
              <Paper elevation={3} style={{ padding: '16px', height: '100%' }}>
                <Typography variant="h6">Total Medal Counts</Typography>
                <Sankey selectedCountries={selectedCountries} />
                </Paper>
            </Grid>
            {/* Pie Chart */}
            <Grid item xs={12} style={{ flex: 1 }}>
              <Paper elevation={3} style={{ padding: '16px', height: '100%' }}>
                <Typography variant="h6">Medal Distribution -- clickable</Typography>
                <Pie />
              </Paper>
            </Grid>
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
  )
}

export default App
