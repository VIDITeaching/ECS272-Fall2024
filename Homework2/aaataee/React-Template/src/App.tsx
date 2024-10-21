import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import Heatmap from './components/Heatmap';
import StreamPlot from './components/StreamPlot';
import ScatterPlot from './components/ScatterPlot';

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

function Layout() {
  return (
    <Grid container spacing={2} id="main-container">
      <Grid container item xs={12} sm={12} md={12} lg={12}>
        <Grid item xs={10} sm={4} md={4} lg={4}>
          <Heatmap />
        </Grid>
        <Grid item xs={10} sm={6} md={6} lg={6}>
          <StreamPlot />
        </Grid>
        <Grid item xs={10} sm={10} md={10} lg={10}>
          <ScatterPlot />
        </Grid>
      </Grid>
    </Grid>
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
