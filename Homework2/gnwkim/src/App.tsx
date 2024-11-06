// import Example from './components/Example'
// import Test from './components/StackedBarChart'
// import Notes from './components/Notes'
// import { NotesWithReducer, CountProvider } from './components/NotesWithReducer';
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import StackedBarChart from './components/StackedBarChart';
import { ThemeContext } from '@emotion/react';
import ScatterPlot from './components/ScatterPlot';
import ParallelSet from './components/ParallelSet';
import StartWindow from './components/StartWindow';

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


// temporary for testing
const FillingComponent = () => {
  return (
    <div style={{border: '1px solid black', height: '100%'}}>
      <svg width='100%' height='100%' />
    </div>
  )
}

function Layout() {


  return (
    <>
      <StartWindow/>
      <Grid 
        container 
        spacing={1} 
        direction='row' 
        id="main-container"
        paddingTop={1}
        paddingLeft={1}
      >

        {/* left */}
        <Grid container item spacing={1} direction='column' xs={5}>

          {/* top */}
          <Grid item xs={6}>
            <StackedBarChart start={0} end={15}/>
          </Grid>

          {/* bottom */}
          <Grid item xs={6}>
            <ScatterPlot/>
          </Grid>
        </Grid>
        
        
        {/* right */}
        <Grid item xs={7}>
          <ParallelSet countries={['LCA', 'DMA', 'ALB']}/>
        </Grid>
      </Grid>
    </>
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
