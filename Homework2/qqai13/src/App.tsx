import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import DonutChart from './components/donut';
import BarChart from './components/bar';
import SunburstContainer from './components/sunburstcontainer';
import SankeyDiagram from './components/sankey';
// import SankeyDiagram from './components/sankey';

// Adjust the color theme for Material UI
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
    <div style={{display: 'flex' , justifyContent: 'center'}}>
      <Grid 
        container 
        direction="row" // Stack items vertically
        spacing={2}
        style={{ height: '200vh', width: '90vw', marginTop: '20px' , justifyContent: 'center'}} 
        id="main-container"
      >
        <Box
          component="section"
          sx={{
            width: '80%',
            height: 100,
            borderRadius: 3,
            marginTop: 20,
            fontFamily: 'monospace',
            bgcolor: '#FFE6E8',
            textAlign: 'center', 
            display: 'flex',    
            justifyContent: 'center',  
            alignItems: 'center',    
            '&:hover': {
              bgcolor: '#FEA3AA',
            },
          }}
        >
          This Homework is for ECS 272 Information Visualization. 
          Made by Hsin-Ai(Teresa) Chen. ID: 924170896
        </Box>

        {/* Bar Chart */}
        <Grid 
          item 
          xs={12}
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            // backgroundColor: 'lightgreen',
            borderRadius: 20,
            borderWidth: 5,
            borderStyle: 'solid',
            marginTop: 30,
            flexGrow: 1,  // Allow the item to grow and take up vertical space
          }}
        >
          <div style={{ width: '90%', height: '100%' }}>
            <BarChart />
          </div>
        </Grid>
        {/* Donut Chart */}
        <Grid 
          item 
          xs={12} // Make sure the item expands based on available space
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            // backgroundColor: 'lightblue',
            borderRadius: 20,
            borderWidth: 5,
            borderStyle: 'solid',
            marginTop: 30,
            flexGrow: 1,  // Allow the item to grow and take up vertical space
          }}
        >
          <div style={{ width: '90%', height: '100%' }}>
            <SankeyDiagram />
          </div>
        </Grid>

        

        {/* Sunburst Chart */}
        <Grid 
          item 
          xs={12}
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            // backgroundColor: 'lightcoral',
            borderRadius: 20,
            borderWidth: 5,
            borderStyle: 'solid',
            marginTop: 30,
            flexGrow: 1,  // Allow the item to grow and take up vertical space
          }}
        >
          <div style={{ width: '90%', height: '100%' }}>
            <SunburstContainer />
          </div>
        </Grid>
      </Grid>
    </div>
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
