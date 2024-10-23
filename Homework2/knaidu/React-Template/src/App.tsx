// App.tsx
import Dashboard from './components/Dashboard';
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey, blue } from '@mui/material/colors';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const theme = createTheme({
  palette: {
    primary: {
      main: blue[700],
    },
    secondary: {
      main: grey[700],
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#1a237e',
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#283593',
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#314263',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          },
        },
      },
    },
  },
});

function Layout() {
  return (
    <Box 
      sx={{ 
        flexGrow: 1, 
        p: 3, 
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Paper 
            elevation={0}
            sx={{
              background: 'linear-gradient(45deg, #314263 30%, #776299 90%)',
              color: 'white',
              textAlign: 'center',
              py: 3,
            }}
          >
            <Typography 
              variant="h1" 
              component="h1"
              sx={{ 
                color: 'white',
                fontWeight: 600,
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              Student Alcohol Consumption Analytics
            </Typography>
            <Typography 
              variant="subtitle1"
              sx={{ 
                color: 'rgba(255,255,255,0.9)',
                mt: 1 
              }}
            >
              Comprehensive Analysis of Academic Performance and Behavior Patterns
            </Typography>
          </Paper>
        </Grid>

        {/* Main Dashboard Content */}
        <Grid item xs={12}>
          <Dashboard />
        </Grid>
      </Grid>
    </Box>
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