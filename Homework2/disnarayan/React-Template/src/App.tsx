import Example from './components/Example';
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
      <Grid container item xs={6} sm={6} md={6} lg={6}>
        <Grid item xs={5} sm={5} md={5} lg={5}>
          <Example />
        </Grid>
        <Grid item xs sm md lg />
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
