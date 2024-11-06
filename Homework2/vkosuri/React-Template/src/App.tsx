import React from 'react';
import BarChart from './components/BarChart';
import PieChart from './components/PieChart';
import SankeyChart from './components/SankeyChart';
import './style.css';

function App() {
  return (
    <div className="dashboard">
      {/* Header - 5% */}
      <div className="dashboard-header">
        <h1>Student Mental Health Dashboard - Analysis of mental health conditions among students</h1>
      </div>

      {/* Main Content - 95% */}
      <div className="dashboard-layout">
        {/* Sankey Diagram - 61% */}
        <div className="top-section">
          <div className="chart-container">
            <h2>Student Mental Health Overview: Sankey Diagram</h2>
            <div className="chart-wrapper sankey-wrapper">
              <SankeyChart />
            </div>
          </div>
        </div>

        {/* Bottom Section - 34% total (18% each, Bar Chart height reduced by half) */}
        <div className="bottom-section">
          {/* Bar Chart - Height reduced by 1/2 */}
          <div className="chart-container half-width">
            <h2>Mental Health by Academic Performance: Bar Chart</h2>
            <div className="chart-wrapper bar-wrapper">
              <BarChart />
            </div>
          </div>
          
          {/* Pie Chart - Normal height */}
          <div className="chart-container half-width">
            <h2>Mental Health by Gender: Pie Chart </h2>
            <div className="chart-wrapper pie-wrapper">
              <PieChart />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;