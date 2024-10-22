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

// For how Grid works, refer to https://mui.com/material-ui/react-grid/

function Layout() {
  return (
    <Grid container spacing={2} direction='column' id="main-container">
      {/* Main Visualizations */}
      <Grid container item spacing={2}>
        {/* Sankey Section on the left */}
        <Grid item xs={12} sm={8}>
          <Paper elevation={3} style={{ padding: '16px', height: '100%' }}>
            <Typography variant="h6">Sankey Overview</Typography>
            <Sankey />
          </Paper>
        </Grid>
  
        {/* Bar Chart and Pie Chart on the right, stacked */}
        <Grid item xs={12} sm={4}>
          <Grid container direction="column" spacing={2}>
            {/* Bar Chart */}
            <Grid item xs={12}>
              <Paper elevation={3} style={{ padding: '16px' }}>
                <Typography variant="h6">Total Medal Counts</Typography>
                <BarChart />
              </Paper>
            </Grid>
            {/* Pie Chart */}
            <Grid item xs={12}>
              <Paper elevation={3} style={{ padding: '16px' }}>
                <Typography variant="h6">Medal Distribution</Typography>
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
