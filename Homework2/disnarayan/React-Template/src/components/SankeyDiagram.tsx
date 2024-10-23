import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyGraph, SankeyLink, SankeyNode } from 'd3-sankey';
import { csv } from 'd3-fetch';

interface RawNode {
  name: string;
}

interface RawLink {
  source: number;
  target: number;
  value: number;
}

type ProcessedNode = SankeyNode<RawNode, RawLink>;
type ProcessedLink = SankeyLink<ProcessedNode, RawLink>;

const SankeyDiagram: React.FC = () => {
  const [data, setData] = useState<{ nodes: RawNode[], links: RawLink[] }>({ nodes: [], links: [] });
  const svgRef = useRef<SVGSVGElement>(null);

  const normalizeYearOfStudy = (year: string): string => {
    const normalized = year.toLowerCase().replace(/\s+/g, '');
    return normalized.startsWith('year') ? 'Year ' + normalized.replace('year', '') : year;
  };

  useEffect(() => {
    csv('/data/StudentMentalhealth.csv').then((csvData) => {
      const nodes: RawNode[] = [];
      const links: { [key: string]: number } = {};

      const mentalHealthConditions = [
        { name: 'Depression', column: 'Do you have Depression?' },
        { name: 'Anxiety', column: 'Do you have Anxiety?' },
        { name: 'Panic Attack', column: 'Do you have Panic attack?' }
      ];

      csvData.forEach(row => {
        const course = row['What is your course?'];
        const year = normalizeYearOfStudy(row['Your current year of Study']);
        
        [course, year].forEach(item => {
          if (!nodes.some(node => node.name === item)) {
            nodes.push({ name: item });
          }
        });

        const courseYearKey = `${course}|${year}`;
        links[courseYearKey] = (links[courseYearKey] || 0) + 1;

        mentalHealthConditions.forEach(condition => {
          const hasCondition = row[condition.column] === 'Yes';
          const conditionNode = `${condition.name} - ${hasCondition ? 'Yes' : 'No'}`;
          
          if (!nodes.some(node => node.name === conditionNode)) {
            nodes.push({ name: conditionNode });
          }

          const yearConditionKey = `${year}|${conditionNode}`;
          links[yearConditionKey] = (links[yearConditionKey] || 0) + 1;
        });
      });

      const sankeyLinks: RawLink[] = Object.entries(links).map(([key, value]) => {
        const [source, target] = key.split('|');
        return {
          source: nodes.findIndex(node => node.name === source),
          target: nodes.findIndex(node => node.name === target),
          value: value
        };
      });

      setData({ nodes, links: sankeyLinks });
    });
  }, []);

  useEffect(() => {
    if (data.nodes.length === 0 || !svgRef.current) return;

    // Reduced margins and overall dimensions
    const margin = { top: 40, right: 80, bottom: 20, left: 80 };
    const width = 900 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const sankeyGenerator = sankey<RawNode, RawLink>()
      .nodeWidth(15)
      .nodePadding(8)  // Slightly reduced padding
      .extent([[0, 0], [width, height]]);

    const { nodes, links } = sankeyGenerator(data as unknown as SankeyGraph<RawNode, RawLink>);

    // Color scales
    const courseColor = d3.scaleOrdinal(d3.schemeCategory10);
    const yearColor = d3.scaleOrdinal(d3.schemeSet3);
    const conditionColors = {
      'Depression - Yes': '#ff7f7f',
      'Depression - No': '#7fbf7f',
      'Anxiety - Yes': '#ff7f7f',
      'Anxiety - No': '#7fbf7f',
      'Panic Attack - Yes': '#ff7f7f',
      'Panic Attack - No': '#7fbf7f'
    };

    const getNodeColor = (name: string) => {
      if (name.startsWith('Year')) return yearColor(name);
      if (Object.keys(conditionColors).includes(name)) return conditionColors[name as keyof typeof conditionColors];
      return courseColor(name);
    };

    // Draw nodes
    svg.append('g')
      .selectAll('rect')
      .data(nodes)
      .join('rect')
      .attr('x', d => d.x0!)
      .attr('y', d => d.y0!)
      .attr('height', d => d.y1! - d.y0!)
      .attr('width', d => d.x1! - d.x0!)
      .attr('fill', d => getNodeColor(d.name))
      .append('title')
      .text(d => `${d.name}\nCount: ${d.value}`);

    // Draw links
    const link = svg.append('g')
      .attr('fill', 'none')
      .attr('stroke-opacity', 0.5)
      .selectAll('g')
      .data(links)
      .join('g')
      .style('mix-blend-mode', 'multiply');

    link.append('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', d => getNodeColor((d.source as ProcessedNode).name))
      .attr('stroke-width', d => Math.max(1, d.width!));

    link.append('title')
      .text(d => `${(d.source as ProcessedNode).name} → ${(d.target as ProcessedNode).name}\nCount: ${d.value}`);

    // Add node labels
    svg.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('x', d => d.x0! < width / 2 ? d.x1! + 6 : d.x0! - 6)
      .attr('y', d => (d.y1! + d.y0!) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.x0! < width / 2 ? 'start' : 'end')
      .text(d => d.name)
      .style('font-size', '11px');  // Slightly reduced font size

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')  // Slightly reduced title size
      .style('font-weight', 'bold')
      .text('Course to Year of Study to Mental Health Conditions Flow');

  }, [data]);

  return (
    <div className="chart-container">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default SankeyDiagram;