import React, { useState, useEffect } from 'react';
import SunburstDiagram from './sunburstdiagram';
import { loadFinancialData, processDataForSunburst } from './dataProcessor';
import { Node } from './types';

const SunburstContainer: React.FC = () => {
  const [hierarchicalData, setHierarchicalData] = useState<Node | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });  // Set initial size

  // Function to update the size based on the window dimensions
  const updateSize = () => {
    const width = Math.min(window.innerWidth * 0.8, 600); // Set max width to 600px or 80% of the screen width
    const height = Math.min(window.innerHeight * 0.8, 600); // Set max height to 600px or 80% of the screen height
    setSize({ width, height });
  };

  useEffect(() => {
    // Call this function on initial render to set the size
    updateSize();

    // Attach a resize event listener to update size on window resize
    window.addEventListener('resize', updateSize);

    return () => {
      // Clean up the event listener on component unmount
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Fetch and process the data
  useEffect(() => {
    const fetchAndProcessData = async () => {
      // Load the financial data
      const rawData = await loadFinancialData('../../data/financial_risk_assessment.csv');

      // Process the raw data into a hierarchical structure
      const processedData = processDataForSunburst(rawData);

      // Set the hierarchical data for the Sunburst diagram
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
