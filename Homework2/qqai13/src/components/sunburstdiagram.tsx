import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Node } from './types';

interface SunburstDiagramProps {
  data: Node;  // Hierarchical data to render
  width: number;
  height: number;
}

const SunburstDiagram: React.FC<SunburstDiagramProps> = ({ data, width, height }) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data) return;

    const radius = Math.min(width, height) / 2;

    // Partition the data for the Sunburst diagram
    const partition = d3.partition<Node>()
      .size([2 * Math.PI, radius]);

    const root = d3.hierarchy<Node>(data)
      .sum(d => d.value || 0);

    partition(root);

    // Custom color map for each label
    const colorMap: { [key: string]: string } = {
      Male: '#2274A5',          // Light blue for Male
      Female: '#ff6f61',        // Coral for Female
      'Non-binary': '#E7EB90',  // Purple for Non-binary
      Personal: '#FADF63',      // Grass green for Personal
      Business: '#E6AF2E',      // Orange for Business
      Auto: '#705D56',          // Yellow for Auto
      Home: '#E799A3',          // Dark purple for Home
    };

    // Arc generator with white center
    const arc = d3.arc<d3.HierarchyRectangularNode<Node>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => d.y0 === 0 ? radius * 0.3 : d.y0)  // Donut hole for center
      .outerRadius(d => d.y1);

    // Adjust viewBox for more space at the top
    const svg = d3.select(ref.current)
      .attr('viewBox', `${-width / 2} ${-height / 2 - 80} ${width} ${height + 100}`)  // Added extra space above and below
      .style('font', '14px monospace');

    // Add the title at the top with more space
    svg.append('text')
       .attr('x', 0) // Center the title horizontally
       .attr('y', -height / 2 - 40) // Moved the title down by increasing y position
       .attr('text-anchor', 'middle') // Center the text
       .style('font-size', '20px') // Larger font for the title
       .style('font-family', 'monospace')
       .style('font-weight', 'bold')
       .text('Financial Data Sunburst Diagram');  // Title text

    // Append the arc paths
    svg.selectAll('path')
      .data(root.descendants().filter(d => d.depth > 0))  // Skip the root node (depth 0)
      .join('path')
      .attr('d', arc)
      .style('fill', d => colorMap[d.data.name] || '#d3d3d3')  // Assign color based on the label, default to gray if not found
      .style('stroke', '#fff')  // Add stroke to separate segments
      .style('stroke-width', '1px')
      .append('title')
      .text(d => `${d.data.name}\n${(d.value! * 100).toFixed(2)}%`);

    // Add labels (Gender and Loan), with horizontal orientation for readability
    svg.selectAll('text.label')
      .data(root.descendants().filter(d => d.depth > 0))  // Skip the root node (depth 0)
      .join('text')
      .attr('class', 'label')
      .attr('transform', d => {
        const radiusOffset = (d.y0 + d.y1) / 2;  // Position based on radius
        return `translate(${radiusOffset * Math.cos((d.x0 + d.x1) / 2 - Math.PI / 2)}, 
                          ${radiusOffset * Math.sin((d.x0 + d.x1) / 2 - Math.PI / 2)})`;  // No rotation for horizontal text
      })
      .attr('text-anchor', 'middle')  // Center the text horizontally
      .attr('dy', '0.35em')
      .style('font-size', d => d.depth === 1 ? '14px' : '14px')
      .style('font-family', 'monospace')  // Larger text for gender labels
      .text(d => d.data.name === 'Non-binary' ? 'Non-Binary' : d.data.name);

  }, [data, width, height]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', height: '100%', paddingTop: '120px' }}>
      <svg ref={ref} width={width} height={height}></svg>
    </div>
  );
};

export default SunburstDiagram;
