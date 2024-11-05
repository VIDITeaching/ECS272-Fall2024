import Example from './components/Example'
import Notes from './components/Notes'
import Header from './components/Header'
import RingScatterPlot from './components/RingScatterPlot'
import HeatmapPlot from './components/HeatmapPlot'
import StarCoordinatePlot from './components/StarCoordinatePlot'
import { NotesWithReducer, CountProvider } from './components/NotesWithReducer';
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';

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
    <div style={{ width: '100%', height: '100vh', padding: '10px' }}>
      <Header />
      <Grid container spacing={2} id="main-container" sx={{ height: 'calc(100% - 64px)' }}> 
        <Grid container item xs={6} sm={6} md={6} lg={6} sx={{ height: '100%' }}>
          <Grid item xs={12} className="plot" sx={{ height: '100%' }}>
            <div style={{ width: '100%', height: '100%', border: "2px solid" }}> 
              <StarCoordinatePlot />
            </div>
          </Grid>
        </Grid>
        <Grid container item xs={6} spacing={2} direction='column' sx={{ height: '100%' }}>
          <Grid item xs={6} sx={{ height: '49%' }}>
            <div style={{ width: '100%', height: '100%', border: "2px solid" }}>
              <RingScatterPlot />
            </div>
          </Grid>
          <Grid item xs={6} sx={{ height: '49%' }}>
            <div style={{ width: '100%', height: '100%', border: "2px solid" }}>
              <HeatmapPlot />
            </div>
          </Grid>
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
  )
}

export default App
