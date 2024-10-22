import Example from './components/Example'
import Notes from './components/Notes'
import Vis_1 from './components/Vis_1'
import Vis_2 from './components/Vis_2';
import Vis_3 from './components/Vis_3';
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

// function Layout() {
//   return (
//     <Grid container spacing={0} direction='column' style={{ height: '100vh' }} id="main-container">
//       <Grid item xs={12} style={{ height: '50vh', width: '100%' }}>
//         <Vis_1 />
//       </Grid>
//       <Grid item xs={6} style={{ height: '50vh', width: '50%' }}>
//         <Vis_2 />
//       </Grid>
//       <Grid item xs={6} style={{ height: '50vh', width: '50%' }}>
//         <Vis_3 />
//       </Grid>
//     </Grid>
//   );
// }

function Layout() {
  return (
    <Grid container direction="column" style={{ height: '100vh', position: 'relative' }} id="main-container">
      <Grid item xs={12} style={{ height: '50vh', width: '100%', position: 'absolute', top: '0', left: '0' }}>
        <Vis_1 />
      </Grid>
      <Grid item xs={6} style={{ height: '50vh', width: '50%', position: 'absolute', bottom: '0', left: '0' }}>
        <Vis_2 />
      </Grid>

      <Grid item xs={6} style={{ height: '50vh', width: '50%', position: 'absolute', bottom: '0', right: '0' }}>
        <Vis_3 />
      </Grid>
    </Grid>
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
