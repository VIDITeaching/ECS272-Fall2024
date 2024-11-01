import Notes from './components/Notes'
import Vis_1 from './components/Vis_1';
import Vis_2 from './components/Vis_2';
import Vis_3 from './components/Vis_3';
import { NotesWithReducer, CountProvider } from './components/NotesWithReducer';
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import { useState } from 'react';

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
  // Shared state to track selected risk ratings
  const [selectedRiskRatings, setSelectedRiskRatings] = useState<string[]>([]);

  // Handler to update selected ratings, passed to Vis_2
  const handleSelectedRatingsChange = (ratings: string[]) => {
      setSelectedRiskRatings(ratings);
  };

  return (
      <Grid container direction="column" style={{ height: '100vh', position: 'relative' }} id="main-container">
          <Grid item xs={12} style={{ height: '50vh', width: '100%', position: 'absolute', top: '0', left: '0' }}>
              <Vis_1 />
          </Grid>
          <Grid item xs={6} style={{ height: '50vh', width: '50%', position: 'absolute', bottom: '0', left: '0' }}>
              {/* Pass shared state and handler to Vis_2 */}
              <Vis_2 selectedRiskRatings={selectedRiskRatings} onSelectedRatingsChange={handleSelectedRatingsChange} />
          </Grid>
          <Grid item xs={6} style={{ height: '50vh', width: '50%', position: 'absolute', bottom: '0', right: '0' }}>
              {/* Pass shared state to Vis_3 */}
              <Vis_3 selectedRiskRatings={selectedRiskRatings} />
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
