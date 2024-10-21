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

      csvData.forEach(row => {
        const course = row['What is your course?'];
        const year = normalizeYearOfStudy(row['Your current year of Study']);
        const mentalHealth = row['Do you have Depression?'] === 'Yes' ? 'Depression' : 'No Depression';

        [course, year, mentalHealth].forEach(item => {
          if (!nodes.some(node => node.name === item)) {
            nodes.push({ name: item });
          }
        });

        const linkKey1 = `${course}|${year}`;
        const linkKey2 = `${year}|${mentalHealth}`;

        links[linkKey1] = (links[linkKey1] || 0) + 1;
        links[linkKey2] = (links[linkKey2] || 0) + 1;
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

    const margin = { top: 50, right: 20, bottom: 20, left: 20 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const sankeyGenerator = sankey<RawNode, RawLink>()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[0, 0], [width, height]]);

    const { nodes, links } = sankeyGenerator(data as unknown as SankeyGraph<RawNode, RawLink>);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    svg.append('g')
      .selectAll('rect')
      .data(nodes)
      .join('rect')
      .attr('x', d => d.x0!)
      .attr('y', d => d.y0!)
      .attr('height', d => d.y1! - d.y0!)
      .attr('width', d => d.x1! - d.x0!)
      .attr('fill', d => color(d.name))
      .append('title')
      .text(d => `${d.name}\n${d.value}`);

    const link = svg.append('g')
      .attr('fill', 'none')
      .attr('stroke-opacity', 0.5)
      .selectAll('g')
      .data(links)
      .join('g')
      .style('mix-blend-mode', 'multiply');

    link.append('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', d => color((d.source as ProcessedNode).name))
      .attr('stroke-width', d => Math.max(1, d.width!));

    link.append('title')
      .text(d => `${(d.source as ProcessedNode).name} → ${(d.target as ProcessedNode).name}\n${d.value}`);

    svg.append('g')
      .style('font', '10px sans-serif')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('x', d => d.x0! < width / 2 ? d.x1! + 6 : d.x0! - 6)
      .attr('y', d => (d.y1! + d.y0!) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.x0! < width / 2 ? 'start' : 'end')
      .text(d => d.name);

    // Improved title positioning and styling
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text('Course to Year of Study to Mental Health Condition Flow');

  }, [data]);

  return (
    <div className="chart-container">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default SankeyDiagram;