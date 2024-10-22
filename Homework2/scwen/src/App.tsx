import React from 'react';
import BarChart from './components/BarChart';
import LineChart from './components/LineChart';
import ParallelCoordinate from './components/ParallelCoordinate';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="chart-container">
      <div className="chart-item">
        <BarChart />
      </div>
      <div className="chart-item">
        <LineChart />
      </div>
      <div className="chart-item">
        <ParallelCoordinate />
      </div>
    </div>
  );
};

export default App;
