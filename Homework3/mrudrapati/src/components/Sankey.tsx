import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import {
  sankey,
  sankeyLinkHorizontal,
  SankeyLink,
  SankeyNode,
  sankeyLeft,
} from 'd3-sankey';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { ComponentSize, Margin } from '../types';

interface CustomNode extends SankeyNode<{}, {}> {
  name: string;
  bbox?: DOMRect;
}

// Link properties
interface CustomLink extends SankeyLink<CustomNode, {}> {
  source: CustomNode | number;
  target: CustomNode | number;
}

interface SankeyProps {
  selectedCondition: string;
}

export default function Sankey({ selectedCondition }: SankeyProps) {
  const [cleanData, setCleanData] = useState<any[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 900, height: 400 });
  const margin: Margin = { top: 60, right: 10, bottom: 90, left: 90 };

  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);

  useResizeObserver({ ref: barRef, onResize });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await d3.csv(
          '../../data/Cleaned_Student_Mental_Health.csv',
          d3.autoType
        );

        setCleanData(data);
      } catch (error) {
        console.error('Error loading cleaned CSV:', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (cleanData.length === 0 || size.width === 0 || size.height === 0) return;
    d3.select('#sankey-svg').selectAll('*').remove();
    d3.select(barRef.current).select('#sankey-tooltip').remove(); 
    initChart();
  }, [cleanData, size, selectedCondition]);

  // Function to bin CGPA values into ranges
  function getCgpabin(cgpa: number): string {
    if (cgpa >= 0 && cgpa <= 1.99) return '0-1.99';
    if (cgpa >= 2.0 && cgpa <= 2.49) return '2.0-2.49';
    if (cgpa >= 2.5 && cgpa <= 2.99) return '2.5-2.99';
    if (cgpa >= 3.0 && cgpa <= 3.49) return '3.0-3.49';
    if (cgpa >= 3.5 && cgpa <= 4.0) return '3.5-4.0';
    return 'Unknown';
  }

  // Sankey initialization
  function initChart() {
    const svgWidth = size.width + margin.left + margin.right;
    const svgHeight = size.height + margin.top + margin.bottom;

    const svg = d3
      .select('#sankey-svg')
      .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
      .style('background-color', '#f0f0f0');

    const chartGroup = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const cgpaBinLabels = ['0-1.99', '2.0-2.49', '2.5-2.99', '3.0-3.49', '3.5-4.0'];

    const sankeyLayout = sankey<CustomNode, CustomLink>()
      .nodeWidth(15) 
      .nodePadding(20)
      .nodeAlign(sankeyLeft)
      .nodeSort(function (a, b) {
        const isCGPAA = cgpaBinLabels.includes(a.name);
        const isCGPAB = cgpaBinLabels.includes(b.name);
        const isConditionA = a.name.startsWith(`${selectedCondition} `);
        const isConditionB = b.name.startsWith(`${selectedCondition} `);
        const isTreatmentA = a.name.startsWith('Treatment ');
        const isTreatmentB = b.name.startsWith('Treatment ');

        if (isCGPAA && isCGPAB) {
          const indexA = cgpaBinLabels.indexOf(a.name);
          const indexB = cgpaBinLabels.indexOf(b.name);
          return indexA - indexB;
        } else if (isCGPAA) {
          return -1; 
        } else if (isCGPAB) {
          return 1;
        } else if (isConditionA && isConditionB) {
          const order = [`${selectedCondition} No`, `${selectedCondition} Yes`];
          const indexA = order.indexOf(a.name);
          const indexB = order.indexOf(b.name);
          return indexA - indexB;
        } else if (isConditionA) {
          return -1; 
        } else if (isConditionB) {
          return 1;
        } else if (isTreatmentA && isTreatmentB) {
          const order = ['Treatment No', 'Treatment Yes'];
          const indexA = order.indexOf(a.name);
          const indexB = order.indexOf(b.name);
          return indexA - indexB;
        } else if (isTreatmentA) {
          return -1; 
        } else if (isTreatmentB) {
          return 1;
        } else {
          return 0; 
        }
      })
      .extent([
        [1, 1],
        [
          size.width - margin.left - margin.right - 1,
          size.height - margin.top - margin.bottom - 1,
        ],
      ]);

    const sankeyData = {
      nodes: [] as CustomNode[],
      links: [] as CustomLink[],
    };

    // Node list creation
    const nodeMap = new Map<string, CustomNode>();
    const addNode = (name: string): CustomNode => {
      let existingNode = nodeMap.get(name);
      if (!existingNode) {
        existingNode = { name, x0: 0, y0: 0, x1: 0, y1: 0 };
        nodeMap.set(name, existingNode);
        sankeyData.nodes.push(existingNode);
      }
      return existingNode;
    };

    // Map to aggregate links
    const linkMap = new Map<string, CustomLink>();

    // Process data and create nodes and links
    cleanData.forEach((d) => {
      const cgpaValue = parseFloat(d['What is your CGPA?']);
      const cgpaRange = getCgpabin(cgpaValue);
      const cgpaNode = addNode(cgpaRange);

      const conditionNode = addNode(
        `${selectedCondition} ${d[`Do you have ${selectedCondition}?`] === 'Yes' ? 'Yes' : 'No'}`
      );
      const treatmentNode = addNode(
        `Treatment ${d['Did you seek any specialist for a treatment?'] === 'Yes' ? 'Yes' : 'No'}`
      );

      // Link from cgpaNode to conditionNode
      const linkKey1 = `${cgpaNode.name}->${conditionNode.name}`;
      if (linkMap.has(linkKey1)) {
        linkMap.get(linkKey1)!.value += 1;
      } else {
        linkMap.set(linkKey1, {
          source: cgpaNode,
          target: conditionNode,
          value: 1,
        });
      }

      // Link from conditionNode to treatmentNode
      const linkKey2 = `${conditionNode.name}->${treatmentNode.name}`;
      if (linkMap.has(linkKey2)) {
        linkMap.get(linkKey2)!.value += 1;
      } else {
        linkMap.set(linkKey2, {
          source: conditionNode,
          target: treatmentNode,
          value: 1,
        });
      }
    });

    sankeyData.links = Array.from(linkMap.values());

    // Layout structure
    sankeyLayout(sankeyData);

    const cgpaColorScale = d3
      .scaleOrdinal<string>()
      .domain(cgpaBinLabels)
      .range(['#96c1ff', '#7fa6ff', '#5f8cff', '#3f72ff', '#00429d']); // light blue to dark blue

    const conditionNodes = sankeyData.nodes.filter((d) =>
      d.name.startsWith(`${selectedCondition} `)
    );
    const conditionColorScale = d3
      .scaleOrdinal<string>()
      .domain([`${selectedCondition} No`, `${selectedCondition} Yes`])
      .range(['#c51b8a', '#7a0177']); // pink to dark purple

    const treatmentColors: { [key: string]: string } = {
      'Treatment Yes': '#2ca02c', // green
      'Treatment No': '#d62728', // red
    };

    const colorMap = new Map<string, string>();

    cgpaBinLabels.forEach((label) => {
      colorMap.set(label, cgpaColorScale(label));
    });

    conditionNodes.forEach((node) => {
      colorMap.set(node.name, conditionColorScale(node.name));
    });

    sankeyData.nodes.forEach((node) => {
      if (node.name.startsWith('Treatment ')) {
        const treatmentStatus = node.name;
        if (treatmentColors[treatmentStatus]) {
          colorMap.set(node.name, treatmentColors[treatmentStatus]);
        } else {
          colorMap.set(node.name, '#cccccc');
        }
      }
    });

    // Tooltip div
    const tooltip = d3.select(barRef.current)
      .append('div')
      .attr('id', 'sankey-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(255, 255, 255, 0.9)')
      .style('padding', '8px')
      .style('border', '1px solid #ccc')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('font-size', '14px')
      .style('color', '#333')
      .style('box-shadow', '0px 2px 6px rgba(0,0,0,0.2)')
      .style('z-index', '10');

    // Group for links
    chartGroup
      .append('g')
      .selectAll('path')
      .data(sankeyData.links)
      .enter()
      .append('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (d) => colorMap.get((d.source as CustomNode).name)!)
      .attr('stroke-width', (d) => Math.max(1, d.width || 0))
      .attr('fill', 'none')
      .attr('opacity', 0.6)
      .on('mouseover', function (event, d) {
        tooltip
          .style('visibility', 'visible')
          .text(`Count = ${d.value}`);
      })
      .on('mousemove', function (event) {
        const containerRect = barRef.current!.getBoundingClientRect();
        const x = event.clientX - containerRect.left;
        const y = event.clientY - containerRect.top;

        tooltip
          .style('top', `${y + 10}px`)
          .style('left', `${x + 10}px`);
      })
      .on('mouseout', function () {
        tooltip.style('visibility', 'hidden');
      });

    // Group for nodes
    chartGroup
      .append('g')
      .selectAll('rect')
      .data(sankeyData.nodes)
      .enter()
      .append('rect')
      .attr('x', (d) => d.x0!)
      .attr('y', (d) => d.y0!)
      .attr('height', (d) => d.y1! - d.y0!)
      .attr('width', (d) => d.x1! - d.x0!)
      .attr('fill', (d) => colorMap.get(d.name)!)
      .attr('stroke', '#000');

    const nodeLabelGroups = chartGroup
      .append('g')
      .selectAll('g')
      .data(sankeyData.nodes)
      .enter()
      .append('g')
      .attr('transform', (d) => {
        const y = d.y0! + (d.y1! - d.y0!) / 2;
        if (cgpaBinLabels.includes(d.name)) {
          return `translate(${d.x0! - 10}, ${y})`; 
        } else if (d.name.startsWith('Treatment ')) {
          return `translate(${d.x1! + 10}, ${y})`; 
        } else {
          return `translate(${d.x0! + (d.x1! - d.x0!) / 2}, ${y})`; 
        }
      });

    nodeLabelGroups
      .append('text')
      .attr('text-anchor', (d) => {
        if (cgpaBinLabels.includes(d.name)) return 'end';
        if (d.name.startsWith('Treatment ')) return 'start';
        return 'middle';
      })
      .attr('dy', '0.35em')
      .text((d) => d.name)
      .each(function (d) {
        const bbox = (this as SVGTextElement).getBBox();
        d.bbox = bbox;
      });

    nodeLabelGroups
      .insert('rect', 'text')
      .attr('x', (d) => {
        if (cgpaBinLabels.includes(d.name)) {
          return -d.bbox!.width - 8;
        } else if (d.name.startsWith('Treatment ')) {
          return 4;
        } else {
          return -d.bbox!.width / 2 - 4;
        }
      })
      .attr('y', (d) => -d.bbox!.height / 2 - 2)
      .attr('width', (d) => d.bbox!.width + 8)
      .attr('height', (d) => d.bbox!.height + 4)
      .attr('fill', 'white')
      .attr('opacity', 0.7);

    // Title
    chartGroup
      .append('text')
      .attr('x', (size.width - margin.left - margin.right) / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .text('Sankey Diagram of Mental Health Conditions');

    // Y-axis label
    chartGroup
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left - 15)
      .attr('x', 0 - (size.height - margin.top - margin.bottom) / 2)
      .attr('dy', '1em')
      .attr('text-anchor', 'middle')
      .text('CGPA');

    // Legend data
    const cgpaLegendData = cgpaBinLabels.map((label) => ({
      name: label,
      color: colorMap.get(label)!,
    }));

    const conditionLegendData = conditionNodes
      .map((d) => ({ name: d.name, color: colorMap.get(d.name)! }))
      .sort((a, b) => {
        const order = [`${selectedCondition} No`, `${selectedCondition} Yes`];
        return order.indexOf(a.name) - order.indexOf(b.name);
      });

    const treatmentLegendData = sankeyData.nodes
      .filter((d) => d.name.startsWith('Treatment '))
      .map((d) => ({ name: d.name, color: colorMap.get(d.name)! }))
      .sort((a, b) => {
        const order = ['Treatment No', 'Treatment Yes'];
        return order.indexOf(a.name) - order.indexOf(b.name);
      });

    // Legend dimensions
    const legendItemHeight = 25;
    const legendItemWidth = 18;
    const legendSpacing = 5;

    const legendGroup = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${size.height - 100})`);

    // Left column for CGPA nodes
    cgpaLegendData.forEach((item, i) => {
      legendGroup
        .append('rect')
        .attr('x', 0)
        .attr('y', 40 + i * legendItemHeight)
        .attr('width', legendItemWidth)
        .attr('height', legendItemWidth)
        .attr('fill', item.color)
        .attr('stroke', '#000');

      legendGroup
        .append('text')
        .attr('x', 3 + legendItemWidth + legendSpacing)
        .attr('y', 40 + i * legendItemHeight + legendItemWidth / 2 + 5)
        .text(item.name + ' CGPA')
        .attr('font-size', '15px')
        .attr('alignment-baseline', 'middle');
    });

    // Middle column for condition nodes
    conditionLegendData.forEach((item, i) => {
      legendGroup
        .append('rect')
        .attr('x', 240)
        .attr('y', 40 + i * legendItemHeight)
        .attr('width', legendItemWidth)
        .attr('height', legendItemWidth)
        .attr('fill', item.color)
        .attr('stroke', '#000');

      legendGroup
        .append('text')
        .attr('x', 240 + legendItemWidth + legendSpacing)
        .attr('y', 40 + i * legendItemHeight + legendItemWidth / 2 + 5)
        .text(item.name)
        .attr('font-size', '15px')
        .attr('alignment-baseline', 'middle');
    });

    // Right column for treatment nodes
    treatmentLegendData.forEach((item, i) => {
      legendGroup
        .append('rect')
        .attr('x', 480)
        .attr('y', 40 + i * legendItemHeight)
        .attr('width', legendItemWidth)
        .attr('height', legendItemWidth)
        .attr('fill', item.color)
        .attr('stroke', '#000');

      legendGroup
        .append('text')
        .attr('x', 480 + legendItemWidth + legendSpacing)
        .attr('y', 40 + i * legendItemHeight + legendItemWidth / 2 + 5)
        .text(item.name)
        .attr('font-size', '15px')
        .attr('alignment-baseline', 'middle');
    });
  }

  return (
    <div
      ref={barRef}
      style={{
        width: '100%',
        maxWidth: '1200px',
        overflow: 'visible',
        position: 'relative',
      }}
    >
      <svg id="sankey-svg" width="100%" height="600px" />
    </div>
  );
}
