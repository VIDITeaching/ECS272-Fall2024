import React, { useEffect, useState } from 'react';
import { MenuItem, FormControl, Select, InputLabel } from '@mui/material';
import { useFilterContext } from '../stores/FilterContext';
import { loadCarData } from '../stores/dataLoader';

interface FilterBarsProps {
  dataFilePath: string;
}

const FilterBars: React.FC<FilterBarsProps> = ({ dataFilePath }) => {
  const { selectedMake, setSelectedMake, selectedBodyType, setSelectedBodyType, selectedState, setSelectedState } = useFilterContext();
  const [allMakes, setAllMakes] = useState<string[]>(['ALL']);
  const [filteredBodyTypes, setFilteredBodyTypes] = useState<string[]>(['ALL']);
  const [allBodyTypes, setAllBodyTypes] = useState<string[]>(['ALL']);
  const [allStates, setAllStates] = useState<string[]>(['ALL']);

  useEffect(() => {
    loadCarData(dataFilePath).then((data) => {
      const uniqueMakes = Array.from(new Set(data.map((row) => row.make))).sort();
      const uniqueBodyTypes = Array.from(new Set(data.map((row) => row.body))).sort();
      const uniqueStates = Array.from(new Set(data.map((row) => row.state))).sort();

      setAllMakes(['ALL', ...uniqueMakes]);
      setAllBodyTypes(['ALL', ...uniqueBodyTypes]);
      setFilteredBodyTypes(['ALL', ...uniqueBodyTypes]);
      setAllStates(['ALL', ...uniqueStates]);
    });
  }, [dataFilePath]);

  useEffect(() => {
    loadCarData(dataFilePath).then((data) => {
      if (selectedMake === 'ALL') {
        setFilteredBodyTypes(allBodyTypes);
      } else {
        const bodyTypesForMake = Array.from(
          new Set(data.filter((row) => row.make === selectedMake).map((row) => row.body))
        ).sort();
        setFilteredBodyTypes(['ALL', ...bodyTypesForMake]);
      }
    });
  }, [dataFilePath, selectedMake, allBodyTypes]);

  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
      <FormControl variant="outlined" style={{ minWidth: 120 }}>
        <InputLabel>Make</InputLabel>
        <Select
          value={selectedMake}
          onChange={(e) => setSelectedMake(e.target.value)}
          label="Make"
        >
          {allMakes.map((make) => (
            <MenuItem key={make} value={make}>{make}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl variant="outlined" style={{ minWidth: 120 }}>
        <InputLabel>Body Type</InputLabel>
        <Select
          value={selectedBodyType}
          onChange={(e) => setSelectedBodyType(e.target.value)}
          label="Body Type"
        >
          {filteredBodyTypes.map((bodyType) => (
            <MenuItem key={bodyType} value={bodyType}>{bodyType}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl variant="outlined" style={{ minWidth: 120 }}>
        <InputLabel>State</InputLabel>
        <Select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          label="State"
        >
          {allStates.map((state) => (
            <MenuItem key={state} value={state}>{state}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default FilterBars;
