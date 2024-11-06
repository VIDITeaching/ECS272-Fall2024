import { Student, StudyTimeData, ScatterData, SankeyData } from '../types';
import * as d3 from 'd3';

export const parseCSV = (csv: string): Student[] => {
  return d3.csvParse(csv, d => ({
    school: d.school,
    sex: d.sex,
    age: +d.age,
    studytime: +d.studytime,
    failures: +d.failures,
    absences: +d.absences,
    famrel: +d.famrel,
    freetime: +d.freetime,
    goout: +d.goout,
    health: +d.health,
    G1: +d.G1,
    G2: +d.G2,
    G3: +d.G3,
    Dalc: +d.Dalc,
    Walc: +d.Walc,

  }));
} 

export const processParallelPlotData = (mathData: Student[], porData: Student[]): any[] => {
  console.log('Processing parallel plot data');
  console.log('Math data length:', mathData?.length);
  console.log('Por data length:', porData?.length);

  if (!Array.isArray(mathData) || !Array.isArray(porData)) {
    console.error('Invalid input: mathData or porData is not an array');
    return [];
  }

  if (mathData.length === 0 || porData.length === 0) {
    console.error('Empty input: mathData or porData is empty');
    return [];
  }

  try {
    const result = mathData.map((mathStudent, index) => {
      const porStudent = porData[index];
      return {
        Dalc: +mathStudent.Dalc,
        Walc: +mathStudent.Walc,
        G1_math: +mathStudent.G1,
        G2_math: +mathStudent.G2,
        G3_math: +mathStudent.G3,
        G1_por: +porStudent.G1,
        G2_por: +porStudent.G2,
        G3_por: +porStudent.G3
      };
    });

    console.log('Processed data length:', result.length);
    console.log('Sample processed data:', result.slice(0, 2));

    return result;
  } catch (error) {
    console.error('Error in processParallelPlotData:', error);
    return [];
  }
};


// export const processScatterData = (data: Student[]): ScatterData[] => {
//   return data.map(s => ({
//     absences: s.absences,
//     averageGrade: (s.G1 + s.G2 + s.G3) / 3,
//     school: s.school
//   }));
// };

