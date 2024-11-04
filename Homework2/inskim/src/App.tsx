import Notes from "./components/Notes";
import { NotesWithReducer, CountProvider } from "./components/NotesWithReducer";
import Grid from "@mui/material/Grid";
import { Typography } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { grey } from "@mui/material/colors";
import BalloonPlot from "./components/BalloonPlot";
import SankeyDiagram from "./components/SankeyDiagram";
import HeatMap from "./components/HeatMap";
import GroupedBarChart from "./components/GroupedBar";

// Adjust the color theme for material ui
const theme = createTheme({
  palette: {
    primary: {
      main: grey[700],
    },
    secondary: {
      main: grey[700],
    },
  },
});

// For how Grid works, refer to https://mui.com/material-ui/react-grid/

function Layout() {
  return (
    <Grid container spacing={1}>
      {/* Title for Sankey Diagram */}
      <Grid item xs={12}>
        <Typography
          variant="h5"
          align="center"
          style={{ fontWeight: "bold" }}
          sx={{ marginTop: 3 }}
        >
          Overall Flow of Student Data in Mental Health
        </Typography>
      </Grid>
      {/* SankeyDiagram: Main visual */}
      <Grid container item xs={12} justifyContent="center">
        <Grid item xs={8}>
          <SankeyDiagram />
        </Grid>
      </Grid>

      {/* SubVisuals: Balloon Plot and Stacked Bar plot */}
      <Grid item xs={5.5} sx={{ marginLeft: 2 }}>
        <GroupedBarChart />
      </Grid>
      <Grid item xs={4}>
        <HeatMap />
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
