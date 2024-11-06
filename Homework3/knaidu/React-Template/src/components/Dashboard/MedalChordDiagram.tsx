import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ProcessedData, DetailedMedal } from './DataProcessor';
import { Card } from '@/components/ui/card';

interface ChordDiagramProps {
  data: ProcessedData;
  size: { width: number; height: number };
  margin: { top: number; right: number; bottom: number; left: number };
}

const ChordDiagram: React.FC<ChordDiagramProps> = ({ data, size, margin }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.detailedMedals.length) return;

    const width = size.width - margin.left - margin.right;
    const height = size.height - margin.top - margin.bottom;
    const radius = Math.min(width, height) / 2;

    // Process data for chord diagram
    const { matrix, names } = processDataForChord(data.detailedMedals);

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Create the chord layout
    const chord = d3.chord()
      .padAngle(0.05)
      .sortSubgroups(d3.descending);

    const chordData = chord(matrix);

    // Create color scales
    const colorScale = d3.scaleOrdinal()
      .domain(names)
      .range(d3.schemeTableau10);

    // Create the arcs
    const arc = d3.arc()
      .innerRadius(radius * 0.9)
      .outerRadius(radius);

    // Create the ribbons
    const ribbon = d3.ribbon()
      .radius(radius * 0.9);

    // Add tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
      .style('pointer-events', 'none');

    // Draw the group arcs
    const group = svg.append('g')
      .selectAll('g')
      .data(chordData.groups)
      .join('g');

    group.append('path')
      .attr('d', arc as any)
      .style('fill', d => colorScale(names[d.index]))
      .style('stroke', '#fff')
      .on('mouseover', function(event, d) {
        d3.select(this).style('opacity', 0.8);
        
        const name = names[d.index];
        const total = d3.sum(matrix[d.index]);
        
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        tooltip.html(`
          <strong>${name}</strong><br/>
          Total Medals: ${total}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 1);
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Add labels
    group.append('text')
      .each(d => {
        d.angle = (d.startAngle + d.endAngle) / 2;
      })
      .attr('dy', '.35em')
      .attr('transform', d => `
        rotate(${(d.angle * 180 / Math.PI - 90)})
        translate(${radius + 10})
        ${d.angle > Math.PI ? 'rotate(180)' : ''}
      `)
      .attr('text-anchor', d => d.angle > Math.PI ? 'end' : 'start')
      .text(d => names[d.index])
      .style('font-size', '10px')
      .style('fill', '#333');

    // Draw the ribbons
    svg.append('g')
      .attr('fill-opacity', 0.67)
      .selectAll('path')
      .data(chordData)
      .join('path')
      .attr('d', ribbon as any)
      .style('fill', d => colorScale(names[d.source.index]))
      .style('stroke', '#fff')
      .style('stroke-width', 0.5)
      .on('mouseover', function(event, d) {
        d3.select(this).style('opacity', 1);
        
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        tooltip.html(`
          <strong>${names[d.source.index]} → ${names[d.target.index]}</strong><br/>
          Medals: ${d.source.value}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 0.67);
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });
  }, [data, size, margin]);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-2">Medal Distribution Network</h2>
      <p className="text-sm text-gray-500 mb-4">
        Relationships between countries and their medal-winning disciplines
      </p>
      <div className="relative w-full" style={{ height: `${size.height}px` }}>
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </Card>
  );
};

// Helper function to process data for chord diagram
function processDataForChord(medals: DetailedMedal[]) {
  // Get unique countries and disciplines
  const countries = Array.from(new Set(medals.map(m => m.country)))
    .sort((a, b) => d3.ascending(a, b));
  const disciplines = Array.from(new Set(medals.map(m => m.discipline)))
    .sort((a, b) => d3.ascending(a, b));

  // Combine all unique names
  const names = [...countries, ...disciplines];

  // Create matrix
  const size = names.length;
  const matrix = Array(size).fill(0).map(() => Array(size).fill(0));

  // Fill matrix with medal counts
  medals.forEach(medal => {
    const sourceIndex = names.indexOf(medal.country);
    const targetIndex = names.indexOf(medal.discipline);
    matrix[sourceIndex][targetIndex]++;
    // Add reverse connection for proper visualization
    matrix[targetIndex][sourceIndex]++;
  });

  return { matrix, names };
}

export default ChordDiagram;