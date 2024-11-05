import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

const SankeyDiagram = ({ data, onNodeClick }) => {
  const chartRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    // Set up dimensions and margins
    const width = 600;
    const height = 400;
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };

    d3.select(chartRef.current).selectAll('*').remove();

    // Create SVG container
    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const sankeyGenerator = sankey()
      .nodeWidth(20)
      .nodePadding(10)
      .extent([[1, 1], [width - 1, height - 1]]);

    const sankeyData = sankeyGenerator({
      nodes: data.nodes.map(d => ({ ...d })),
      links: data.links.map(d => ({ ...d }))
    });

    // Colors for Yes and No nodes
    const yesColor = '#ff7f7f'; // Red for "Yes"
    const noColor = '#7fbf7f'; // Green for "No"
    const highlightColor = d3.color(yesColor).darker(1); // Darker shade for highlight

    // Draw links
    svg
      .append('g')
      .selectAll('.link')
      .data(sankeyData.links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', sankeyLinkHorizontal())
      .style('fill', 'none')
      .style('stroke', d => d.color || '#aaa')
      .style('stroke-width', d => Math.max(1, d.width))
      .style('opacity', 0.5);

    // Draw nodes
    const nodes = svg
      .append('g')
      .selectAll('.node')
      .data(sankeyData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node');

    nodes
      .append('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('height', d => d.y1 - d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('fill', d => {
        const baseColor = d.name.includes('Yes') ? yesColor : noColor;
        return d === selectedNode ? d3.color(baseColor).darker(1) : baseColor;
      })
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        // Call onNodeClick with the metric type from the node data
        if (onNodeClick) {
          const metric = d.name.split(':')[0].trim().toLowerCase();
          onNodeClick(metric);
        }
        setSelectedNode(d === selectedNode ? null : d); // Toggle selection
      });

    nodes
      .append('text')
      .attr('x', d => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => (d.x0 < width / 2 ? 'start' : 'end'))
      .text(d => d.name)
      .style('fill', '#333')
      .style('font-size', '14px')
      .style('font-family', 'monospace');

  }, [data, onNodeClick, selectedNode]);

  return <div ref={chartRef}></div>;
};

export default SankeyDiagram;
