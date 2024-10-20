import * as d3 from 'd3';

// FinancialData interface for input data
export interface FinancialData {
  gender: string;
  education: string;
  employment: string;
  risk: string;
}

// Sankey node and link types
export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

// Processed data for the Sankey diagram
export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

// Function to load CSV data
export const loadFinancialData = async (csvPath: string): Promise<FinancialData[]> => {
  return d3.csv(csvPath, (d) => ({
    gender: d['Gender'],
    education: d['Education Level'],
    employment: d['Employment'],
    risk: d['Risk Rating']
  }));
};

// Function to process the raw CSV data into nodes and links for the Sankey diagram
export const processDataForSankey = (rawData: FinancialData[]): SankeyData => {
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  // Maps to keep track of unique nodes
  const genderNodes = new Map();
  const educationNodes = new Map();
  const employmentNodes = new Map();
  const riskNodes = new Map();

  // Create unique nodes and assign indices
  rawData.forEach((row) => {
    // Gender nodes
    if (!genderNodes.has(row.gender)) {
      genderNodes.set(row.gender, nodes.length);
      nodes.push({ name: row.gender });
    }
    const genderIdx = genderNodes.get(row.gender);

    // Education nodes
    if (!educationNodes.has(row.education)) {
      educationNodes.set(row.education, nodes.length);
      nodes.push({ name: row.education });
    }
    const eduIdx = educationNodes.get(row.education);

    // Employment nodes
    if (!employmentNodes.has(row.employment)) {
      employmentNodes.set(row.employment, nodes.length);
      nodes.push({ name: row.employment });
    }
    const empIdx = employmentNodes.get(row.employment);

    // Risk nodes
    if (!riskNodes.has(row.risk)) {
      riskNodes.set(row.risk, nodes.length);
      nodes.push({ name: row.risk });
    }
    const riskIdx = riskNodes.get(row.risk);

    // Create links
    links.push({ source: genderIdx, target: eduIdx, value: 1 });
    links.push({ source: eduIdx, target: empIdx, value: 1 });
    links.push({ source: empIdx, target: riskIdx, value: 1 });
  });

  return { nodes, links };
};

