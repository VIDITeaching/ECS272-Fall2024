import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import dataFromJson from '../../data/demo.json';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

import { Bar, ComponentSize, Margin, SankeyLink, SankeyNode } from '../types';
// A "extends" B means A inherits the properties and methods from B.
interface CategoricalBar extends Bar{
    category: string;
}



export default function Vis_1() {
    const [nodes, setNodes] = useState<SankeyNode[]>([]);
    const [links, setLinks] = useState<SankeyLink[]>([]);
    const chartRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
    const margin: Margin = { top: 40, right: 80, bottom: 40, left: 60 };
    const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)

    useResizeObserver({ ref: chartRef, onResize });

    useEffect(() => {
        // Function to read and process the CSV file
        const dataFromCSV = async () => {
            try {
                // Load CSV data
                const csvData = await d3.csv('../../data/financial_risk.csv', d => {
                    // Filter out rows with missing values in key columns
                    if (!d['Education Level'] || !d['Employment Status'] || !d['Loan Purpose'] || !d['Risk Rating'] || !d['Payment History']) {
                        return null;
                    }
    
                    // Map and rename the necessary columns
                    return {
                        educationLevel: d['Education Level'],
                        employmentStatus: d["Employment Status"],
                        loanPurpose: d["Loan Purpose"],
                        riskRating: d["Risk Rating"],
                        paymentHistory: d["Payment History"]
                    };
                });
    
                // Filter valid rows (i.e., those that aren't null)
                const validData = csvData.filter(d => d !== null);
    
                // Initialize nodes and links structures
                const nodesMap = new Map<string, SankeyNode>();
                let nodes: SankeyNode[] = [];
                let nodeId = 0;
    
                // Helper function to add a node if it doesn't already exist
                const addNode = (name: string, category: string) => {
                    const key = `${category}-${name}`;  // Ensure uniqueness by combining category and name
                    if (!nodesMap.has(key)) {
                        const newNode = { name, category, id: nodeId++ };
                        nodesMap.set(key, newNode);
                        nodes.push(newNode);
                    }
                    return nodesMap.get(key);
                };
    
                // Initialize links
                const links: { source: number, target: number, value: number }[] = [];
    
                // Process valid data to create nodes and links
                validData.forEach(d => {
                    // Add nodes for each category in the data row
                    const educationNode = addNode(d.educationLevel, 'Education Level');
                    const employmentNode = addNode(d.employmentStatus, 'Employment Status');
                    const loanNode = addNode(d.loanPurpose, 'Loan Purpose');
                    const riskNode = addNode(d.riskRating, 'Risk Rating');
                    const paymentNode = addNode(d.paymentHistory, 'Payment History');
    
                    // Define transitions (links) between categories
                    const transitions = [
                        { source: educationNode, target: employmentNode },
                        { source: employmentNode, target: loanNode },
                        { source: loanNode, target: riskNode },
                        { source: riskNode, target: paymentNode },
                    ];
    
                    // Add or update links based on the transitions
                    transitions.forEach(({ source, target }) => {
                        let link = links.find(l => l.source === source!.id && l.target === target!.id);
                        if (link) {
                            link.value += 1;  // Increment the value if the link already exists
                        } else {
                            links.push({ source: source!.id, target: target!.id, value: 1 });  // Add new link
                        }
                    });
                });
    
                // Set the state for nodes and links
                setNodes(nodes);
                setLinks(links);
    
            } catch (error) {
                console.error('Error loading CSV:', error);
            }
        };
    
        // Call the function to load and process the CSV data
        dataFromCSV();
    }, []);  // Empty dependency array ensures this effect runs only once (on mount)
    

    // useEffect(() => {
    // // For reading csv file
    //     const dataFromCSV = async () => {
    //         try {
    //             const csvData = await d3.csv('../../data/financial_risk.csv', d => {
    //             // This callback allows you to rename the keys, format values, and drop columns you don't need
    //                 if(!d['Education Level'] || !d['Employment Status'] || !d['Loan Purpose'] || !d['Risk Rating'] || !d['Payment History']) {
    //                     return null;
    //                 }

    //                 return {
    //                     educationLevel: d['Education Level'],
    //                     employmentStatus: d["Employment Status"],
    //                     loanPurpose: d["Loan Purpose"],
    //                     riskRating: d["Risk Rating"],
    //                     paymentHistory: d["Payment History"]
    //                 };
    //             });

    //             const validData = csvData.filter(d => d !== null);
                
    //             // For nodes
    //             const nodesMap = new Map<string, SankeyNode>();

    //             let nodes: SankeyNode[] = [];
    //             let nodeId = 0;

    //             const addNode = (name: string, category: string) => {
    //                 // Unique key to aviod name clashes between categories
    //                 const key = `${category}-${name}`;
    //                 if(!nodesMap.has(key)) {
    //                     const newNode = {name, category, id: nodeId++};
    //                     nodesMap.set(key, newNode);
    //                     nodes.push(newNode);
    //                 }
    //                 return nodesMap.get(key);
    //             };

    //             // For links
    //             const links: {source: number, target: number, value: number}[] = [];
    //             validData.forEach(d => {
    //                 // Add node for each category
    //                 const educationNode = addNode(d.educationLevel, 'Education Level');
    //                 const employmentNode = addNode(d.employmentStatus, 'Employment Status');
    //                 const loanNode = addNode(d.loanPurpose, 'Loan Purpose');
    //                 const risknNode = addNode(d.riskRating, 'Risk Rating');
    //                 const paymentNode = addNode(d.paymentHistory, 'Payment History');

    //                 // Define transitions
    //                 const transitions = [
    //                     {source: educationNode, target: employmentNode},
    //                     {source: employmentNode, target: loanNode},
    //                     {source: loanNode, target: risknNode},
    //                     {source: risknNode, target: paymentNode},
    //                 ];

    //                 transitions.forEach(({source, target}) => {
    //                     let link = links.find(l => l.source === source!.id && l.target === target!.id);
    //                     if(link) {
    //                         link.value += 1;
    //                     } else {
    //                         links.push({source: source!.id, target: target!.id, value: 1});
    //                     }
    //                 });
    //             });
    //             setNodes(nodes);
    //             setLinks(links);
    //         } catch (error) {
    //         console.error('Error loading CSV:', error);
    //         }
    //     } 
    //     dataFromCSV();
    // }, [])

    useEffect(() => {
        if (isEmpty(nodes) || isEmpty(links)) return;
        if (size.width === 0 || size.height === 0) return;
        d3.select('#sankey-svg').selectAll('*').remove();
        initSankeyDiagram();
    }, [nodes, links, size])

    function initSankeyDiagram() {
        // 1. Select the SVG container where the Sankey diagram will be rendered
        let chartContainer = d3.select('#sankey-svg');
    
        // 2. Define constants related to node and layout properties
        const nodeWidth = 10;
        const nodePadding = 25;
    
        type Category = "Education Level" | "Employment Status" | "Loan Purpose" | "Risk Rating" | "Payment History";
    
        // 3. Define x-axis positions for each category
        const xPositions: { [key in Category]: number } = {
            "Education Level": margin.left,
            "Employment Status": margin.left + (size.width - margin.left - margin.right) / 4,
            "Loan Purpose": margin.left + (size.width - margin.left - margin.right) / 2,
            "Risk Rating": margin.left + 3 * (size.width - margin.left - margin.right) / 4,
            "Payment History": size.width - margin.right - nodeWidth
        };
    
        // 4. Define color scales for each category
        const colorScale: { [key in Category]: d3.ScaleOrdinal<string, string> } = {
            "Education Level": d3.scaleOrdinal(d3.schemeSet2),
            "Employment Status": d3.scaleOrdinal(d3.schemeSet3),
            "Loan Purpose": d3.scaleOrdinal(d3.schemeSet1),
            "Risk Rating": d3.scaleOrdinal(d3.schemeDark2),
            "Payment History": d3.scaleOrdinal(d3.schemeCategory10)
        };
    
        // 5. Group nodes by category
        const categoryGroups = d3.group(nodes, d => d.category as Category);
    
        // 6. Assign x and y positions to each node based on its category
        categoryGroups.forEach((nodesInCategory, category) => {
            if (xPositions[category]) {
                const ySpacing = (size.height - margin.top - margin.bottom) / nodesInCategory.length;
                nodesInCategory.forEach((node, index) => {
                    node.x = xPositions[category]; // Set x position based on category
                    node.y = margin.top + index * ySpacing; // Calculate y position based on index
                    node.color = colorScale[category](node.name); // Set color based on category
                });
            } else {
                console.error(`Invalid category: ${category}`);
            }
        });
    
        // 7. Filter out invalid nodes (i.e., nodes without x and y positions)
        const validNodes = nodes.filter(node => node.x !== undefined && node.y !== undefined);
    
        // 8. Filter out invalid links (i.e., links without valid source or target nodes)
        const validLinks = links.filter(link => {
            const sourceNode = validNodes.find(node => node.id === link.source);
            const targetNode = validNodes.find(node => node.id === link.target);
            return sourceNode && targetNode;
        });
    
        // 9. Create maps for tracking outgoing/incoming values and link positions
        const nodeValueMap = new Map<number, { outgoing: number, incoming: number }>();
        validNodes.forEach(node => {
            const outgoingLinks = validLinks.filter(link => link.source === node.id);
            const incomingLinks = validLinks.filter(link => link.target === node.id);
            const totalOutgoingValue = outgoingLinks.reduce((acc, link) => acc + link.value, 0);
            const totalIncomingValue = incomingLinks.reduce((acc, link) => acc + link.value, 0);
            nodeValueMap.set(node.id, { outgoing: totalOutgoingValue, incoming: totalIncomingValue });
        });
    
        // Maps to track y positions of links
        const linkSourceYMap = new Map<number, number>();
        const linkTargetYMap = new Map<number, number>();
    
        validNodes.forEach(node => {
            linkSourceYMap.set(node.id, node.y as number);
            linkTargetYMap.set(node.id, node.y as number);
        });
    
        // 10. Draw links between nodes
        const link = chartContainer.append('g')
            .selectAll('path')
            .data(validLinks)
            .join('path')
            .attr('d', d => {
                const sourceNode = validNodes.find(node => node.id === d.source);
                const targetNode = validNodes.find(node => node.id === d.target);
    
                if (sourceNode && targetNode) {
                    // Calculate y positions for source and target nodes
                    let currentSourceY = linkSourceYMap.get(sourceNode.id) as number;
                    const sourceLinkHeight = (d.value / (nodeValueMap.get(sourceNode.id)?.outgoing || 1)) * nodePadding;
                    const sourceY = currentSourceY + sourceLinkHeight / 2;
                    linkSourceYMap.set(sourceNode.id, currentSourceY + sourceLinkHeight);
    
                    let currentTargetY = linkTargetYMap.get(targetNode.id) as number;
                    const targetLinkHeight = (d.value / (nodeValueMap.get(targetNode.id)?.incoming || 1)) * nodePadding;
                    const targetY = currentTargetY + targetLinkHeight / 2;
                    linkTargetYMap.set(targetNode.id, currentTargetY + targetLinkHeight);
    
                    // Return path for smooth transition between source and target
                    return `M${sourceNode.x as number + nodeWidth},${sourceY}
                            C${(sourceNode.x as number + (targetNode.x as number)) / 2},${sourceY}
                            ${(sourceNode.x as number + (targetNode.x as number)) / 2},${targetY}
                            ${targetNode.x},${targetY}`;
                } else {
                    console.error('Invalid source or target node:', sourceNode, targetNode);
                    return '';
                }
            })
            .attr('fill', 'none')
            .attr('stroke', d => {
                const sourceNode = validNodes.find(node => node.id === d.source);
                return (sourceNode ? sourceNode.color : '#ccc') as string;
            })
            .attr('stroke-width', d => {
                const totalValue = Math.min(
                    nodeValueMap.get(d.source)?.outgoing || 0,
                    nodeValueMap.get(d.target)?.incoming || 0
                );
                return (totalValue ? (d.value / totalValue) * nodePadding : 1) * 0.55;
            })
            .attr('opacity', 0.8);
    
        // 11. Draw nodes as rectangles
        const node = chartContainer.append('g')
            .selectAll('rect')
            .data(validNodes)
            .join('rect')
            .attr('x', d => d.x as number)
            .attr('y', d => d.y as number)
            .attr('width', nodeWidth)
            .attr('height', nodePadding)
            .attr('fill', d => d.color as string)
            .attr('stroke', '#000')
            .attr('stroke-width', 1);
    
        // 12. Draw node labels
        const nodeLabels = chartContainer.append('g')
            .selectAll('text')
            .data(validNodes)
            .join('text')
            .attr('x', d => (d.x as number) + nodeWidth + 5)
            .attr('y', d => (d.y as number) + nodePadding / 2)
            .attr('dy', '0.35em')
            .text(d => d.name)
            .attr('fill', 'black')
            .style('font-weight', 'bold')
            .style('font-size', '10px');
    
        // 13. Draw title
        const title = chartContainer.append('text')
            .attr('x', size.width / 2)
            .attr('y', margin.top / 2)
            .attr('text-anchor', 'middle')
            .text("Financial Risk Assessment Overview")
            .style('font-size', '16px')
            .style('font-weight', 'bold');
    
        // 14. Add category labels along the x-axis
        const categories: Category[] = ["Education Level", "Employment Status", "Loan Purpose", "Risk Rating", "Payment History"];
        categories.forEach(category => {
            chartContainer.append('text')
                .attr('x', xPositions[category] + nodeWidth / 2)
                .attr('y', size.height - margin.bottom - 10)
                .attr('text-anchor', 'middle')
                .text(category)
                .style('font-size', '12px')
                .style('font-weight', 'bold');
        });
    }
    

    // function initSankeyDiagram() {
    //     // select the svg tag so that we can insert(render) elements, i.e., draw the chart, within it.
    //     let chartContainer = d3.select('#sankey-svg');

    //     const nodeWidth = 10;
    //     const nodePadding = 150;

    //     type Category = "Education Level" | "Employment Status" | "Loan Purpose" | "Risk Rating" | "Payment History";

    //     const xPositions: { [key in Category]: number } = {
    //         "Education Level": margin.left,
    //         "Employment Status": margin.left + (size.width - margin.left - margin.right) / 4,
    //         "Loan Purpose": margin.left + (size.width - margin.left - margin.right) / 2,
    //         "Risk Rating": margin.left + 3 * (size.width - margin.left - margin.right) / 4,
    //         "Payment History": size.width - margin.right - nodeWidth  // Adjust to account for node width
    //     };
        

    //     const colorScale: {[key in Category]: d3.ScaleOrdinal<string, string>} = {
    //         "Education Level": d3.scaleOrdinal(d3.schemeSet2),  // Use d3 color schemes
    //         "Employment Status": d3.scaleOrdinal(d3.schemeSet3),
    //         "Loan Purpose": d3.scaleOrdinal(d3.schemeSet1),
    //         "Risk Rating": d3.scaleOrdinal(d3.schemeDark2),
    //         "Payment History": d3.scaleOrdinal(d3.schemeCategory10)
    //     };

    //     const categoryGroups = d3.group(nodes, d => d.category as Category);

    //     categoryGroups.forEach((nodesInCategory, category) => {
    //         // Ensure category is valid
    //         if (xPositions[category]) {
    //             const ySpacing = (size.height - margin.top - margin.bottom) / nodesInCategory.length;
    //             nodesInCategory.forEach((node, index) => {
    //                 node.x = xPositions[category]; // This should return a valid number
    //                 node.y = margin.top + index * ySpacing; // Ensure this calculation returns a valid number
    //                 node.color = colorScale[category](node.name);
    //             });
    //         } else {
    //             console.error(`Invalid category: ${category}`);
    //         }
    //     });

    //     const validNodes = nodes.filter(node => node.x !== undefined && node.y !== undefined);

    //     // **Filter invalid links** (links with missing source or target nodes, or undefined coordinates)
    //     const validLinks = links.filter(link => {
    //         const sourceNode = validNodes.find(node => node.id === link.source);
    //         const targetNode = validNodes.find(node => node.id === link.target);
    //         return sourceNode && targetNode && sourceNode.x !== undefined && targetNode.x !== undefined;
    //     });

    //     const nodeValueMap = new Map<number, {outgoing: number, incoming: number}>();
    //     validNodes.forEach(node => {
    //         const outgoingLinks = validLinks.filter(link => link.source === node.id);
    //         const incomingLinks = validLinks.filter(link => link.target === node.id);
    //         const totalOutgoingValue = outgoingLinks.reduce((acc, link) => acc + link.value, 0);
    //         const totalIncomingValue = incomingLinks.reduce((acc, link) => acc + link.value, 0);
    //         nodeValueMap.set(node.id, {outgoing: totalOutgoingValue, incoming: totalIncomingValue});
    //     });

    //     const linkSourceYMap = new Map<number, number>();
    //     const linkTargetYMap = new Map<number, number>();

    //     validNodes.forEach(node => {
    //         linkSourceYMap.set(node.id, node.y as number);
    //         linkTargetYMap.set(node.id, node.y as number);
    //     });

    //     const link = chartContainer.append('g')
    //     .selectAll('path')
    //     .data(validLinks)
    //     .join('path')
    //     .attr('d', d => {
    //         const sourceNode = validNodes.find(node => node.id === d.source);
    //         const targetNode = validNodes.find(node => node.id === d.target);

    //         // Ensure that both nodes exist and have valid x, y coordinates
    //         if (sourceNode && targetNode) {
    //             // Get total outgoing value for the source node and incoming value for the target node
    //             const sourceTotalValue = nodeValueMap.get(sourceNode.id)?.outgoing || 0;
    //             const targetTotalValue = nodeValueMap.get(targetNode.id)?.incoming || 0;

    //             // Calculate the starting y-position for the source node and update the current Y position
    //             let currentSourceY = linkSourceYMap.get(sourceNode.id) as number;
    //             const sourceLinkHeight = (d.value / sourceTotalValue) * nodePadding;
    //             const sourceY = currentSourceY + sourceLinkHeight / 2;
    //             linkSourceYMap.set(sourceNode.id, currentSourceY + sourceLinkHeight);

    //             // Calculate the ending y-position for the target node and update the current Y position
    //             let currentTargetY = linkTargetYMap.get(targetNode.id) as number;
    //             const targetLinkHeight = (d.value / targetTotalValue) * nodePadding;
    //             const targetY = currentTargetY + targetLinkHeight / 2;
    //             linkTargetYMap.set(targetNode.id, currentTargetY + targetLinkHeight);

    //             // Create a smooth link path from source to target
    //             return `M${(sourceNode.x as number) + nodeWidth},${sourceY}
    //                     C${((sourceNode.x as number) + (targetNode.x as number)) / 2},${sourceY}
    //                     ${(sourceNode.x as number + targetNode.x as number) / 2},${targetY}
    //                     ${targetNode.x as number},${targetY}`;
    //         } else {
    //             console.error('Invalid source or target node:', sourceNode, targetNode);
    //             return '';
    //         }
    //     })
    //     .attr('fill', 'none')
    //     .attr('stroke', d => {
    //         const sourceNode = validNodes.find(node => node.id === d.source);
    //         return sourceNode ? sourceNode.color : '#ccc';
    //     })
    //     .attr('stroke-width', d => {
    //         const sourceTotalValue = nodeValueMap.get(d.source)?.outgoing;
    //         const targetTotalValue = nodeValueMap.get(d.target)?.incoming;

    //         // Use the minimum of source and target total values to ensure balanced link thickness
    //         const totalValue = Math.min(sourceTotalValue || 0, targetTotalValue || 0);
    
    //         return totalValue ? (d.value / totalValue) * nodePadding : 1;  // Scale the stroke width based on the value ratio
    //     }) // Thickness based on value
    //     .attr('opacity', 0.8);

    //     const node = chartContainer.append('g')
    //         .selectAll('rect')
    //         .data(validNodes)
    //         .join('rect')
    //         .attr('x', d => d.x as number)
    //         .attr('y', d => d.y as number)
    //         .attr('width', nodeWidth)
    //         .attr('height', d => nodePadding)
    //         .attr('fill', d => d.color)
    //         .attr('stroke', '#000')
    //         .attr('stroke-width', 1);

    //     const nodeLabels = chartContainer.append('g')
    //         .selectAll('text')
    //         .data(validNodes)
    //         .join('text')
    //         .attr('x', d => (d.x as number) + nodeWidth + 5)
    //         .attr('y', d => (d.y as number) + nodePadding / 2)
    //         .attr('dy', '0.35em')
    //         .text(d => d.name)
    //         .attr('fill', 'black')
    //         .style('front-weight', 'bold')
    //         .style('font-size', '10px');

    //     const title = chartContainer.append('text')
    //     .attr('x', size.width / 2)
    //     .attr('y', margin.top / 2)
    //     .attr('text-anchor', 'middle')
    //     .text("Financial Risk Assessment Overview")
    //     .style('font-size', '16px')
    //     .style('font-weight', 'bold');

    //     const categories: Category[] = ["Education Level", "Employment Status", "Loan Purpose", "Risk Rating", "Payment History"];
    //     categories.forEach(category => {
    //         chartContainer.append('text')
    //         .attr('x', xPositions[category] + nodeWidth / 2)
    //         .attr('y', size.height - margin.bottom + 20)  // Position it below the diagram
    //         .attr('text-anchor', 'middle')
    //         .text(category)
    //         .style('font-size', '12px')
    //         .style('font-weight', 'bold');
    //     });
    // }

    return (
        <>
        <div ref={chartRef} className='chart-container'>
            <svg id='sankey-svg' width='100%' height='100%'></svg>
        </div>
        </>
    )
}