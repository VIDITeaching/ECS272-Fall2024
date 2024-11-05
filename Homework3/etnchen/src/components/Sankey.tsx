import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, SankeyGraph, sankeyLinkHorizontal } from 'd3-sankey';

// Define Node and Link interfaces
interface Node {
  name: string;
}

interface Link {
  source: number;  // index of source node
  target: number;  // index of target node
  value: number;   // value/weight of the link
}

interface SankeyData {
  nodes: Node[];
  links: Link[];
}

interface SankeyDiagramProps {
  selectedCountries: string[]; // Add selected countries prop
}

const SankeyDiagram: React.FC<SankeyDiagramProps> = ({ selectedCountries }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const fetchDataAndDraw = async () => {
      // Load the CSV file
      const csvData = await d3.csv('/data/olymic/medals_total.csv');

      // Filter data for selected countries
      const filteredData = csvData.filter((d: any) => selectedCountries.includes(d.country));
      if (filteredData.length === 0) return;


      // Sort the data by total medals and take the top 10 countries
      const top10Countries = csvData // I was thinking if I should use the top ten data
        .sort((a: any, b: any) => +b.Total - +a.Total)
        .slice(0, 5);
      const nodes: Node[] = [];
      const links: Link[] = [];

      // Add medal type nodes (Gold, Silver, Bronze)
      const medalTypes = ['Gold', 'Silver', 'Bronze'];
      medalTypes.forEach((medal) => nodes.push({ name: medal }));

      filteredData.forEach((d: any) => {
        // Add country node
        nodes.push({ name: d.country });

        // Add links from the country to medal types
        links.push({ source: nodes.length - 1, target: 0, value: +d.Gold_Medal });   // Gold medals
        links.push({ source: nodes.length - 1, target: 1, value: +d.Silver_Medal }); // Silver medals
        links.push({ source: nodes.length - 1, target: 2, value: +d.Bronze_Medal }); // Bronze medals
      });

      const data: SankeyData = { nodes, links };

      const width = 500;
      const height = 400;

      // Create SVG
      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .append('g');

      svg.selectAll("*").remove();


      const color = d3.scaleOrdinal()
        .domain(medalTypes)
        .range(['#FFD700', '#C0C0C0', '#CD7F32']); // Gold, Silver, Bronze colors

      // Initialize Sankey diagram
      const sankeyGenerator = sankey<Node, Link>()
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[1, 1], [width - 1, height - 6]]);

      // Generate the Sankey layout with nodes and links
      const sankeyGraph: SankeyGraph<Node, Link> = sankeyGenerator({
        nodes: data.nodes.map(d => Object.assign({}, d)),
        links: data.links.map(d => Object.assign({}, d)),
      });

      // Draw nodes
      svg.append('g')
        .selectAll('rect')
        .data(sankeyGraph.nodes)
        .enter()
        .append('rect')
        .attr('x', d => d.x0)
        .attr('y', d => d.y0)
        .attr('height', d => d.y1 - d.y0)
        .attr('width', d => d.x1 - d.x0)
        .attr('fill', d => medalTypes.includes(d.name) ? color(d.name) : '#4682B4')  // Color medals, blue for countries
        .append('title')
        .text(d => `${d.name}\n${d.value}`);
      // Add labels for nodes
      svg.append('g')
        .selectAll('text')
        .data(sankeyGraph.nodes)
        .enter()
        .append('text')
        .attr('x', d => (d.x0 < width / 2) ? d.x1 + 6 : d.x0 - 6)
        .attr('y', d => (d.y1 + d.y0) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', d => (d.x0 < width / 2) ? 'start' : 'end')
        .text(d => d.name)
        .style('font-size', '10px')
        .style('fill', '#333');
      // Draw links
      svg.append('g')
        .attr('fill', 'none')
        .selectAll('path')
        .data(sankeyGraph.links)
        .enter()
        .append('path')
        .attr('d', sankeyLinkHorizontal())
        .attr('stroke', 'gray')
        .attr('stroke-width', d => Math.max(1, d.width))
        .attr('opacity', 0.5)
        .append('title')
        .text(d => `${d.source.name} → ${d.target.name}\n${d.value}`);
    };

    fetchDataAndDraw(); // Call the async function to fetch and draw the data
    // Cleanup function
    return () => {
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove(); // Clear SVG content on cleanup
    };
  }, [selectedCountries]);

  return <svg ref={svgRef}></svg>; // Add a group element for drawing
};

export default SankeyDiagram;
