import Example from './components/Example'
import Notes from './components/Notes'
import ParallelPlots from './components/ParallelPlots'
import Header from './components/Header'
import ScatterPlot from './components/ScatterPlot'
import HeatmapPlot from './components/HeatmapPlot'
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
    <div>
      <div style={{ width: '100%', height: '100%'}}>
      <Header />
      </div>
      <Grid container spacing={3} direction='column' id="main-container">
        <Grid container item xs={6} sm={6} md={6} lg={6}>
          <Grid item xs={12} sm={12} md={12} lg={12} className="plot">
            <div style={{ width: '100%', height: '100%', border: "2px solid"}}> 
              <ParallelPlots />
            </div>
          </Grid>
        </Grid>
          <Grid container item xs={6} sm={6} md={6} lg={6} spacing={2}>
            <Grid item xs={6} sm={6} md={6} lg={6}>
              <ScatterPlot />
            </Grid>
            <Grid item xs={6} sm={6} md={6} lg={6}>
              <HeatmapPlot />
            </Grid>
            <Grid item xs={6} sm={6} md={6} lg={6} />
          </Grid>
      </Grid>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Layout />
    </ThemeProvider>
  )
}

export default App
