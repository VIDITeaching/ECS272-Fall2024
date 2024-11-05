import React, { useState, useEffect } from 'react';
import SunburstDiagram from './sunburstdiagram';
import { loadFinancialData, processDataForSunburst } from './dataProcessor';
import { Node } from './types';

const SunburstContainer: React.FC = () => {
  const [hierarchicalData, setHierarchicalData] = useState<Node | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });  // Set initial size

  // Function to update the size based on the window dimensions
  const updateSize = () => {
    const width = Math.min(window.innerWidth * 0.8, 600); 
    const height = Math.min(window.innerHeight * 0.8, 600); 
    setSize({ width, height });
  };

  useEffect(() => {
    updateSize();

    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Fetch and process the data
  useEffect(() => {
    const fetchAndProcessData = async () => {
      // Load the financial data
      const rawData = await loadFinancialData('../../data/financial_risk_assessment.csv');

      const processedData = processDataForSunburst(rawData);

      setHierarchicalData(processedData);
    };

    fetchAndProcessData();
  }, []);

  if (!hierarchicalData) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {/* Pass the dynamic size to the SunburstDiagram */}
      <SunburstDiagram data={hierarchicalData} width={size.width} height={size.height} />
    </div>
  );
};

export default SunburstContainer;
