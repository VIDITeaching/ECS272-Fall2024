import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

// Interface for each node in the Sunburst hierarchy
interface Node {
  name: string;
  value?: number;
  children?: Node[];
}

interface SunburstProps {
  data: Node; // Pass hierarchical data as a prop
  width: number;
  height: number;
}

const SunburstDiagram: React.FC<SunburstProps> = ({ data, width, height }) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data) return;

    const radius = Math.min(width, height) / 2;

    // Create the partition layout
    const partition = d3.partition<Node>()
      .size([2 * Math.PI, radius]);

    const root = d3.hierarchy<Node>(data)
      .sum(d => d.value || 0);

    partition(root);

    const arc = d3.arc<d3.HierarchyRectangularNode<Node>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1);

    const svg = d3.select(ref.current)
      .attr('viewBox', `${-width / 2} ${-height / 2} ${width} ${height}`)
      .style('font', '10px sans-serif');

    svg.selectAll('path')
      .data(root.descendants())
      .join('path')
      .attr('d', arc)
      .style('fill', d => {
        while (d.depth > 1) d = d.parent!;
        return d3.interpolateRainbow(d.x0 / 2 / Math.PI);
      })
      .append('title')
      .text(d => `${d.data.name}\n${d.value}`);

    svg.selectAll('text')
      .data(root.descendants().filter(d => d.y0 > radius / 3))
      .join('text')
      .attr('transform', d => `
        rotate(${(d.x0 + d.x1) / 2 * 180 / Math.PI - 90})
        translate(${(d.y0 + d.y1) / 2},0)
        rotate(${(d.x0 + d.x1) / 2 > Math.PI ? 180 : 0})
      `)
      .attr('dy', '0.35em')
      .text(d => d.data.name);
  }, [data, width, height]);

  return <svg ref={ref} width={width} height={height}></svg>;
};

export default SunburstDiagram;
