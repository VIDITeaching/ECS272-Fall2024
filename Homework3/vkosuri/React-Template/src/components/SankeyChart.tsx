import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from 'd3-sankey';
import {
  SankeyProps,
  NodeData,
  LinkData,
  ChartDimensions,
  Point
} from '../types';


interface SankeyNodeExtended extends Required<SankeyNode<NodeData, LinkData>> {}
interface SankeyLinkExtended extends Required<SankeyLink<NodeData, LinkData>> {}


interface D3Event extends MouseEvent {
  currentTarget: SVGPathElement | SVGGElement;
}


const getAgeGroup = (age: string): string | null => {
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


const addOrUpdateLink = (links: LinkData[], source: number, target: number): void => {
  const existingLink = links.find(l =>
    (typeof l.source === 'number' ? l.source : l.source.index) === source &&
    (typeof l.target === 'number' ? l.target : l.target.index) === target
  );
  if (existingLink) {
    existingLink.value++;
  } else {
    links.push({ source, target, value: 1 });
  }
};


const SankeyChart: React.FC<SankeyProps> = ({
  onNodeSelect,
  onElementHover,
  filters,
  isTransitioning
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await d3.csv<any>('/data/Student Mental health.csv');
        const width = 5760;
        const height = 1344;
        const margin = {
          top: 149.80,
          right: 640,
          bottom: 240,
          left: 840  // Increased to move diagram right
        };


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


        data.forEach(d => {
          const ageGroup = getAgeGroup(d["Age"]);
          if (!ageGroup) return;
         
          const ageIndex = nodes.findIndex(n => n.name === ageGroup);
          const hasCondition = d["Do you have Depression?"] === "Yes" ||
                             d["Do you have Anxiety?"] === "Yes" ||
                             d["Do you have Panic attack?"] === "Yes";


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


        const ageColorScale = d3.scaleSequential()
        .domain([0, 6])
        .interpolator(d3.interpolate("#1a4c7c", "#90caf9"));


      const conditionColors = {
        "Depression": "#FF69B4",    
        "Anxiety": "#FFA500",      
        "Panic Attack": "#9370DB",  
        "No Mental Issues": "#808080"
      };


      const treatmentColors = {
        "Sought Treatment": "#00C853",
        "No Treatment": "#FF5252"
      };


      const getNodeColor = (node: SankeyNodeExtended): string => {
        if (node.category === 'age') {
          return ageColorScale(nodes.findIndex(n => n.name === node.name));
        } else if (node.category === 'condition') {
          return conditionColors[node.name as keyof typeof conditionColors];
        } else {
          return treatmentColors[node.name as keyof typeof treatmentColors];
        }
      };


      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
     
      svg.attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");


      svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2 - 75.59)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .style("font-size", "72px")
        .style("font-weight", "bold")
        .text("Student Mental Health Flow Analysis");


      const sectionTitles = ["Age Groups", "Mental Health Conditions", "Treatment Status"];
      const sectionWidth = (width - margin.left - margin.right) / 3;
     
      sectionTitles.forEach((title, i) => {
        svg.append("text")
          .attr("x", margin.left + 200 + (sectionWidth / 2) + (i * sectionWidth)) // Added 200 to move section titles right
          .attr("y", margin.top - 50)
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .style("font-size", "54px")
          .style("font-weight", "bold")
          .text(title);
      });


      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 2])
        .on('zoom', (event) => {
          svg.selectAll('g')
            .transition()
            .duration(200)
            .attr('transform', event.transform);
        });


      svg.call(zoom);


      const sankeyGenerator = sankey<NodeData, LinkData>()
        .nodeWidth(400)
        .nodePadding(45)
        .extent([[margin.left + 200, margin.top], [width - margin.right, height - margin.bottom]]);


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


      const linkGroup = svg.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(sankeyLinks)
        .enter()
        .append("path")
        .attr("d", sankeyLinkHorizontal())
        .attr("class", "sankey-link")
        .style("fill", "none")
        .style("stroke", (d) => {
          const sourceNode = d.source as SankeyNodeExtended;
          return d3.rgb(getNodeColor(sourceNode)).darker(0.3).toString();
        })
        .style("stroke-width", d => Math.max(2, (d as SankeyLinkExtended).width))
        .style("stroke-opacity", 0.4)
        .style("cursor", "pointer")
        .on("mouseenter", (event: D3Event, d: SankeyLinkExtended) => {
          d3.selectAll(".sankey-link")
            .transition()
            .duration(300)
            .style("stroke-opacity", 0.1);


          d3.select(event.currentTarget)
            .transition()
            .duration(300)
            .style("stroke-opacity", 0.8);


          const source = d.source as SankeyNodeExtended;
          const target = d.target as SankeyNodeExtended;


          onElementHover({
            type: 'link',
            name: `${source.name} → ${target.name}`,
            value: d.value,
            coordinates: { x: event.pageX, y: event.pageY }
          }, event as unknown as React.MouseEvent);
        })
        .on("mouseleave", (event: D3Event) => {
          d3.selectAll(".sankey-link")
            .transition()
            .duration(300)
            .style("stroke-opacity", 0.4);


          onElementHover(null, event as unknown as React.MouseEvent);
        });


      const nodeGroup = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(sankeyNodes)
        .enter()
        .append("g")
        .attr("class", "node-group")
        .style("cursor", "pointer")
        .on("click", (event: D3Event, d: SankeyNodeExtended) => {
          onNodeSelect(d);
        })
        .on("mouseenter", (event: D3Event, d: SankeyNodeExtended) => {
          const connectedLinks = sankeyLinks.filter(link =>
            (link.source as SankeyNodeExtended).index === d.index ||
            (link.target as SankeyNodeExtended).index === d.index
          );


          d3.selectAll(".sankey-link")
            .transition()
            .duration(300)
            .style("stroke-opacity", l =>
              connectedLinks.includes(l as any) ? 0.8 : 0.1
            );


          onElementHover({
            type: 'node',
            category: d.category,
            name: d.name,
            value: d.value!,
            coordinates: { x: event.pageX, y: event.pageY }
          }, event as unknown as React.MouseEvent);
        })
        .on("mouseleave", (event: D3Event) => {
          d3.selectAll(".sankey-link")
            .transition()
            .duration(300)
            .style("stroke-opacity", 0.4);


          onElementHover(null, event as unknown as React.MouseEvent);
        });


      nodeGroup.append("rect")
        .attr("x", d => (d as SankeyNodeExtended).x0!)
        .attr("y", d => (d as SankeyNodeExtended).y0!)
        .attr("height", d => (d as SankeyNodeExtended).y1! - (d as SankeyNodeExtended).y0!)
        .attr("width", d => (d as SankeyNodeExtended).x1! - (d as SankeyNodeExtended).x0!)
        .style("fill", d => getNodeColor(d as SankeyNodeExtended))
        .style("stroke", "#000")
        .style("stroke-width", 2);


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


      // Updated legend positioning and styling
      const legendGroups = [
        {
          title: "Age Groups",
          items: nodes.filter(n => n.category === "age").map((n, i) => ({
            color: ageColorScale(i),
            label: n.name
          }))
        },
        {
          title: "Mental Health Conditions",
          items: nodes.filter(n => n.category === "condition").map(n => ({
            color: conditionColors[n.name as keyof typeof conditionColors],
            label: n.name
          }))
        },
        {
          title: "Treatment Status",
          items: nodes.filter(n => n.category === "treatment").map(n => ({
            color: treatmentColors[n.name as keyof typeof treatmentColors],
            label: n.name
          }))
        }
      ];


      // Adjusted starting position and spacing
      let currentY = margin.top - 20; // Moved up more
      const xPosition = 124.41;
      const itemSpacing = 80; // Increased spacing between items
      const groupSpacing = 60; // Increased spacing between groups


      legendGroups.forEach((group, groupIndex) => {
        const legendGroup = svg.append("g")
          .attr("class", "legend-group")
          .attr("transform", `translate(${xPosition}, ${currentY})`);


        // Add group title with larger font
        legendGroup.append("text")
          .attr("x", 150)
          .attr("y", 0)
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .style("font-size", "56px") // Increased from 48px
          .style("font-weight", "bold")
          .text(group.title);


        // Add legend items
        const items = legendGroup.selectAll(".legend-item")
          .data(group.items)
          .enter()
          .append("g")
          .attr("class", "legend-item")
          .attr("transform", (d, i) => `translate(0, ${i * itemSpacing + 50})`); // Increased spacing


        // Add colored rectangles (slightly larger)
        items.append("rect")
          .attr("width", 55) // Increased from 50
          .attr("height", 55) // Increased from 50
          .attr("rx", 4)
          .attr("fill", d => d.color);


        // Add labels with larger font
        items.append("text")
          .attr("x", 75)
          .attr("y", 40)
          .attr("fill", "white")
          .style("font-size", "44px") // Increased from 36px
          .text(d => d.label);


        // Update currentY for next group
        currentY += (group.items.length * itemSpacing) + groupSpacing + 60;
      });


    } catch (error) {
      console.error('Error loading CSV data:', error);
    }
  };


  fetchData();
}, [filters, onNodeSelect, onElementHover]);


return (
  <div style={{ width: '100%', height: '100%', backgroundColor: '#1a1a1a' }}>
    <svg ref={svgRef} />
  </div>
);
};


export default SankeyChart;
