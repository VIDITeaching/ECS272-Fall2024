import BarChart from './components/BarChart';
import Sankey from './components/Sankey';
import Notes from './components/Notes';
import { NotesWithReducer, CountProvider } from './components/NotesWithReducer';
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import LineChart from './components/LineChart';
import Notes2 from './components/Notes2';
import Notes3 from './components/Notes3';

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
    <Grid 
      container 
      spacing={4}
      justifyContent='center' 
      alignItems='center' 
      id="main-container" 
      flexDirection={'row'}
      style={{ minHeight: '100vh', padding: '20px' }} 
    >
      <Grid item xs={12}>
        <h1 style={{ textAlign: 'center' }}>Student Mental Health Visualization Dashboard</h1>
        <h4 style={{ textAlign: 'center' }}>By Mahima Rudrapati UID: 924165953</h4>
      </Grid>

      {/* LineChart section */}
      <Grid 
        item xs={12} 
        style={{ display: 'flex', justifyContent: 'center', minHeight: '400px' }}
      >
          <LineChart />
    
      </Grid>
      <Grid item xs={12} style={{ width: '65%', margin: '0 auto' }}>
        <Notes msg={"Overall Data Analysis: Line Chart"} />
      </Grid>

      {/* BarChart section */}
      <Grid 
        item xs={12} 
        style={{ display: 'flex', justifyContent: 'center', minHeight: '400px' }}
      >
          <BarChart />
      </Grid>
      <Grid item xs={12} style={{ width: '65%', margin: '0 auto' }}>
        <Notes2 msg={"Fundamental chart: Bar Chart"} />
      </Grid>

      {/* Sankey diagram section */}
      <Grid 
        item xs={12} 
        style={{ display: 'flex', justifyContent: 'center', minHeight: '400px' }}
      >
        <div style={{ width: '80%', maxWidth: '800px' }}>
          <Sankey />
        </div>
      </Grid>
      <Grid item xs={12} style={{ width: '65%', margin: '0 auto' }}>
        <Notes3 msg={"Advanced chart: Sankey Diagram"} />
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
