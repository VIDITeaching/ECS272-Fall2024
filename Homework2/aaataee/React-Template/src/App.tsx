import Example from './components/Example'
import Notes from './components/Notes'
import { NotesWithReducer, CountProvider } from './components/NotesWithReducer';
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import Heatmap from './components/Heatmap';
import StreamPlot from './components/StreamPlot';
import ScatterPlot from './components/ScatterPlot';

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


// import React from 'react';
// import Heatmap from './components/Heatmap';

// const App: React.FC = () => {
//   return (
//     <div>
//       <h1 style={{ textAlign: 'center', margin: '20px 0' }}>Heatmap Correlation of Vehicle Data</h1>
//       <div style={{ display: 'flex', justifyContent: 'center' }}>
//         <Heatmap />
//       </div>
//     </div>
//   );
// };

// export default App;





// For how Grid works, refer to https://mui.com/material-ui/react-grid/
// import React, { useState, useEffect } from 'react';
// import StreamPlot from './components/StreamPlot'; // Adjust path if needed
// import ScatterPlot from './components/ScatterPlot'; // Adjust path if needed
// import * as d3 from 'd3';
// import StarCoordinatePlot from './components/StarCoordinatePlot';
// import PairPlot from './components/StarCoordinatePlot';

// interface VehicleData {
//   year: number;
//   make: string;
//   sellingprice: number;
//   mmr: number;
//   body: string;
//   transmission: string;
//   condition: number;
//   odometer: number;
// }

// const App: React.FC = () => {
//   const [data, setData] = useState<VehicleData[]>([]);
//   const [view, setView] = useState<'scatter' | 'stream' | 'star'>('star'); // Toggle between views

//   useEffect(() => {
//     d3.csv('/data/car_prices.csv', (d: any) => ({
//       year: +d.year,
//       make: d.make,
//       sellingprice: +d.sellingprice,
//       mmr: +d.mmr, // Ensure MMR data is loaded
//       body: d.body,
//       transmission: d.transmission,
//       condition: d.condition,
//       odometer: d.odometer,
//     })).then((loadedData: VehicleData[]) => {
//       setData(loadedData);
//     });
//   }, []);

//   return (
//     <div>
//       <h1>Vehicle Price Analysis</h1>
//       {/* Toggle Buttons */}
//       <div>
//         <button onClick={() => setView('scatter')}>Show Scatter Plot</button>
//         <button onClick={() => setView('stream')}>Show Stream Plot</button>
//         <button onClick={() => setView('star')}>Show Star Coordinate Plot</button>
//       </div>
      
//       {/* Conditionally Render the Views */}
//       {data.length > 0 ? (
//         <>
//           {view === 'scatter' && (
//             <>
//               <h2>Scatter Plot: Profit (Selling Price - MMR) Over Year</h2>
//               <ScatterPlot data={data} />
//             </>
//           )}
//           {view === 'stream' && (
//             <>
//               <h2>Stream Plot: Price of Makes Over Year</h2>
//               <StreamPlot data={data} />
//             </>
//           )}
//           {view === 'star' && (
//             <>
//               <h2>Star Coordinate Plot: MMR Over Body, Transmission, Condition, and Odometer</h2>
//               <PairPlot
//                 data={data}
//                 numericalColumns={['mmr', 'year', 'condition', 'odometer']}
//                 categoricalColumns={['make', 'body', 'transmission']}
//               />
//             </>
//           )}
//         </>
//       ) : (
//         <p>Loading data...</p>
//       )}
//     </div>
//   );
// };

// export default App;


function Layout() {
  return (
    <Grid container spacing={1} direction='column' id="main-container">
      <Grid container item xs={5} sm={5} md={5} lg={5}>
        <Grid item xs={5} sm={5} md={5} lg={5}>
          <Heatmap />
        </Grid>
        <Grid item xs sm md lg>
          <StreamPlot />
        </Grid>
        <Grid item xs sm md lg>
          <ScatterPlot />
        </Grid>
      </Grid>
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
