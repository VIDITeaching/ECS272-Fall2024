import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  sankey,
  sankeyLinkHorizontal,
  SankeyNode,
  SankeyLink
} from 'd3-sankey';

interface NodeData {
  name: string;
  category: string;
  index?: number;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  value?: number;
}

interface LinkData {
  source: number | NodeData;
  target: number | NodeData;
  value: number;
  width?: number;
}

type SankeyNodeExtended = Required<SankeyNode<NodeData, LinkData>>;
type SankeyLinkExtended = Required<SankeyLink<NodeData, LinkData>>;

const SankeyDiagram: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await d3.csv('/data/Student Mental health.csv');
        
        const width = 5760;
        const height = 1344;
        const margin = { 
          top: 225.39,
          right: 640,
          bottom: 240,
          left: 640 
        };

        // Process data for Sankey diagram
        const nodes: NodeData[] = [
          { name: "18 or younger", category: "age" },
          { name: "19", category: "age" },
          { name: "20", category: "age" },
          { name: "21", category: "age" },
          { name: "22", category: "age" },
          { name: "23", category: "age" },
          { name: "24+", category: "age" },
          { name: "Depression", category: "condition" },
          { name: "Anxiety", category: "condition" },
          { name: "Panic Attack", category: "condition" },
          { name: "No Mental Issues", category: "condition" },
          { name: "Sought Treatment", category: "treatment" },
          { name: "No Treatment", category: "treatment" }
        ];

        const links: LinkData[] = [];
        
        // Process each student's data
        data.forEach(d => {
          const ageGroup = getAgeGroup(d["Age"]);
          if (!ageGroup) return;
          
          const ageIndex = nodes.findIndex(n => n.name === ageGroup);
          const hasCondition = d["Do you have Depression?"] === "Yes" ||
                             d["Do you have Anxiety?"] === "Yes" ||
                             d["Do you have Panic attack?"] === "Yes";

          // Age to Conditions links
          if (d["Do you have Depression?"] === "Yes") {
            addOrUpdateLink(links, ageIndex, 7);
          }
          if (d["Do you have Anxiety?"] === "Yes") {
            addOrUpdateLink(links, ageIndex, 8);
          }
          if (d["Do you have Panic attack?"] === "Yes") {
            addOrUpdateLink(links, ageIndex, 9);
          }
          if (!hasCondition) {
            addOrUpdateLink(links, ageIndex, 10);
          }

          // Conditions to Treatment links
          const soughtTreatment = d["Did you seek any specialist for a treatment?"] === "Yes";
          if (hasCondition) {
            if (d["Do you have Depression?"] === "Yes") {
              addOrUpdateLink(links, 7, soughtTreatment ? 11 : 12);
            }
            if (d["Do you have Anxiety?"] === "Yes") {
              addOrUpdateLink(links, 8, soughtTreatment ? 11 : 12);
            }
            if (d["Do you have Panic attack?"] === "Yes") {
              addOrUpdateLink(links, 9, soughtTreatment ? 11 : 12);
            }
          }
          if (!hasCondition) {
            addOrUpdateLink(links, 10, 12);
          }
        });

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        
        svg.attr("width", width)
           .attr("height", height)
           .attr("viewBox", `0 0 ${width} ${height}`)
           .attr("preserveAspectRatio", "xMidYMid meet");

        const sankeyGenerator = sankey<NodeData, LinkData>()
          .nodeWidth(400)
          .nodePadding(45)
          .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

        sankeyGenerator.nodeSort((a, b) => {
          if (a.category === 'age' && b.category === 'age') {
            const getAgeValue = (name: string) => {
              if (name === "18 or younger") return 18;
              if (name === "24+") return 24;
              return parseInt(name);
            };
            return getAgeValue(a.name) - getAgeValue(b.name);
          }
          return 0;
        });

        const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator({
          nodes: nodes.map((d, i) => ({ ...d, index: i })),
          links: links
        });

        // Color scales
        const ageColorScale = d3.scaleOrdinal<string>()
          .domain(["18 or younger", "19", "20", "21", "22", "23", "24+"])
          .range(['#9c27b0', '#7e57c2', '#5c6bc0', '#42a5f5', '#26c6da', '#26a69a', '#2e7d32']);

        const conditionColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
        const treatmentColors = ['#00C853', '#FF5252'];

        const getNodeColor = (node: SankeyNodeExtended) => {
          if (node.category === 'age') {
            return ageColorScale(node.name);
          } else if (node.category === 'condition') {
            return conditionColors[node.index - 7];
          } else {
            return treatmentColors[node.index - 11];
          }
        };

        // Add links
        const linkGroup = svg.append("g")
           .attr("class", "links")
           .selectAll("path")
           .data(sankeyLinks)
           .enter()
           .append("path")
           .attr("d", sankeyLinkHorizontal())
           .style("fill", "none")
           .style("stroke", (d) => {
             const sourceNode = d.source as SankeyNodeExtended;
             return d3.rgb(getNodeColor(sourceNode)).darker(0.3).toString();
           })
           .style("stroke-width", d => Math.max(2, (d as SankeyLinkExtended).width))
           .style("stroke-opacity", 0.4);

        // Add nodes
        const nodeGroup = svg.append("g")
          .attr("class", "nodes")
          .selectAll("g")
          .data(sankeyNodes)
          .enter()
          .append("g");

        nodeGroup.append("rect")
          .attr("x", d => (d as SankeyNodeExtended).x0!)
          .attr("y", d => (d as SankeyNodeExtended).y0!)
          .attr("height", d => (d as SankeyNodeExtended).y1! - (d as SankeyNodeExtended).y0!)
          .attr("width", d => (d as SankeyNodeExtended).x1! - (d as SankeyNodeExtended).x0!)
          .style("fill", d => getNodeColor(d as SankeyNodeExtended))
          .style("stroke", "#000")
          .style("stroke-width", 2);

        // Add node labels
        nodeGroup.append("text")
          .attr("x", d => {
            const node = d as SankeyNodeExtended;
            return (node.x0! + node.x1!) / 2;
          })
          .attr("y", d => {
            const node = d as SankeyNodeExtended;
            return (node.y1! + node.y0!) / 2;
          })
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .style("font-size", "40px")
          .style("font-weight", "bold")
          .text(d => `${(d as SankeyNodeExtended).name} (${(d as SankeyNodeExtended).value})`);

        // Add category labels
        const categories = [
          { text: "Age Groups", x: margin.left + 400, y: margin.top - 68 },
          { text: "Mental Health Conditions", x: width/2, y: margin.top - 68 },
          { text: "Treatment Status", x: width - margin.right - 400, y: margin.top - 68 }
        ];

        svg.selectAll(".category-label")
          .data(categories)
          .enter()
          .append("text")
          .attr("x", d => d.x)
          .attr("y", d => d.y)
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .style("font-size", "72px")
          .style("font-weight", "bold")
          .text(d => d.text);

        // Add title
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", margin.top / 2 - 113.39)
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .style("font-size", "86px")
          .style("font-weight", "bold")
          .text("Student Mental Health Flow Analysis");

        // Add legend with reduced spacing
        const legendData = [
          { category: "Age Groups", colors: ageColorScale.range(), labels: ageColorScale.domain() },
          { category: "Conditions", colors: conditionColors, labels: ["Depression", "Anxiety", "Panic Attack", "No Mental Issues"] },
          { category: "Treatment", colors: treatmentColors, labels: ["Sought Treatment", "No Treatment"] }
        ];

        const cmToPixels = 37.795275591;
        const legendYOffset = 3 * cmToPixels;

        const legendGroup = svg.append("g")
          .attr("class", "legend")
          .attr("transform", `translate(${margin.left - 113.39 - 188.98 - 188.98}, ${height - margin.bottom + 60 + legendYOffset})`);

        let xOffset = 0;
        legendData.forEach((categoryData, categoryIndex) => {
          // Add category label with slant
          legendGroup.append("text")
            .attr("x", xOffset)
            .attr("y", -20)
            .attr("transform", `rotate(-45, ${xOffset}, -20)`)
            .attr("fill", "white")
            .style("font-size", "72px")
            .style("font-weight", "bold")
            .text(categoryData.category);

          const itemGroup = legendGroup.append("g")
            .attr("transform", `translate(${xOffset}, 20)`);

          // Reduced spacing for labels
          const labelSpacing = categoryData.category === "Treatment" ? 200 : 300; // Reduced from 300/500

          categoryData.colors.forEach((color, i) => {
            const g = itemGroup.append("g")
              .attr("transform", `translate(${i * labelSpacing}, 0)`);

            g.append("rect")
              .attr("width", 40)
              .attr("height", 40)
              .attr("fill", color)
              .attr("stroke", "white")
              .attr("stroke-width", 2);

            g.append("text")
              .attr("x", 60)
              .attr("y", 20)
              .attr("transform", "rotate(-45, 60, 20)")
              .attr("fill", "white")
              .style("font-size", "64px")
              .text(categoryData.labels[i]);
          });

          // Reduced spacing between categories
          xOffset += (categoryData.colors.length * labelSpacing) + 200; // Reduced from 400
        });

      } catch (error) {
        console.error('Error loading CSV data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#1a1a1a' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

const getAgeGroup = (age: string) => {
  const ageNum = parseInt(age);
  if (isNaN(ageNum)) return null;
  if (ageNum <= 18) return "18 or younger";
  if (ageNum === 19) return "19";
  if (ageNum === 20) return "20";
  if (ageNum === 21) return "21";
  if (ageNum === 22) return "22";
  if (ageNum === 23) return "23";
  return "24+";
};

const addOrUpdateLink = (links: LinkData[], source: number, target: number) => {
  const existingLink = links.find(l =>
    (typeof l.source === 'number' ? l.source : l.source.index) === source &&
    (typeof l.target === 'number' ? l.target : l.target.index) === target
  );
  if (existingLink) existingLink.value++;
  else links.push({ source, target, value: 1 });
};

export default SankeyDiagram;