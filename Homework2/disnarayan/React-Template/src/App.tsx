import Example from './components/Example'; // Your bar chart component
import Heatmap from './components/Heatmap';  // Heatmap component
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';

const theme = createTheme({
  palette: {
    primary: { main: grey[700] },
    secondary: { main: grey[700] },
  },
});

function Layout() {
  return (
    <Grid container spacing={1} direction="column" id="main-container">
      <Grid container item xs={12} sm={12} md={12} lg={12}>
        <Grid item xs={6} sm={6} md={6} lg={6}>
          <Example /> {/* Bar Chart Component */}
        </Grid>
        <Grid item xs={6} sm={6} md={6} lg={6}>
          <Heatmap /> {/* Heatmap Component */}
        </Grid>
      </Grid>
    </Grid>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Layout />
    </ThemeProvider>
  );
}

export default App;
