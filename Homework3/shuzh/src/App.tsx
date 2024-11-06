import { useEffect, useState, useRef } from 'react'
import ParallelCoordinates from './components/Dashboard'
import Vis1 from './components/Vis1'
import Vis2 from './components/Vis2'
import Grid from '@mui/material/Grid'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { grey } from '@mui/material/colors'
import { CSSProperties } from 'react'
interface StudentData {
  Dalc: number
  Walc: number
}

// Adjust the color theme for material ui
const theme = createTheme({
  palette: {
    primary: {
      main: grey[700],
    },
    secondary: {
      main: grey[700],
    }
  },
})

const styles: { [key: string]: CSSProperties } = {
  root: {
    height: '100vh',
    overflow: 'hidden',
  },
  body: {
    overflow: 'hidden',
    height: '100%',
  },
  bottom: {
    display: 'flex',
    height: '48vh',
  },
}

function Layout() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [filteredData, setFilteredData] = useState<StudentData[]>([])

  const handleDataFiltered = (newFilteredData: StudentData[]) => {
    setFilteredData(newFilteredData)
  }

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)

    return () => {
      window.removeEventListener('resize', updateDimensions)
    }
  }, [])
  
  return (
    <Grid container style={styles.body}>
      <Grid item xs={12} style={{ height: '52vh' }}>
        <ParallelCoordinates  onDataFiltered={handleDataFiltered} />
      </Grid>
      <Grid item xs={12} style={styles.bottom}>
        <Grid item xs={6}>
          <Vis1 />
        </Grid>
        <Grid item xs={6}>
          <Vis2 data={filteredData}/>
        </Grid>
      </Grid>
    </Grid>
  )
}

function App() {
  useEffect(() => {
    // Disable scrolling on mount
    document.body.style.overflow = 'hidden'
    
    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <div style={styles.root}>
        <Layout />
      </div>
    </ThemeProvider>
  )
}

export default App