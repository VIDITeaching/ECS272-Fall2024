
import React from "react";
import Barchart from "./components/Barchart";
import ScatterPlot from "./components/ScatterPlot";
import ParallelCoordinates from "./components/ParallelCoordinates";

function App() {
  return (
    <div style={{ padding: '20px' }}>
      {/* Bar Chart at the top */}
      <div style={{ marginBottom: '20px' }}>
        <Barchart />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
        {/* Parallel Coordinates on the bottom left */}
        <div style={{ flex: 1 }}>
          <ParallelCoordinates />
        </div>

        {/* Scatter Plot on the bottom right */}
        <div style={{ flex: 1 }}>
          <ScatterPlot />
        </div>
      </div>
    </div>
  );
}

export default App;
