import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface SankeyDiagramProps {
  data: SankeyData;
}

const SankeyDiagram: React.FC<SankeyDiagramProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const width = 600;
    const height = 400;
    const legendHeight = 50;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const sankeyGenerator = sankey<SankeyNode, SankeyLink>()
      .nodeWidth(20)
      .nodePadding(15)
      .extent([[1, 1], [width - 1, height - legendHeight - 10]]);

    const sankeyData = sankeyGenerator({
      nodes: data.nodes.map(d => ({ ...d })),
      links: data.links.map(d => ({ ...d })),
    });

    const { nodes, links } = sankeyData;

    // Draw nodes
    svg.append('g')
      .selectAll('rect')
      .data(nodes)
      .enter()
      .append('rect')
      .attr('x', d => d.x0 ?? 0)
      .attr('y', d => d.y0 ?? 0)
      .attr('width', d => (d.x1 ?? 0) - (d.x0 ?? 0))
      .attr('height', d => (d.y1 ?? 0) - (d.y0 ?? 0))
      .attr('fill', 'steelblue')
      .attr('stroke', '#000');

    // Tooltip for link value display
    const tooltip = d3.select('body')
      .append('div')
      .style('position', 'absolute')
      .style('padding', '4px 8px')
      .style('background', '#fff')
      .style('border', '1px solid #ccc')
      .style('border-radius', '4px')
      .style('visibility', 'hidden')
      .style('font-size', '12px')
      .style('color', '#333');

    // Draw links with hover effect
    svg.append('g')
      .selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke-width', d => Math.max(1, d.width ?? 1))
      .attr('fill', 'none')
      .attr('stroke', '#aaa')
      .attr('opacity', 0.5)
      .on('mouseover', function (event, d) {
        d3.select(this).attr('stroke', '#ff6f61').attr('opacity', 0.8);
        tooltip.style('visibility', 'visible').text(`Value: ${d.value}`);
      })
      .on('mousemove', function (event) {
        tooltip
          .style('top', `${event.pageY - 28}px`)
          .style('left', `${event.pageX + 5}px`);
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke', '#aaa').attr('opacity', 0.5);
        tooltip.style('visibility', 'hidden');
      });

    // Add left-aligned labels for leftmost nodes
    svg.append('g')
      .selectAll('.left-label')
      .data(nodes.filter(d => d.x0 === 1)) // Filter leftmost nodes
      .enter()
      .append('text')
      .attr('x', d => Math.max((d.x0 ?? 0) - 10, 140)) // Position left of the node
      .attr('y', d => ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2) // Center vertically on node
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', '#000')
      .text(d => d.name)
      .style('font-size', '10px')
      .style('pointer-events', 'none');

    // Add right-aligned labels for rightmost nodes
    svg.append('g')
      .selectAll('.right-label')
      .data(nodes.filter(d => d.x1 === width - 1)) // Filter rightmost nodes
      .enter()
      .append('text')
      .attr('x', d => (d.x1 ?? width) + 10) // Position right of the node
      .attr('y', d => ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2) // Center vertically on node
      .attr('dy', '0.35em')
      .attr('text-anchor', 'start')
      .attr('fill', '#000')
      .text(d => d.name)
      .style('font-size', '10px');

    // Legend for thresholds
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(0, ${height - legendHeight + 20})`);

    legend.append('text')
      .attr('class', 'legend-title')
      .attr('y', 0)
      .attr('x', 10)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text("Legend");

    const legendItems = [
      "Mother's/Father's Education: 1-2 = Lower, 3-4 = Higher",
      "Studytime: 1-2 = Shorter, 3-4 = Longer",
      "Grade: <10 = Lower, >=10 = Higher"
    ];

    legend.selectAll(".legend-item")
      .data(legendItems)
      .enter()
      .append('text')
      .attr('class', 'legend-item')
      .attr('y', (d, i) => (i + 1) * 15 + 10)
      .attr('x', 10)
      .style('font-size', '10px')
      .text(d => d);

  }, [data]);

  return (
    <svg ref={svgRef} width={800} height={500} />
  );
};

export default SankeyDiagram;
