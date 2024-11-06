import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FilterContextProps {
  selectedMake: string;
  setSelectedMake: (make: string) => void;
  selectedBodyType: string;
  setSelectedBodyType: (bodyType: string) => void;
  selectedState: string;
  setSelectedState: (state: string) => void;
}

const FilterContext = createContext<FilterContextProps | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [selectedMake, setSelectedMake] = useState<string>('ALL');
  const [selectedBodyType, setSelectedBodyType] = useState<string>('ALL');
  const [selectedState, setSelectedState] = useState<string>('ALL');

  return (
    <FilterContext.Provider value={{
      selectedMake,
      setSelectedMake,
      selectedBodyType,
      setSelectedBodyType,
      selectedState,
      setSelectedState
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }
  return context;
};
