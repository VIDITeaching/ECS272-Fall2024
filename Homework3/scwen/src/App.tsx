import FilterBars from './components/FilterBars';
import BarChart from './components/BarChart';
import LineChart from './components/LineChart';
import ParallelCoordinate from './components/ParallelCoordinate';
import './App.css';

const App: React.FC = () => {
  return (
    <div>
      <h1>Car Sales Dashboard</h1>
      <div className="filter-bars-wrapper">
        <FilterBars dataFilePath="/data/car_prices.csv" />
      </div>
      <div className="chart-wrapper">
        <div className="chart-container">
          <div className="chart">
            <BarChart dataFilePath="/data/car_prices.csv" />
          </div>
          <div className="chart">
            <LineChart dataFilePath="/data/car_prices.csv" />
          </div>
          <div className="chart">
            <ParallelCoordinate dataFilePath="/data/car_prices.csv" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
