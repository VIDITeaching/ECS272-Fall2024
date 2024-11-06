import React, { useState, useEffect } from "react";
import Sankey from "./components/Sankey";
import Barchart from "./components/Barchart";
import Heatmap from "./components/Heatmap";

function App() {

return (
  <div style={{
    height: '100vh', // Full height of the viewport
    width: '100vw', // Full width of the viewport
    overflow: 'hidden', // Prevent scrolling
  }}>
    <Sankey />
  </div>
);
}
export default App;

