import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'd3-sankey';

// Define the types for nodes and links
interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

const SankeyDiagram: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<SankeyData | null>(null); // Add state for data
  const width = 700;
  const height = 400;

  // Load and process the data
  useEffect(() => {
    const loadDataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/financial_risk_assessment.csv', d => ({
          gender: d.Gender,
          education: d['Education Level'],
          employment: d.Employment
        }));

        // Transform CSV data to Sankey structure (this is a simplified example)
        const nodes = Array.from(new Set(csvData.flatMap(d => [d.gender, d.education, d.employment]))).map(name => ({ name }));
        const links: SankeyLink[] = csvData.map(d => ({
          source: nodes.findIndex(node => node.name === d.gender),
          target: nodes.findIndex(node => node.name === d.education),
          value: 1, // Assuming a value of 1 for each transition
        }));

        setData({ nodes, links });
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };

    loadDataFromCSV();
  }, []);

  useEffect(() => {
    if (!data) return; // Wait for data to be loaded

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const sankeyGenerator = d3Sankey<SankeyNode, SankeyLink>()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[1, 1], [width - 1, height - 1]]);

    const { nodes, links } = sankeyGenerator({
      nodes: data.nodes.map(d => Object.assign({}, d)), // Copy nodes
      links: data.links.map(d => Object.assign({}, d))  // Copy links
    });

    svg.selectAll('*').remove(); // Clear the previous diagram

    // Create color scale for nodes
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create gradients for links
    const defs = svg.append('defs');

    defs.selectAll('linearGradient')
      .data(links)
      .enter()
      .append('linearGradient')
      .attr('id', (d, i) => `gradient-${i}`)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', d => d.source.x0)
      .attr('x2', d => d.target.x0)
      .selectAll('stop')
      .data(d => [
        { offset: '0%', color: color((d.source as SankeyNode).name) },
        { offset: '60%', color: color((d.target as SankeyNode).name) }
      ])
      .enter().append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color);

    // Add links with gradient colors and lower opacity
    svg.append('g')
      .selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', (d, i) => `url(#gradient-${i})`) // Apply the gradient to each link
      .attr('stroke-width', d => Math.max(1, d.width))
      .attr('stroke-opacity', 0.05); // Reduce opacity

    // Add nodes
    const node = svg.append('g')
      .selectAll('rect')
      .data(nodes)
      .enter()
      .append('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => color(d.name))
      .attr('stroke', '#000')
      .attr('fill-opacity', 0.8); // Slightly transparent nodes

    // Add node labels
    node.append('title')
      .text(d => `${d.name}\n${d.value}`);

    svg.append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('x', d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
      .text(d => d.name);

  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default SankeyDiagram;
