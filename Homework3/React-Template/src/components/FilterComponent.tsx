import React, { useState } from 'react';
import '../css/FilterComponent.css'

interface FilterProps {
  makes: string[];
  onFilterChange: (filters: {
    selectedMakes: string[];
    yearRange: [number, number];
    profitRange: [number, number];
  }) => void;
}

const FilterComponent: React.FC<FilterProps> = ({ makes, onFilterChange }) => {
  const [selectedMakes, setSelectedMakes] = useState<string[]>([]);
  const [yearRange, setYearRange] = useState<[number, number]>([2005, 2015]);
  const [profitRange, setProfitRange] = useState<[number, number]>([-1000, 1000]);

  const handleMakeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
    setSelectedMakes(selectedOptions);
    onFilterChange({ selectedMakes: selectedOptions, yearRange, profitRange });
  };

  const resetMakes = () => {
    setSelectedMakes([]);
    onFilterChange({ selectedMakes: [], yearRange, profitRange });
  };

  const handleYearRangeChange = (index: number, value: number) => {
    const newYearRange = [...yearRange] as [number, number];
    newYearRange[index] = value;
    setYearRange(newYearRange);
    onFilterChange({ selectedMakes, yearRange: newYearRange, profitRange });
  };

  const handleProfitRangeChange = (index: number, value: number) => {
    const newProfitRange = [...profitRange] as [number, number];
    newProfitRange[index] = value;
    setProfitRange(newProfitRange);
    onFilterChange({ selectedMakes, yearRange, profitRange: newProfitRange });
  };

  return (
    <div className="filter-container">
      <div className="filter-group">
        <label>Make:</label>
        <select multiple value={selectedMakes} onChange={handleMakeChange} className="filter-select">
          {makes.map(make => (
            <option key={make} value={make}>{make}</option>
          ))}
        </select>
        <button className="reset-button" onClick={resetMakes}>Reset</button>
      </div>
      <div className="filter-group">
        <label>Year Range:</label>
        <input
          type="number"
          value={yearRange[0]}
          onChange={e => handleYearRangeChange(0, +e.target.value)}
          className="filter-input"
        />
        <span>-</span>
        <input
          type="number"
          value={yearRange[1]}
          onChange={e => handleYearRangeChange(1, +e.target.value)}
          className="filter-input"
        />
      </div>
      <div className="filter-group">
        <label>Profit Range:</label>
        <input
          type="number"
          value={profitRange[0]}
          step="100"
          onChange={e => handleProfitRangeChange(0, +e.target.value)}
          className="filter-input"
        />
        <span>-</span>
        <input
          type="number"
          value={profitRange[1]}
          step="100"
          onChange={e => handleProfitRangeChange(1, +e.target.value)}
          className="filter-input"
        />
      </div>
    </div>
  );
};

export default FilterComponent;
