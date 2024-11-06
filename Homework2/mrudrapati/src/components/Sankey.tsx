import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyLink, SankeyNode } from 'd3-sankey';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { ComponentSize, Margin } from '../types';

// Sankey node with empty objects
interface CustomNode extends SankeyNode<{}, {}> {
  name: string;
}

// Link properties
interface CustomLink extends SankeyLink<CustomNode, {}> {
  source: CustomNode | number;
  target: CustomNode | number;
}

export default function Sankey() {
  const [cleanData, setCleanData] = useState<any[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 500, height: 800 });
  const margin: Margin = { top: 60, right: 150, bottom: 10, left: 60 };

  // Debounce resizing to improve performance
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);

  // Container to track
  useResizeObserver({ ref: barRef, onResize });

  // Null value removal
  function removeNullValues(dataset: any[]) {
    return dataset.filter(row => !Object.values(row).some(value => value === null || value === undefined || value === ''));
  }

  // Pre-processing data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await d3.csv('../../data/Student Mental Health.csv', d3.autoType);
        let cleanedData = removeNullValues(data);

        cleanedData = cleanedData.map(d => {
          d["Your current year of Study"] = d["Your current year of Study"].trim().toLowerCase();
          d["What is your CGPA?"] = d["What is your CGPA?"].trim();
          return d;
        });

        setCleanData(cleanedData);
      } catch (error) {
        console.error('Error loading or cleaning CSV:', error);
      }
    };

    loadData();
  }, []);

  // Redraw chart
  useEffect(() => {
    if (cleanData.length === 0 || size.width === 0 || size.height === 0) return;
    d3.select('#sankey-svg').selectAll('*').remove();
    initChart();
  }, [cleanData, size]);

  // Sankey initialization 
  function initChart() {
    const svg = d3.select('#sankey-svg')
      .attr('viewBox', `0 0 ${size.width + 10} ${size.height + 40}`)
      .style('background-color', '#f0f0f0');

    const chartGroup = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const sankeyLayout = sankey<CustomNode, CustomLink>()
      .nodeWidth(30)
      .nodePadding(20)
      .extent([[1, 1], [size.width - margin.left - margin.right - 1, size.height - margin.top - margin.bottom - 1]]);

    const sankeyData = {
      nodes: [] as CustomNode[],
      links: [] as CustomLink[],
    };

    // Node list creation
    const addNode = (name: string): CustomNode => {
      let existingNode = sankeyData.nodes.find(n => n.name === name);
      if (!existingNode) {
        existingNode = { name, x0: 0, y0: 0, x1: 0, y1: 0 };
        sankeyData.nodes.push(existingNode);
      }
      return existingNode;
    };

    // Tracklist of nodes and links
    cleanData.forEach(d => {
      const ageNode = addNode(`Age ${d.Age}`);
      const treatmentNode = addNode(`Treatment ${d["Did you seek any specialist for a treatment?"]}`);
      const depressionNode = addNode(`Depression ${d["Do you have Depression?"]}`);

      sankeyData.links.push({
        source: ageNode,
        target: depressionNode,
        value: 2,
      });

      sankeyData.links.push({
        source: depressionNode,
        target: treatmentNode,
        value: 2,
      });
    });

    //Calculates layout structure
    sankeyLayout(sankeyData);

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Append group for links
    chartGroup.append("g")
      .selectAll("path")
      .data(sankeyData.links)
      .enter()
      .append("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", d => color((d.source as CustomNode).name))
      .attr("stroke-width", d => Math.max(1, (d.width || 0)))
      .attr("fill", "none")
      .attr("opacity", 0.6);

    // Append group for nodes
    chartGroup.append("g")
      .selectAll("rect")
      .data(sankeyData.nodes)
      .enter()
      .append("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("height", d => d.y1 - d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("fill", d => color(d.name))
      .attr("stroke", "#000");

    // Append group for text labels
    chartGroup.append("g")
      .selectAll("text")
      .data(sankeyData.nodes)
      .enter()
      .append("text")
      .attr("x", d => (d.x0 < size.width / 2 ? d.x1 + 6 : d.x0 - 6))
      .attr("y", d => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => (d.x0 < size.width / 2 ? "start" : "end"))
      .text(d => d.name);

    // Title
    chartGroup.append("text")
      .attr("x", (size.width - margin.left - margin.right) / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("Sankey Diagram of Mental Health Conditions");

    // Y axis label
    chartGroup.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (size.height - margin.top - margin.bottom) / 2)
      .attr("dy", "1em")
      .attr("text-anchor", "middle")
      .text("Frequency");

    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${size.width - margin.right + 20}, 50)`); 

    sankeyData.nodes.forEach((node, i) => {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", color(node.name));

      legend.append("text")
        .attr("x", 25)
        .attr("y", i * 20 + 15)
        .text(node.name);
    });
  }

  return (
    <div ref={barRef} style={{ width: '100%', maxWidth: '800px', height: '500px', overflow: 'hidden' }}>
      <svg id="sankey-svg" width="100%" height="100%" />
    </div>
  );
}
