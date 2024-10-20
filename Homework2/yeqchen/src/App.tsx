import Example from './components/Example'
import Notes from './components/Notes'
import { NotesWithReducer, CountProvider } from './components/NotesWithReducer';
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import WorldMap from './components/WorldMap';
import ParallelCoordinatesPlot from './components/ParallelCoordinatesPlot';
import Histogram from './components/Histogram';

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
    
    <Grid
      container
      spacing={2}
      direction="column" // Full viewport size
    >
      {/* First Row: Geographical Map and Right Section side by side */}
      <Grid item container xs={12} id="main-container">
        {/* Left: Geographical Map */}
        <Grid item xs={12} md={7} id="map-container" style={{ height: '100%' }}>
          <h2>2024 Paris Olympics Swimming Dashboard - Yueqiao Chen</h2>
          {/* <p>Explore the performance of countries and athletes in the swimming events.</p> */}
          <WorldMap style={{ width: '100%', height: '100%' }} />
        </Grid>

        {/* Right: Histogram and Parallel Coordinates Plot */}
        <Grid item xs={12} id="parallel-plot-container" md={5} direction="column">
          {/* Right Section: Histogram at the top, Parallel Plot at the bottom */}
          {/* Histogram */}
          <Grid item xs={12} id="histogram-container" >
            <Histogram style={{ width: '100%', height: '100%' }} />
          </Grid>

            {/* Parallel Coordinates Plot*/}
          <Grid item xs={12} style={{ flexGrow: 1}}>
            <ParallelCoordinatesPlot style={{ width: '100%', height: '100%' }} />
          </Grid>

        </Grid>
      </Grid>
    </Grid>
)};


// For how Grid works, refer to https://mui.com/material-ui/react-grid/

// function Layout() {
//   return (
//     <Grid container spacing={1} direction='column' id="main-container">
//       <Grid container item xs={6} sm={6} md={6} lg={6}>
//         <Grid item xs={5} sm={5} md={5} lg={5}>
//           {/* <h2>World Map with D3.js</h2> */}
//           <WorldMap /> <ParallelCoordinatesPlot/> <Histogram/>
    
//         </Grid>
//         <Grid item xs sm md lg/>
//       </Grid>
//       <Grid item xs sm md lg>
        // {/* {
        // <Notes msg={"This is a message sent from App.tsx as component prop"} />
        // } */}
        // { // Uncomment the following to see how state management works in React.
        // /*
        //   <CountProvider>
        //     <NotesWithReducer msg={"This is a message sent from App.tsx as component prop"} />
        //   </CountProvider>*/
        // }
//       </Grid>
//     </Grid>
//     // <div>
//     //   <h1>World Map with D3.js</h1>
//     //   <WorldMap />
//     // </div>
//   )
// }

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Layout />
    </ThemeProvider>
  )
}

export default App
