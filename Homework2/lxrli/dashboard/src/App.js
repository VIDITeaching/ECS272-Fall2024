import React, { useEffect, useState } from 'react';
import { loadAndPreprocessData } from './utils/dataPreprocessing';
import BarChart from './components/BarChart';
import ScatterPlot from './components/ScatterPlot';
import SankeyDiagram from './components/SankeyDiagram';
import './App.css';  // Import the CSS for styling

const App = () => {
  const [combinedData, setCombinedData] = useState([]);
  const [groupedData, setGroupedData] = useState({});
  console.log("Sankey Diagram Data (Grouped Data):", groupedData);

  useEffect(() => {
    loadAndPreprocessData().then(({ combinedData, groupedData }) => {
      console.log('Combined Data:', combinedData);  // Check the combined data
      console.log('Grouped Data for Sankey:', groupedData);  // Check the grouped data

      setCombinedData(combinedData);  // Use combined data from both datasets
      setGroupedData(groupedData);    // Use grouped data for Sankey diagram
    });
  }, []);

  return (
    <div className="dashboard">
      <h1>Alcohol Consumption Dashboard</h1>

      {/* Bar Chart */}
      <div className="chart-container">
        <BarChart data={combinedData} xKey="sex" yKey="G3" title="Average Final Grade by Gender" />
      </div>

      {/* Scatter Plot */}
      <div className="chart-container">
        <ScatterPlot data={combinedData} xKey="Dalc" yKey="G3" colorKey="sex" title="Alcohol Consumption vs Final Grade" />
      </div>

      {/* Sankey Diagram */}
      <div className="chart-container">
        <SankeyDiagram groupedData={groupedData} />
      </div>
    </div>
  );
};

export default App;