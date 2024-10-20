import Example from './components/Example'
import Notes from './components/Notes'
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
// import React, { useState, useEffect } from 'react';
// import StreamPlot from './components/StreamPlot'; // Adjust path if needed
// import ScatterPlot from './components/ScatterPlot'; // Adjust path if needed
// import * as d3 from 'd3';

// interface VehicleData {
//   year: number;
//   make: string;
//   sellingprice: number;
//   mmr: number; // Include this field as it's required for ScatterPlot
// }

// const App: React.FC = () => {
//   const [data, setData] = useState<VehicleData[]>([]);
//   const [view, setView] = useState<'scatter' | 'stream'>('scatter'); // Toggle between views

//   useEffect(() => {
//     d3.csv('/path/to/car_prices.csv', (d: any) => ({
//       year: +d.year,
//       make: d.make,
//       sellingprice: +d.sellingprice,
//       mmr: +d.mmr, // Ensure MMR data is loaded
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
//         </>
//       ) : (
//         <p>Loading data...</p>
//       )}
//     </div>
//   );
// };

// export default App;

import React, { useState, useEffect } from 'react';
import StreamPlot from './components/StreamPlot'; // Adjust this path according to your project structure
import * as d3 from 'd3';

interface VehicleData {
  year: number;
  make: string;
  sellingprice: number;
}

const App: React.FC = () => {
  const [data, setData] = useState<VehicleData[]>([]);

  useEffect(() => {
    d3.csv('/data/car_prices.csv', (d: any) => ({
      year: +d.year,
      make: d.make,
      sellingprice: +d.sellingprice,
    })).then((loadedData: VehicleData[]) => {
      setData(loadedData);
    });
  }, []);

  return (
    <div>
      <h1>Stream Plot of Vehicle Prices by Make Over Year</h1>
      {data.length > 0 ? <StreamPlot data={data} /> : <p>Loading data...</p>}
    </div>
  );
};

export default App;


// function Layout() {
//   return (
//     <Grid container spacing={1} direction='column' id="main-container">
//       <Grid container item xs={6} sm={6} md={6} lg={6}>
//         <Grid item xs={5} sm={5} md={5} lg={5}>
//           <Example />
//         </Grid>
//         <Grid item xs sm md lg/>
//       </Grid>
//       <Grid item xs sm md lg>
//         {
//         <Notes msg={"This is a message sent from App.tsx as component prop"} />
//         }
//         { // Uncomment the following to see how state management works in React.
//         /*
//           <CountProvider>
//             <NotesWithReducer msg={"This is a message sent from App.tsx as component prop"} />
//           </CountProvider>*/
//         }
//       </Grid>
//     </Grid>
//   )
// }

// function App() {
//   return (
//     <ThemeProvider theme={theme}>
//       <Layout />
//     </ThemeProvider>
//   )
// }

// export default App
