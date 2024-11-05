import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Node } from './types';
import { round } from 'lodash';

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

    const partition = d3.partition<Node>()
      .size([2 * Math.PI, radius]);

    const root = d3.hierarchy<Node>(data)
      .sum(d => d.value || 0)
      .sort((a, b) => a.value! - b.value!);  // Sort by value (smallest first)

    partition(root);

    // Custom color map for each label
    const colorMap: { [key: string]: string } = {
      Male: '#2274A5',          // Light blue for Male
      Female: '#ff6f61',        // Coral for Female
      'Non-binary': '#E7EB90',  // Yellow for Non-binary
      Personal: '#FADF63',      // Yellow for Personal
      Business: '#9DD9D2',      // Light blue for Business
      Auto: '#E88873',          // Coral for Auto
      Home: '#E799A3',          // Pink for Home
    };

    // Arc generator with white center
    const arc = d3.arc<d3.HierarchyRectangularNode<Node>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => d.y0 === 0 ? radius * 0.3 : d.y0)  
      .outerRadius(d => d.y1);

    // Adjust viewBox for more space at the top
    const svg = d3.select(ref.current)
      .attr('viewBox', `${-width / 2} ${-height / 2 - 80} ${width} ${height + 100}`)  
      .style('font', '14px monospace');

    // Add the title at the top with more space
    svg.append('text')
       .attr('x', -70) 
       .attr('y', -height / 2 - 60) 
       .attr('text-anchor', 'middle') 
       .style('font-size', '24px') 
       .style('font-family', 'monospace')
       .style('font-weight', 'bold')
       .text('Proportion of Loan Type in Each Gender');  

    // Append the arc paths
    svg.selectAll('path')
      .data(root.descendants().filter(d => d.depth > 0))  
      .join('path')
      .attr('d', arc)
      .style('fill', d => colorMap[d.data.name] || '#d3d3d3')  
      .style('stroke', '#fff')  
      .style('stroke-width', '1px')
      .append('title')
      .text(d => `${d.data.name}\n${(d.value! * 100).toFixed(2)}%`);

      svg.selectAll('text.label')
      .data(root.descendants().filter(d => d.depth > 0))  
      .join('g') // Grouping for text elements
      .attr('class', 'label')
      .attr('transform', d => {
        const radiusOffset = (d.y0 + d.y1) / 2;  
        return `translate(${radiusOffset * Math.cos((d.x0 + d.x1) / 2 - Math.PI / 2)}, 
                          ${radiusOffset * Math.sin((d.x0 + d.x1) / 2 - Math.PI / 2)})`;  
      })
      .attr('text-anchor', 'middle')
      .call(g => {
        // First text element for the name
        g.append('text')
          .attr('dy', '-0.5em')  // Shift name up slightly
          .style('font-size', d => d.depth === 1 ? '18px' : '16px')
          .style('font-family', 'monospace')
          .text(d => d.data.name === 'Non-binary' ? 'Non-Binary' : d.data.name);
        
        // Second text element for the value
        g.append('text')
          .attr('dy', '0.85em')  
          .style('font-size', '18px')
          .style('font-family', 'monospace')
          .text(d => d.depth > 1 ? `(${round(d.value , 1)+"%"})` : "");  
      });
    

    // Add Legend
    const legendSize = 18;
    const legend = svg.append('g')
      .attr('transform', `translate(${width / 2 - 70}, ${-height / 2 - 80})`);  // Position legend at top-left

    // Loop through the color map to create the legend
    Object.keys(colorMap).forEach((key, i) => {
      // Append color square
      legend.append('rect')
        .attr('x', 0)
        .attr('y', i * (legendSize + 5))
        .attr('width', legendSize)
        .attr('height', legendSize)
        .attr('fill', colorMap[key]);

      // Append text
      legend.append('text')
        .attr('x', legendSize + 5)
        .attr('y', i * (legendSize + 5) + legendSize / 2)
        .attr('dy', '0.35em')  
        .style('font-size', '16px')
        .style('font-family', 'monospace')
        .text(key);
    });

  }, [data, width, height]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', height: '100%', paddingTop: '80px' }}>
      <svg ref={ref} width={width} height={height}></svg>
    </div>
  );
};

export default SunburstDiagram;
