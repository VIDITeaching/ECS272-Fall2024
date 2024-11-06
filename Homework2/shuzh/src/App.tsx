import ParallelCoordinates from './components/Dashboard'
import Vis1 from './components/Vis1'
import Vis2 from './components/Vis2'
import Notes from './components/Notes'
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
    <Grid container spacing={1} direction='column' id="main-container">
      <Grid container item xs={6} sm={6} md={6} lg={6}>
        <Grid item xs={5} sm={5} md={5} lg={5}>
          <ParallelCoordinates />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, marginRight: '10px' }}> {/* Optional margin between the components */}
            <Vis1 />
          </div>
          <div style={{ flex: 1, marginLeft: '10px' }}>
            <Vis2 />
          </div>
        </div>
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
