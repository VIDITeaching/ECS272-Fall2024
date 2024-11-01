import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import dataFromJson from '../../data/demo.json';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { linkHorizontal } from 'd3-shape';
import { sankey, sankeyLinkHorizontal, SankeyLayout, SankeyLink as D3SankeyLink, SankeyNode as D3SankeyNode } from 'd3-sankey';
import { ComponentSize, Margin, SankeyLink, SankeyNode } from '../types';

export default function Vis_1() {
    const [sankeyNodes, setSankeyNodes] = useState<SankeyNode[]>([]);
    const [sankeyLinks, setSankeyLinks] = useState<SankeyLink[]>([]);
    const chartRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState<ComponentSize>({ width: 800, height: 600 }); // Initial default size for visualization
    const margin: Margin = { top: 40, right: 80, bottom: 40, left: 60 };

    const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);
    useResizeObserver({ ref: chartRef, onResize });

    useEffect(() => {
        const dataFromCSV = async () => {
            try {
                // Load CSV data
                const csvData = await d3.csv('../../data/financial_risk.csv', d => {
                    if (!d['Education Level'] || !d['Employment Status'] || !d['Loan Purpose'] || !d['Risk Rating'] || !d['Payment History']) {
                        return null;
                    }

                    return {
                        educationLevel: d['Education Level'],
                        employmentStatus: d["Employment Status"],
                        loanPurpose: d["Loan Purpose"],
                        riskRating: d["Risk Rating"],
                        paymentHistory: d["Payment History"]
                    };
                });

                const validData = csvData.filter(d => d !== null);

                const nodesMap = new Map<string, SankeyNode>();
                const nodes: SankeyNode[] = [];
                const links: SankeyLink[] = [];
                let nodeId = 0;

                // Helper function to add nodes uniquely
                const addNode = (name: string, category: string) => {
                    const key = `${category}-${name}`;
                    if (!nodesMap.has(key)) {
                        const newNode: SankeyNode = { name, category, id: nodeId++ };
                        nodesMap.set(key, newNode);
                        nodes.push(newNode);
                    }
                    return nodesMap.get(key)!;
                };

                // Process valid data to create nodes and links
                validData.forEach(d => {
                    const educationNode = addNode(d.educationLevel, 'Education Level');
                    const employmentNode = addNode(d.employmentStatus, 'Employment Status');
                    const loanNode = addNode(d.loanPurpose, 'Loan Purpose');
                    const paymentNode = addNode(d.paymentHistory, 'Payment History');
                    const riskNode = addNode(d.riskRating, 'Risk Rating');  // Last category

                    // Define transitions, keeping 'Risk Rating' as the last category
                    const transitions = [
                        { source: educationNode, target: employmentNode },
                        { source: employmentNode, target: loanNode },
                        { source: loanNode, target: paymentNode },
                        { source: paymentNode, target: riskNode }  // Risk Rating as the final target
                    ];

                    // Add or update links based on transitions
                    transitions.forEach(({ source, target }) => {
                        let link = links.find(l => l.source === source.id && l.target === target.id);
                        if (link) {
                            link.value += 1;
                        } else {
                            links.push({ source: source.id, target: target.id, value: 1 });
                        }
                    });
                });

                setSankeyNodes(nodes);
                setSankeyLinks(links);

            } catch (error) {
                console.error('Error loading CSV:', error);
            }
        };

    dataFromCSV();
}, []);

    useEffect(() => {
        if (isEmpty(sankeyNodes) || isEmpty(sankeyLinks)) return;
        if (size.width === 0 || size.height === 0) return;

        // Clear any previous SVG content
        d3.select('#sankey-svg').selectAll('*').remove();

        // Initialize the Sankey diagram
        initSankeyDiagram();
    }, [size, sankeyNodes, sankeyLinks]);


    function initSankeyDiagram() {
    // Select the SVG container where the Sankey diagram will be rendered
    const chartContainer = d3.select('#sankey-svg')
        .attr('width', size.width)
        .attr('height', size.height);

    // Define node and layout properties
    const nodeWidth = 25;
    const nodePadding = 25;

    // Initialize Sankey layout with configuration
    const sankeyLayout = sankey<SankeyNode, SankeyLink>()
        .nodeWidth(nodeWidth)
        .nodePadding(nodePadding)
        .extent([[margin.left, margin.top], [size.width - margin.right, size.height - margin.bottom]]);

    // Compute the layout for nodes and links
    const { nodes: layoutNodes, links: layoutLinks } = sankeyLayout({
        nodes: sankeyNodes.map(d => Object.assign({}, d)), // Create a copy for immutability
        links: sankeyLinks.map(d => Object.assign({}, d))
    });

    // Color scale for highlighting each selected node uniquely
    const highlightColorPool = ["#FF5733", "#33FF57", "#A020F0", "#FFD700"]; // Four distinct colors
    const selectedNodesByCategory: { [key: string]: Map<number, string> } = {
        "Education Level": new Map(),
        "Employment Status": new Map(),
        "Loan Purpose": new Map(),
        "Payment History": new Map(),
        "Risk Rating": new Map(),
    };

    // Default colors
    const defaultNodeColor = "steelblue";
    const defaultLinkColor = "#ccc";

    const node = chartContainer.append('g')
        .selectAll('rect')
        .data(layoutNodes)
        .join('rect')
        .attr('x', d => d.x0 ?? 0)
        .attr('y', d => d.y0 ?? 0)
        .attr('width', d => (d.x1 ?? 0) - (d.x0 ?? 0))
        .attr('height', d => (d.y1 ?? 0) - (d.y0 ?? 0))
        .attr('fill', d => {
            if (!d.category || !(d.category in selectedNodesByCategory)) return "steelblue";
            const categoryMap = selectedNodesByCategory[d.category];
            return categoryMap?.get(d.id) || (d.category === "Risk Rating" ? defaultNodeColor : d.color || "steelblue");
        })
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
        .on("click", function (event, d) {
            if (!d.category || !(d.category in selectedNodesByCategory)) return;
            const categoryMap = selectedNodesByCategory[d.category];
            if (!categoryMap) return;

            const isAlreadySelected = categoryMap.has(d.id);
            if (isAlreadySelected) {
                // Deselect: remove from map and reset to default color
                categoryMap.delete(d.id);
                d3.select(this).attr("fill", defaultNodeColor);
            } else {
                // Determine available colors
                const usedColors = Array.from(categoryMap.values());
                const availableColors = highlightColorPool.filter(color => !usedColors.includes(color));
                const color = availableColors[0] || defaultLinkColor; // Fallback in case of no available colors

                // Select: add to map with the available color
                categoryMap.set(d.id, color);
                d3.select(this).attr("fill", color);
            }

            // Update link colors and opacity based on selected nodes
            link.attr("stroke", linkData => {
                const targetCategory = (linkData.target as SankeyNode).category;
                if (!targetCategory || !(targetCategory in selectedNodesByCategory)) return defaultLinkColor;

                const targetCategoryMap = selectedNodesByCategory[targetCategory];
                const targetNodeColor = targetCategoryMap.get((linkData.target as SankeyNode).id);
                return targetNodeColor || defaultLinkColor;
            })
            .attr("opacity", linkData => {
                const anySelected = Object.values(selectedNodesByCategory).some(map => map.size > 0);
                if (!anySelected) return 0.8;

                const targetCategory = (linkData.target as SankeyNode).category;
                if (!targetCategory || !(targetCategory in selectedNodesByCategory)) return 0.3;

                const targetCategoryMap = selectedNodesByCategory[targetCategory];
                const targetNodeColor = targetCategoryMap.get((linkData.target as SankeyNode).id);
                return targetNodeColor ? 0.6 : 0.3;
            });
        });

    node.append("title")
        .text(d => `${d.name}\n${d.value}`);

        // Draw links between nodes
        const link = chartContainer.append('g')
        .selectAll('path')
        .data(layoutLinks)
        .join('path')
        .attr('d', sankeyLinkHorizontal())
        .attr('fill', 'none')
        .attr('stroke', defaultLinkColor)
        .attr('stroke-width', d => Math.max(1, d.width || 1))
        .attr('opacity', 0.8)

    link.append("title")
        .text(d => `${(d.source as SankeyNode).name} → ${(d.target as SankeyNode).name}\n${d.value}`);

    // Draw node labels
    chartContainer.append('g')
        .selectAll('text')
        .data(layoutNodes)
        .join('text')
        .attr('x', d => (d.x0 ?? 0) < size.width / 2 ? (d.x1 ?? 0) + 6 : (d.x0 ?? 0) - 6)
        .attr('y', d => ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', d => (d.x0 ?? 0) < size.width / 2 ? 'start' : 'end')
        .text(d => d.name)
        .attr('fill', 'black')
        .style('font-weight', 'bold')
        .style('font-size', '10px');


    // Draw diagram title
    chartContainer.append('text')
        .attr('x', size.width / 2)
        .attr('y', margin.top / 2)
        .attr('text-anchor', 'middle')
        .text("Financial Risk Assessment Overview")
        .style('font-size', '16px')
        .style('font-weight', 'bold');

    // Add category labels along the x-axis
    const categories = ["Education Level", "Employment Status", "Loan Purpose", "Payment History", "Risk Rating"];
    categories.forEach((category, i) => {
        chartContainer.append('text')
            .attr('x', margin.left + i * ((size.width - margin.left - margin.right) / (categories.length - 1)))
            .attr('y', size.height - margin.bottom + 15)
            .attr('text-anchor', 'middle')
            .text(category)
            .style('font-size', '12px')
            .style('font-weight', 'bold');
    });
    }



    return (
        <>
        <div ref={chartRef} className='chart-container'>
            <svg id='sankey-svg' width='100%' height='100%'></svg>
        </div>
        </>
    )
}
