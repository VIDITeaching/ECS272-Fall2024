import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

const SankeyDiagram = ({ groupedData }) => {
  const svgRef = useRef();

  useEffect(() => {
    // Log the groupedData to ensure it's correct
    console.log("Received Grouped Data for Sankey Diagram:", groupedData);

    // Clear the SVG if any previous content exists
    d3.select(svgRef.current).selectAll("*").remove();

    // Set the SVG dimensions and margins
    const margin = { top: 10, right: 100, bottom: 10, left: 150 },  // Increased left margin for labels
      width = 800 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Check if groupedData is valid
    if (!groupedData || !groupedData.nodes || !groupedData.links) {
      console.error("Grouped data is missing nodes or links");
      return;
    }

    // Create the Sankey generator
    const sankeyGenerator = sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[1, 1], [width - 1, height - 5]]);

    // Generate nodes and links
    const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator({
      nodes: groupedData.nodes.map(d => ({ ...d })),
      links: groupedData.links.map(d => ({ ...d }))
    });

    // Draw nodes (blocks)
    svg.append('g')
      .selectAll('rect')
      .data(sankeyNodes)
      .enter()
      .append('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('height', d => d.y1 - d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('fill', d => d.color || 'steelblue')
      .attr('stroke', '#000');

    // Draw links (connections)
    svg.append('g')
      .selectAll('path')
      .data(sankeyLinks)
      .enter()
      .append('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke-width', d => Math.max(1, d.width))
      .attr('fill', 'none')
      .attr('stroke', 'lightblue')
      .attr('opacity', 0.6);

    // Add node labels
    svg.append('g')
      .selectAll('text')
      .data(sankeyNodes)
      .enter()
      .append('text')
      .attr('x', d => d.x0 < width / 2 ? d.x0 - 10 : d.x1 + 10)  // Adjust based on node position
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.x0 < width / 2 ? 'end' : 'start')  // Align based on node position
      .attr('font-size', '12px')
      .attr('fill', '#000')  // Ensure the text color is visible
      .text(d => d.name)
      .style('pointer-events', 'none');  // Ensure labels don't interfere with interaction

    // // Optional: Add link labels (showing flow values)
    // svg.append('g')
    //   .selectAll('.link-label')
    //   .data(sankeyLinks)
    //   .enter()
    //   .append('text')
    //   .attr('class', 'link-label')
    //   .attr('x', d => (d.source.x1 + d.target.x0) / 2)
    //   .attr('y', d => (d.source.y1 + d.source.y0) / 2)
    //   .attr('dy', '0.35em')
    //   .attr('text-anchor', 'middle')
    //   .attr('font-size', '10px')
    //   .attr('fill', '#000')  // Ensure text color is visible
    //   .text(d => d.value);  // Show the flow value (optional)

  }, [groupedData]);  // Re-run the effect when groupedData changes

  return <svg ref={svgRef}></svg>;
};

export default SankeyDiagram;