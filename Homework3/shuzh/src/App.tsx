import ParallelCoordinates from './components/Dashboard'
import Vis1 from './components/Vis1'
import Vis2 from './components/Vis2'
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import { CSSProperties } from 'react'

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

const styles: { [key: string]: CSSProperties } = {
  body: {
    overflow: 'hidden',
  },
  bottom: {
    display: 'flex',
    height: window.innerHeight*0.48,
  },
}

function Layout() {
  return (
    <Grid style={styles.body}>
      <ParallelCoordinates />
      <div style={styles.bottom}>
      <Vis1 />
      <Vis2 />
    </div>
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
