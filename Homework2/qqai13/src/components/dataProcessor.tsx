import * as d3 from 'd3';

// FinancialData interface
export interface FinancialData {
  gender: string;
  education: string;
  loan: string;
}

// Define the structure of the hierarchical data for the Sunburst diagram
export interface Node {
  name: string;
  value?: number;  // Leaf nodes have a value (proportion)
  children?: Node[];  // Non-leaf nodes have children
}

// Function to load CSV data
export const loadFinancialData = async (csvPath: string): Promise<FinancialData[]> => {
  return d3.csv(csvPath, (d) => ({
    gender: d['Gender'],
    education: d['Education Level'],
    loan: d['Loan Purpose'],
  }));
};

export const processDataForSunburst = (rawData: FinancialData[]): Node => {
  const totalCount = rawData.length; // Total number of records in the dataset

  // Group by gender first
  const genderGroups = d3.groups(rawData, d => d.gender);

  const root = {
    name: 'Financial Data',
    children: genderGroups.map(([gender, genderGroup]) => {
      const genderTotal = genderGroup.length; // Total entries for this gender

      // Group by loan purpose within each gender
      const loanGroups = d3.groups(genderGroup, d => d.loan);
      
      return {
        name: gender,  // Gender label should be present here
        value: genderTotal / totalCount, // Proportion of this gender out of the total dataset
        children: loanGroups.map(([loan, loanGroup]) => ({
          name: loan,
          value: loanGroup.length / genderTotal * 100, // Proportion of this loan out of this gender
        }))
      };
    })
  };

  console.log('Processed hierarchical data (Gender -> Loan):', JSON.stringify(root, null, 2));

  return root;
};

