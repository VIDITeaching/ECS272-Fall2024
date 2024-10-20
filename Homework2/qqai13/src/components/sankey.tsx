import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'd3-sankey';

const SankeyDiagram = () => {
  const svgRef = useRef();
  const [data, setData] = useState(null);

  useEffect(() => {
    // Load CSV data
    const loadData = async () => {
      try {
        const csvData = await d3.csv('/data/financial_risk_assessment.csv');
        setData(csvData);
      } catch (error) {
        console.error('Error loading CSV data:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!data) return;

    const sankeyData = processDataForSankey(data);

    // Get container dimensions
    const container = svgRef.current.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight || 600; // Default height if not set

    // Create SVG canvas
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Clear any existing content
    svg.selectAll('*').remove();

    // Add Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '24px')
      .style('font-family', 'monospace')
      .style('font-weight', 'bold')
      .text('Sankey Diagram: Gender to Risk Rating');

    // Create Sankey generator
    const sankeyGenerator = d3Sankey()
      .nodeId(d => d.id)
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[1, 50], [width - 1, height - 6]]); // Adjusted to account for title height

    // Generate Sankey data
    const { nodes, links } = sankeyGenerator({
      nodes: sankeyData.nodes.map(d => Object.assign({}, d)),
      links: sankeyData.links.map(d => Object.assign({}, d)),
    });

    // Define color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Add links
    svg.append('g')
      .attr('transform', 'translate(0,20)') // Adjust if needed
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', d => color(d.source.id))
      .attr('stroke-width', d => Math.max(1, d.width))
      .attr('stroke-opacity', 0.5);

    // Add nodes
    svg.append('g')
      .attr('transform', 'translate(0,20)') // Adjust if needed
      .selectAll('rect')
      .data(nodes)
      .join('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('height', d => d.y1 - d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('fill', d => color(d.id))
      .attr('stroke', '#000')
      .append('title')
      .text(d => `${d.id}\n${d.value}`)
      .style('font-family', 'monospace');

    // Add node labels
    svg.append('g')
      .attr('transform', 'translate(0,20)') // Adjust if needed
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('x', d => d.x0 - 6)
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .text(d => d.id)
      .style('font-family', 'monospace')
      .filter(d => d.x0 < width / 2)
      .attr('x', d => d.x1 + 6)
      .attr('text-anchor', 'start');

  }, [data]);

  // Data processing function remains the same, but with normalization
  const processDataForSankey = (csvData) => {
    const nodesSet = new Set();
    const linksMap = new Map();

    csvData.forEach((row) => {
      // Extract and normalize the relevant fields
      const gender = row['Gender']?.trim().toLowerCase();
      const education = row['Education Level']?.trim().toLowerCase();
      const employment = row['Employment Status']?.trim().toLowerCase();
      const risk = row['Risk Rating']?.trim().toLowerCase();

      // Ensure all fields are present
      if (gender && education && employment && risk) {
        // Add nodes to the set
        nodesSet.add(gender);
        nodesSet.add(education);
        nodesSet.add(employment);
        nodesSet.add(risk);

        // Define link pairs
        const linkPairs = [
          [gender, education],
          [education, employment],
          [employment, risk],
        ];

        // Aggregate link values
        linkPairs.forEach(([source, target]) => {
          const key = `${source}->${target}`;
          if (linksMap.has(key)) {
            linksMap.get(key).value += 1;
          } else {
            linksMap.set(key, { source, target, value: 1 });
          }
        });
      }
    });

    // Convert nodes set to array of objects
    const nodes = Array.from(nodesSet).map((id) => ({ id }));
    // Convert links map to array
    const links = Array.from(linksMap.values());

    console.log('Links:', links); // For debugging

    return { nodes, links };
  };

  return (
    <div style={{ width: '100%', height: '600px', marginBottom: '60px' }}> {/* Set a default height */}
      <svg ref={svgRef} style={{ width: '100%', height: '100%'  }}></svg>
    </div>
  );
};

export default SankeyDiagram;
