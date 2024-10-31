// import * as d3 from 'd3';

// // Define the data type
// export interface StudentData {
//   [key: string]: any;
// }

// export type CorrelationMatrix = number[][];

// // Specify the columns to be used
// const selectedColumns = [
//   'age','Medu', 'Fedu', 'traveltime', 'studytime',
//   'failures', 'famrel', 'freetime', 'goout', 'Dalc',
//   'Walc', 'health', 'absences', 'G1', 'G2', 'G3'
// ];

// // Load and preprocess data
// export const loadAndProcessData = async (): Promise<{
//   matrix: CorrelationMatrix;
//   labels: string[];
//   combinedData: StudentData[]; // Return combined data here
// }> => {
//   const porData = await d3.csv('/data/student-por.csv', parseStudentData);
//   const matData = await d3.csv('/data/student-mat.csv', parseStudentData);

//   // Combine the two datasets
//   const combinedData: StudentData[] = [...porData, ...matData];

//   // Calculate the correlation matrix for the selected columns
//   const matrix = calculateCorrelationMatrix(combinedData, selectedColumns);
//   console.log(combinedData)
//   // Return the correlation matrix, labels, and combined data
//   return { matrix, labels: selectedColumns, combinedData };
// };

// const parseStudentData = (d: d3.DSVRowString<string>): StudentData => {
//     const parsedData: StudentData = {};
    
//     // Iterate over all columns in the data row `d`
//     Object.keys(d).forEach((key) => {
//       parsedData[key] = isNaN(+d[key]!) ? d[key] : +d[key]!; // Convert to number if possible
//     });
  
//     return parsedData;
//   };
  

// // Calculate the correlation matrix for the selected columns
// const calculateCorrelationMatrix = (data: StudentData[], columns: string[]): CorrelationMatrix => {
//   const matrixSize = columns.length;
//   const correlationMatrix: CorrelationMatrix = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(0));

//   for (let i = 0; i < matrixSize; i++) {
//     for (let j = i; j < matrixSize; j++) {
//       const colX = columns[i];
//       const colY = columns[j];
//       const correlation = calculateCorrelation(data, colX, colY);
//       correlationMatrix[i][j] = correlation;
//       correlationMatrix[j][i] = correlation; // Mirror the matrix
//     }
//   }
//   return correlationMatrix;
// };

// // Helper function to calculate Pearson correlation
// const calculateCorrelation = (data: StudentData[], colX: string, colY: string): number => {
//   const n = data.length;
//   const meanX = data.reduce((sum, row) => sum + (row[colX] ?? 0), 0) / n;
//   const meanY = data.reduce((sum, row) => sum + (row[colY] ?? 0), 0) / n;

//   let numerator = 0;
//   let denominatorX = 0;
//   let denominatorY = 0;

//   for (const row of data) {
//     const x = (row[colX] ?? 0) - meanX;
//     const y = (row[colY] ?? 0) - meanY;
//     numerator += x * y;
//     denominatorX += x * x;
//     denominatorY += y * y;
//   }

//   return denominatorX && denominatorY ? numerator / Math.sqrt(denominatorX * denominatorY) : 0;
// };
import * as d3 from 'd3';

export interface StudentData {
  [key: string]: any;
}

export type CorrelationMatrix = number[][];

const selectedColumns = [
  'age', 'Medu', 'Fedu', 'traveltime', 'studytime',
  'failures', 'famrel', 'freetime', 'goout', 'Dalc',
  'Walc', 'health', 'absences', 'G1', 'G2', 'G3'
];

export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export const loadAndProcessData = async (): Promise<{
  matrix: CorrelationMatrix;
  labels: string[];
  combinedData: StudentData[];
  sankeyData: { nodes: SankeyNode[]; links: SankeyLink[] };
}> => {
  const porData = await d3.csv('/data/student-por.csv', parseStudentData);
  const matData = await d3.csv('/data/student-mat.csv', parseStudentData);
  const combinedData: StudentData[] = [...porData, ...matData];

  const matrix = calculateCorrelationMatrix(combinedData, selectedColumns);

  const sankeyData = processSankeyData(combinedData);

  return { matrix, labels: selectedColumns, combinedData, sankeyData };
};

const parseStudentData = (d: d3.DSVRowString<string>): StudentData => {
  const parsedData: StudentData = {};
  Object.keys(d).forEach((key) => {
    parsedData[key] = isNaN(+d[key]!) ? d[key] : +d[key]!;
  });
  return parsedData;
};

// Calculate the correlation matrix
const calculateCorrelationMatrix = (data: StudentData[], columns: string[]): CorrelationMatrix => {
  const matrixSize = columns.length;
  const correlationMatrix: CorrelationMatrix = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(0));

  for (let i = 0; i < matrixSize; i++) {
    for (let j = i; j < matrixSize; j++) {
      const colX = columns[i];
      const colY = columns[j];
      const correlation = calculateCorrelation(data, colX, colY);
      correlationMatrix[i][j] = correlation;
      correlationMatrix[j][i] = correlation;
    }
  }
  return correlationMatrix;
};

// Helper function to calculate Pearson correlation
const calculateCorrelation = (data: StudentData[], colX: string, colY: string): number => {
  const n = data.length;
  const meanX = data.reduce((sum, row) => sum + (row[colX] ?? 0), 0) / n;
  const meanY = data.reduce((sum, row) => sum + (row[colY] ?? 0), 0) / n;

  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;

  for (const row of data) {
    const x = (row[colX] ?? 0) - meanX;
    const y = (row[colY] ?? 0) - meanY;
    numerator += x * y;
    denominatorX += x * x;
    denominatorY += y * y;
  }

  return denominatorX && denominatorY ? numerator / Math.sqrt(denominatorX * denominatorY) : 0;
};


const processSankeyData = (data: StudentData[]): { nodes: SankeyNode[]; links: SankeyLink[] } => {
    const nodes = new Set<string>();
    const links: { source: string; target: string; value: number }[] = [];
  
    // Traverse each row to create categorized flows
    data.forEach((student) => {
      // Categorize each factor based on given thresholds
      const school = `School: ${student.school}`;
  
      const motherEducation = student.Medu <= 2 ? "Lower Mother's Education" : "Higher Mother's Education";
      const fatherEducation = student.Fedu <= 2 ? "Lower Father's Education" : "Higher Father's Education";
      const studytime = student.studytime <= 2 ? "Shorter Studytime" : "Longer Studytime";
  
      const grade = student.G3 < 10 ? "Lower Grade" : "Higher Grade";
  
      // Define the factors to include in the nodes and links
      const factors = [school, motherEducation, fatherEducation, studytime];
      factors.forEach(factor => nodes.add(factor));
      nodes.add(grade);
  
      // Create direct links from each factor to the grade
      factors.forEach(factor => {
        const existingLink = links.find(link => link.source === factor && link.target === grade);
        if (existingLink) {
          existingLink.value += 1;
        } else {
          links.push({ source: factor, target: grade, value: 1 });
        }
      });
    });
  
    // Convert nodes to an array of objects with unique names
    const nodeArray = Array.from(nodes).map(name => ({ name }));
  
    // Map node names to indices for Sankey compatibility
    const nodeMap = new Map(nodeArray.map((node, index) => [node.name, index]));
  
    // Convert links to use node indices and filter out any invalid links
    const indexedLinks = links.map(link => ({
      source: nodeMap.get(link.source) ?? -1,
      target: nodeMap.get(link.target) ?? -1,
      value: link.value
    })).filter(link => link.source !== -1 && link.target !== -1);
  
    return {
      nodes: nodeArray,
      links: indexedLinks,
    };
  };
  