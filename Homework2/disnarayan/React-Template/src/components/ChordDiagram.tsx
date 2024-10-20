import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DataRow {
  Age: string;
  'Do you have Depression?': string;
  'Do you have Anxiety?': string;
  'Do you have Panic attack?': string;
  [key: string]: string; // Allow additional string indexing
}

const ChordDiagram: React.FC = () => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const rawData = await d3.csv('/data/StudentMentalhealth.csv');
      const data = rawData as unknown as DataRow[]; // Type assertion
      if (data) createChordDiagram(data);
    };

    fetchData();
  }, []);

  const createChordDiagram = (data: DataRow[]) => {
    const svg = d3.select(ref.current);
    const width = 900; // Increased width for better spacing
    const height = 900; // Increased height for better spacing
    const innerRadius = Math.min(width, height) * 0.3; // Reduced inner radius
    const outerRadius = innerRadius * 1.1;

    svg.attr('width', width).attr('height', height);

    const ageGroups = ['Under 20', '20-25', '25-30', '30+'];
    const conditions = ['Depression', 'Anxiety', 'Panic attack'];
    const nodes = [...ageGroups, ...conditions];

    const matrix = Array(nodes.length).fill(null).map(() => Array(nodes.length).fill(0));

    data.forEach((d) => {
      const ageGroup = getAgeGroup(parseInt(d.Age));
      const ageIndex = ageGroups.indexOf(ageGroup);

      conditions.forEach((condition, conditionIndex) => {
        if (d[`Do you have ${condition}?`] === 'Yes') {
          matrix[ageIndex][ageGroups.length + conditionIndex]++;
          matrix[ageGroups.length + conditionIndex][ageIndex]++;
        }
      });
    });

    const chord = d3.chord()
      .padAngle(0.05)
      .sortSubgroups(d3.descending);

    const chords = chord(matrix);

    const arc = d3.arc<d3.ChordGroup>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const ribbon = d3.ribbon<d3.Chord, d3.ChordSubgroup>()
      .radius(innerRadius);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`)
      .datum(chords);

    const group = g.append('g')
      .selectAll('g')
      .data(chords.groups)
      .join('g');

    group.append('path')
      .attr('fill', (d) => color(d.index.toString()))
      .attr('stroke', 'white')
      .attr('d', arc);

    // Improved label positioning and styling
    group.append('text')
      .each((d) => { (d as any).angle = (d.startAngle + d.endAngle) / 2; })
      .attr('dy', '.35em')
      .attr('transform', (d) => {
        const angle = ((d as any).angle * 180 / Math.PI - 90);
        let radius = outerRadius + 40; // Increased default distance from the outer ring
        
        // If the label is in the bottom half, move it further out
        if (angle > 90 || angle < -90) {
          radius += 30; // Increased value to move lower labels further out
        }
        
        const x = radius * Math.cos(angle * Math.PI / 180);
        const y = radius * Math.sin(angle * Math.PI / 180);
        return `translate(${x},${y}) rotate(${angle > 90 || angle < -90 ? angle + 180 : angle})`;
      })
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .text((d) => nodes[d.index])
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', (d) => color(d.index.toString()));

    g.append('g')
      .attr('fill-opacity', 0.67)
      .selectAll('path')
      .data(chords)
      .join('path')
      .attr('d', ribbon)
      .attr('fill', (d) => color(d.source.index.toString()))
      .attr('stroke', 'white');

    // Add tooltips
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('border', 'solid')
      .style('border-width', '1px')
      .style('border-radius', '5px')
      .style('padding', '10px');

    g.selectAll('path')
      .on('mouseover', (event: MouseEvent, d: d3.Chord) => {
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
        tooltip.html(`${nodes[d.source.index]} to ${nodes[d.target.index]}: ${d.source.value}`)
          .style('left', (event.pageX) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });
  };

  const getAgeGroup = (age: number): string => {
    if (age < 20) return 'Under 20';
    if (age >= 20 && age < 25) return '20-25';
    if (age >= 25 && age < 30) return '25-30';
    return '30+';
  };

  return <svg ref={ref}></svg>;
};

export default ChordDiagram;