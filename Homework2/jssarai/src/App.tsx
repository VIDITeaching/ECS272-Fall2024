import Scatter from './components/Scatter'
import StreamGraph from './components/Stream'
import Pie from './components/Pie'
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
    <div id="main-container">
      <div className='plot-container1'>
        <StreamGraph />
      </div>
      <div className='row'>
      <div className='plot-container2'>
        <Scatter />
      </div>
        <div className='plot-container3'>
        <Pie />
        </div>
      </div>    

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
