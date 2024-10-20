import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'd3-sankey';

interface MySankeyNode {
  name: string;
}

interface MySankeyLink {
  source: number;
  target: number;
  value: number;
}

interface MySankeyData {
  nodes: MySankeyNode[];
  links: MySankeyLink[];
}

const SankeyDiagram: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<MySankeyData | null>(null);
  const [size, setSize] = useState({ width: 900, height: 500 }); // Default size

  // Function to handle resizing
  const updateSize = () => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setSize({ width: clientWidth, height: clientHeight });
    }
  };

  // Listen for window resizing and adjust the size of the diagram
  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

    // Inside your component
    useEffect(() => {
      // Load data from CSV and preprocess it
      const loadData = async () => {
        const csvData = await loadFinancialData('../../data/financial_risk_assessment.csv');

        // Generate nodes and links from the CSV data
        const sankeyData = processDataForSankey(csvData);
        setData(sankeyData);
      };

      loadData();
    }, []);

  useEffect(() => {
    if (!data || size.width === 0 || size.height === 0) return;

    const svg = d3.select(svgRef.current)
      .attr('width', size.width)
      .attr('height', size.height);

    const sankeyGenerator = d3Sankey<MySankeyNode, MySankeyLink>()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[1, 1], [size.width - 1, size.height - 1]]);

    const { nodes, links } = sankeyGenerator({
      nodes: data.nodes.map(d => Object.assign({}, d)),
      links: data.links.map(d => Object.assign({}, d)),
    });

    // Clear previous content
    svg.selectAll('*').remove();

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Add links
    svg.append('g')
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', (d) => color((d.source as MySankeyNode).name))
      .attr('stroke-width', d => Math.max(1, d.width))
      .attr('stroke-opacity', 0.5);

    // Add nodes
    const node = svg.append('g')
      .selectAll('rect')
      .data(nodes)
      .join('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => color(d.name))
      .attr('stroke', '#000')
      .attr('stroke-width', 1);

    node.append('title')
      .text(d => `${d.name}\n${d.value}`);

    // Add labels
    svg.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('x', d => d.x0 < size.width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.x0 < size.width / 2 ? 'start' : 'end')
      .text(d => d.name);

    // Add layer labels (Gender, Education, Employment, Risk)
    const nodeGroups = ['Gender', 'Education Level', 'Employment', 'Risk Rating'];
    const layerPositions = [size.width * 0.05, size.width * 0.30, size.width * 0.55, size.width * 0.80];

    nodeGroups.forEach((group, i) => {
      svg.append('text')
        .attr('x', layerPositions[i])
        .attr('y', 20) // Adjust this value for vertical placement
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text(group);
    });

  }, [data, size]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

// Function to process CSV data into Sankey nodes and links
function processDataForSankey(csvData: any[]): MySankeyData {
  const nodes: MySankeyNode[] = [];
  const links: MySankeyLink[] = [];

  const genderNodes = new Map();
  const educationNodes = new Map();
  const employmentNodes = new Map();
  const riskNodes = new Map();

  // Create unique nodes and assign indices
  csvData.forEach((row) => {
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

    // Create links: Gender -> Education, Education -> Employment, Employment -> Risk
    links.push({ source: genderIdx, target: eduIdx, value: 1 });
    links.push({ source: eduIdx, target: empIdx, value: 1 });
    links.push({ source: empIdx, target: riskIdx, value: 1 });
  });

  return { nodes, links };
}

export default SankeyDiagram;
