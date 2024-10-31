// import React, { useEffect, useState } from 'react';
// import Heatmap from './components/Heatmap';
// import ScatterPlot from './components/ScatterPlot';
// import { loadAndProcessData, StudentData } from './utils/preprocessing';

// const App: React.FC = () => {
//   const [correlationMatrix, setCorrelationMatrix] = useState<number[][]>([]);
//   const [labels, setLabels] = useState<string[]>([]);
//   const [scatterData, setScatterData] = useState<StudentData[]>([]);

//   useEffect(() => {
//     const fetchData = async () => {
//       const { matrix, labels, combinedData } = await loadAndProcessData();
//       setCorrelationMatrix(matrix);
//       setLabels(labels);
//       setScatterData(combinedData); // Set the combined data for scatter plot use
//     };

//     fetchData();
//   }, []);

//   return (
//     <div className="dashboard">
//       <h1>Which factors impact grades?</h1>
//       {correlationMatrix.length > 0 && labels.length > 0 ? (
//         <div className="plot-container">
//           <div className="plot-item">
//             <Heatmap data={correlationMatrix} labels={labels} />
//           </div>
//           <div className="plot-item">
//             <ScatterPlot
//               data={scatterData}
//               xKey="Dalc"  
//               yKey="G3"    
//               colorKey="sex" 
//               title="Alcohol Consumption vs Final Grade"
//             />
//           </div>
//         </div>
//       ) : (
//         <p>Loading data...</p>
//       )}
//     </div>
//   );
// };

// export default App;

// import React, { useEffect, useState } from 'react';
// import Heatmap from './components/Heatmap';
// import ScatterPlot from './components/ScatterPlot';
// import SankeyDiagram from './components/SankeyDiagram';
// import { loadAndProcessData, StudentData } from './utils/preprocessing';
// import './style.css';

// const App: React.FC = () => {
//   const [correlationMatrix, setCorrelationMatrix] = useState<number[][]>([]);
//   const [labels, setLabels] = useState<string[]>([]);
//   const [scatterData, setScatterData] = useState<StudentData[]>([]);
//   const [sankeyData, setSankeyData] = useState<{ nodes: any[]; links: any[] } | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       const { matrix, labels, combinedData } = await loadAndProcessData();
//       setCorrelationMatrix(matrix);
//       setLabels(labels);
//       setScatterData(combinedData);

//       // Process the combined data to create nodes and links for Sankey plot
//       const processedSankeyData = processSankeyData(combinedData);
//       setSankeyData(processedSankeyData);
//     };

//     fetchData();
//   }, []);

//   return (
//     <div className="dashboard">
//       <h1>Which Factors Impact Grades?</h1>
//       {correlationMatrix.length > 0 && labels.length > 0 ? (
//         <div className="plot-container">
//           <div className="plot-item heatmap">
//             <Heatmap data={correlationMatrix} labels={labels} width={300} height={300} />
//           </div>
//           <div className="plot-item scatterplot">
//             <ScatterPlot
//               data={scatterData}
//               xKey="Dalc"
//               yKey="G3"
//               colorKey="sex"
//               title="Alcohol Consumption vs Final Grade"
//             />
//           </div>
//           <div className="plot-item sankey">
//             {sankeyData ? (
//               <SankeyDiagram data={sankeyData} />
//             ) : (
//               <p>Loading Sankey diagram data...</p>
//             )}
//           </div>
//         </div>
//       ) : (
//         <p>Loading data...</p>
//       )}
//     </div>
//   );
// };

// export default App;
// App.tsx
// App.tsx
import React, { useEffect, useState } from 'react';
import Heatmap from './components/Heatmap';
import ScatterPlot from './components/ScatterPlot';
import SankeyDiagram from './components/SankeyDiagram';
import { loadAndProcessData, StudentData, SankeyNode, SankeyLink } from './utils/preprocessing';
import './style.css';

const App: React.FC = () => {
  const [correlationMatrix, setCorrelationMatrix] = useState<number[][]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [scatterData, setScatterData] = useState<StudentData[]>([]);
  const [sankeyData, setSankeyData] = useState<{ nodes: SankeyNode[]; links: SankeyLink[] } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { matrix, labels, combinedData, sankeyData } = await loadAndProcessData();
      setCorrelationMatrix(matrix);
      setLabels(labels);
      setScatterData(combinedData);
      setSankeyData(sankeyData);
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard">
      <h1>Which Factors Impact Grades?</h1>
      {correlationMatrix.length > 0 && labels.length > 0 && sankeyData ? (
        <div className="flex-container">
          <div className="left-panel">
            <Heatmap data={correlationMatrix} labels={labels} width={300} height={300} />
          </div>
          <div className="right-panel">
            <ScatterPlot
              data={scatterData}
              xKey="Dalc"
              yKey="G3"
              colorKey="sex"
              title="Alcohol Consumption vs Final Grade"
            />
            <SankeyDiagram data={sankeyData} />
          </div>
        </div>
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  );
};

export default App;
