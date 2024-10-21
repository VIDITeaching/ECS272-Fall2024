import BarChart from './components/BarChart'
import Parallel from './components/Parallel'
import Dendrogram from './components/Dendrogram'
import Notes from './components/Notes'
import { NotesWithReducer, CountProvider } from './components/NotesWithReducer';
import {Grid, Divider} from '@mui/material';
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
    <Grid container id="main-container" style={{ height: '100vh', flexDirection: 'column' }}>
  {/* Top section containing BarChart and Parallel */}
  <Grid container item style={{ height: '50%'}}>
    {/* BarChart in the top-left quarter */}
    <Grid item xs={5}>
      <BarChart  />   
    </Grid>
    <Divider orientation="vertical" sx={{ height: '100%', width: '2px', bgcolor: 'black' }} />
    {/* Parallel in the top-right quarter */}
    <Grid item xs={6}>
      <Parallel/>
    </Grid>
  </Grid>
  <Divider sx={{ 
        width: '100%', 
        height: '4px', // Thickness
        bgcolor: 'black' // Darker color
      }} /> 
  {/* Dendrogram taking 40% of the screen height */}
  <Grid container item style={{ height: '45%', overflow: 'hidden' }}>
    <Grid item xs={12} style={{ height: '100%' }}>
      <Dendrogram />
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