export const processSankeyData = (mathData: Student[], porData: Student[]): SankeyData => {
  // Helper function to determine grade level
  const getGradeLevel = (student: Student) => {
    const avgGrade = (student.G1 + student.G2 + student.G3) / 3;
    if (avgGrade > 15) return 'High Grade';
    if (avgGrade >= 10) return 'Medium Grade';
    return 'Low Grade';
  };

  // Define nodes with subject-specific schools and gender
  const nodes = [
    // Math nodes
    { name: 'GP-Math', category: 'schools', subject: 'Math' },
    { name: 'MS-Math', category: 'schools', subject: 'Math' },
    { name: 'Male-Math', category: 'gender', subject: 'Math' },
    { name: 'Female-Math', category: 'gender', subject: 'Math' },
    
    // Portuguese nodes
    { name: 'GP-Por', category: 'schools', subject: 'Por' },
    { name: 'MS-Por', category: 'schools', subject: 'Por' },
    { name: 'Male-Por', category: 'gender', subject: 'Por' },
    { name: 'Female-Por', category: 'gender', subject: 'Por' },
    
    // Shared grade level nodes
    { name: 'High Grade', category: 'grades' },
    { name: 'Medium Grade', category: 'grades' },
    { name: 'Low Grade', category: 'grades' }
  ];

  // Create all links with proper source and target indices
  const links = [
    // Math School to Gender links
    {
      source: 0, // GP-Math
      target: 2, // Male-Math
      value: mathData.filter(s => s.school === 'GP' && s.sex === 'M').length
    },
    {
      source: 0, // GP-Math
      target: 3, // Female-Math
      value: mathData.filter(s => s.school === 'GP' && s.sex === 'F').length
    },
    {
      source: 1, // MS-Math
      target: 2, // Male-Math
      value: mathData.filter(s => s.school === 'MS' && s.sex === 'M').length
    },
    {
      source: 1, // MS-Math
      target: 3, // Female-Math
      value: mathData.filter(s => s.school === 'MS' && s.sex === 'F').length
    },

    // Portuguese School to Gender links
    {
      source: 4, // GP-Por
      target: 6, // Male-Por
      value: porData.filter(s => s.school === 'GP' && s.sex === 'M').length
    },
    {
      source: 4, // GP-Por
      target: 7, // Female-Por
      value: porData.filter(s => s.school === 'GP' && s.sex === 'F').length
    },
    {
      source: 5, // MS-Por
      target: 6, // Male-Por
      value: porData.filter(s => s.school === 'MS' && s.sex === 'M').length
    },
    {
      source: 5, // MS-Por
      target: 7, // Female-Por
      value: porData.filter(s => s.school === 'MS' && s.sex === 'F').length
    },

    // Math Gender to Grade links
    {
      source: 2, // Male-Math
      target: 8, // High Grade
      value: mathData.filter(s => s.sex === 'M' && getGradeLevel(s) === 'High Grade').length
    },
    {
      source: 2, // Male-Math
      target: 9, // Medium Grade
      value: mathData.filter(s => s.sex === 'M' && getGradeLevel(s) === 'Medium Grade').length
    },
    {
      source: 2, // Male-Math
      target: 10, // Low Grade
      value: mathData.filter(s => s.sex === 'M' && getGradeLevel(s) === 'Low Grade').length
    },
    {
      source: 3, // Female-Math
      target: 8, // High Grade
      value: mathData.filter(s => s.sex === 'F' && getGradeLevel(s) === 'High Grade').length
    },
    {
      source: 3, // Female-Math
      target: 9, // Medium Grade
      value: mathData.filter(s => s.sex === 'F' && getGradeLevel(s) === 'Medium Grade').length
    },
    {
      source: 3, // Female-Math
      target: 10, // Low Grade
      value: mathData.filter(s => s.sex === 'F' && getGradeLevel(s) === 'Low Grade').length
    },

    // Portuguese Gender to Grade links
    {
      source: 6, // Male-Por
      target: 8, // High Grade
      value: porData.filter(s => s.sex === 'M' && getGradeLevel(s) === 'High Grade').length
    },
    {
      source: 6, // Male-Por
      target: 9, // Medium Grade
      value: porData.filter(s => s.sex === 'M' && getGradeLevel(s) === 'Medium Grade').length
    },
    {
      source: 6, // Male-Por
      target: 10, // Low Grade
      value: porData.filter(s => s.sex === 'M' && getGradeLevel(s) === 'Low Grade').length
    },
    {
      source: 7, // Female-Por
      target: 8, // High Grade
      value: porData.filter(s => s.sex === 'F' && getGradeLevel(s) === 'High Grade').length
    },
    {
      source: 7, // Female-Por
      target: 9, // Medium Grade
      value: porData.filter(s => s.sex === 'F' && getGradeLevel(s) === 'Medium Grade').length
    },
    {
      source: 7, // Female-Por
      target: 10, // Low Grade
      value: porData.filter(s => s.sex === 'F' && getGradeLevel(s) === 'Low Grade').length
    }
  ];

  return { nodes, links };
};

export const processAlcoholData = (data: Student[]): { Dalc: number[]; Walc: number[] } => {
  return {
    Dalc: data.map(s => s.Dalc),
    Walc: data.map(s => s.Walc)
  };
};


export const calculateAlcoholStats = (data: number[]): { min: number; q1: number; median: number; q3: number; max: number } => {
  const sortedData = data.sort((a, b) => a - b);
  return {
    min: d3.min(sortedData) || 0,
    q1: d3.quantile(sortedData, 0.25) || 0,
    median: d3.median(sortedData) || 0,
    q3: d3.quantile(sortedData, 0.75) || 0,
    max: d3.max(sortedData) || 0
  };
};

export const processAlcoholHistogramData = (data: number[]): d3.Bin<number, number>[] => {
  const histogram = d3.histogram<number, number>()
    .domain([1, 5])
    .thresholds(d3.range(1, 6))
    .value(d => d);
  
  return histogram(data);
};

export const processLifestyleData = (mathData: Student[], porData: Student[]): any[] => {
  // Process math data
  const mathLifestyle = mathData.map(student => ({
    famrel: +student.famrel,
    freetime: +student.freetime,
    goout: +student.goout,
    Dalc: +student.Dalc,
    Walc: +student.Walc,
    health: +student.health,
    G3: +student.G3,
    subject: 'Math'  // Add subject identifier for math
  }));

  // Process portuguese data
  const porLifestyle = porData.map(student => ({
    famrel: +student.famrel,
    freetime: +student.freetime,
    goout: +student.goout,
    Dalc: +student.Dalc,
    Walc: +student.Walc,
    health: +student.health,
    G3: +student.G3,
    subject: 'Portuguese'  // Add subject identifier for portuguese
  }));

  // Combine both datasets
  const combinedData = [...mathLifestyle, ...porLifestyle];

  // Add debug logging
  console.log('Processed Lifestyle Data:', {
    totalRecords: combinedData.length,
    mathRecords: mathLifestyle.length,
    porRecords: porLifestyle.length,
    sampleMath: mathLifestyle[0],
    samplePor: porLifestyle[0]
  });

  return combinedData;
};


