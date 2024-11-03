import { useEffect, useState, useContext, useRef } from 'react';
import * as d3 from 'd3';
import * as d3sankey from 'd3-sankey';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import DataContext from '../stores/DataContext.ts';

import { ComponentSize, DataRow, BooleanEnum, COL_TO_ENUM_MAP, ALL_NODES, COL_TO_LABEL_MAP } from '../types.ts';

export default function Sankey() {
  // Get data from context
  const data = useContext(DataContext);

  // TODO: determine what columns to show
  // TODO: Stretch goal - give users ability to select between groups of related columns
  // > 6 columns seems to make the links overflow depending on node order.
  const SELECTED_COLUMNS = [
    'goOut',
    'studyTime',
    'failures',
    'gradeTrend',
  ];

  const margin = { top: 100, right: 200, bottom: 100, left: 200 };
  const NODE_WIDTH = 20;
  // TODO: all nodes should have different colors.
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Component size, not window size. Depends on grid size.
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  // const [sankey, setSankey] = useState<d3sankey.SankeyLayout<d3sankey.SankeyGraph<{}, {}>, {}, {}> | null>(null);

  // On window resize, call setSize with delay of 200 milliseconds
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)
  // If ref is created with useRef(null), React will map it to node in JSX on render.
  // Changes to ref (from d3) do not trigger rerenders.
  // Important: ref cannot be read while rendering, must be done in event handler or useEffect().
  const graphRef = useRef<HTMLDivElement>(null);
  useResizeObserver({ ref: graphRef, onResize });

  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectedCols, setSelectedCols] = useState([]);

  useEffect(() => {
    // if (isEmpty(data)) return;
    if (size.width === 0 || size.height === 0) return; // if component not rendered

    // Reset graph
    d3.select('#sankey-diagram-svg').selectAll('*').remove();
    
    const nodes = ALL_NODES.filter(n => SELECTED_COLUMNS.includes(n.column));
    const links = SELECTED_COLUMNS.flatMap((_, i) => {
      // There are N-1 links of consecutive columns for N columns. e.g. for columns [col1, col2, col3], links are [[col1, col2], [col2, col3]]
      if (i + 1 > SELECTED_COLUMNS.length - 1) return [];

      let fromCol = SELECTED_COLUMNS[i];
      let toCol = SELECTED_COLUMNS[i+1];

      let fromNodes = nodes.filter(n => n.column === fromCol).map(n => [n.id, n.val]);
      let toNodes = nodes.filter(n => n.column === toCol).map(n => [n.id, n.val]);

      let cross = d3.cross(fromNodes, toNodes).map(([[fromNodeId, fromNodeVal], [toNodeId, toNodeVal]]) => {
        return ({
          'source': fromNodeId,
          'target': toNodeId,
          'value': data.reduce((count, row) =>
            // count rows where source and target values both match
            row[fromCol] === fromNodeVal && row[toCol] === toNodeVal
              ? count + 1
              : count, 0) 
        });
      });
      return cross;
    });

    renderGraph([...nodes], [...links]);
  }, [data, selectedNodes, selectedCols, size]) // For some reason if we don't include size then data will not render.

  /**
   *  Determines order of nodes on sankey chart.
   *  Input: two nodes
   *  Returns: -1 if the first node should be above the second, 1 if the second node should be above the first, 0 if order is not specified
   */
  function sortNodes(node1, node2) {
    // TODO: sort in order of values.
    // returning 0 seems to sort nodes in order of enum value name.
    return 0;
  }

  function sortLinks(link1, link2) {
    // TODO: determine if needed. Maybe sort links by % of source node link represents.
    // returning 0 seems to sort links by order of target.
    return 0;
  }

  function nodeSelected(d) {
    return selectedNodes.some(n => n.index === d.index);
  }

  function colSelected(d) {
    return selectedCols.includes(d.column);
  }
  
  // On node click: select and highlight node
  const handleNodeClick = (e, d) => {
    let newNodes;
    if (nodeSelected(d)) {
      newNodes = selectedNodes.filter(n => !(n.column === d.column && n.val === d.val));
      if (!newNodes.some(n => n.column === d.column)) { // if no more nodes selected for column, unselect column
        setSelectedCols(selectedCols.filter(c => c !== d.column));
      }
    } else {
      if (!colSelected(d)) {
        setSelectedCols([...selectedCols, d.column]);
      }
      newNodes = [...selectedNodes, d];
    }
    setSelectedNodes(newNodes);

    /** NOTE: 
     * Original plan: Highlight links that satisfy all selected nodes.
     * 
     * Issue: Links are not subdivisible by node. Selecting a small link that connects to a larger link in the next column
     *        will higlight the entire larger link, not just the part that corresponds to data from the smaller link.
     *        This can mislead viewers as to the actual number of rows that satisfy ALL selected nodes.
     * 
     *        e.g. if you select nodes col1.A, col2.B, and col3.C, links (col1.A -> col2.B) and (col2.B -> col3.C) will be highlighted.
     *        However, the link (col2.B -> col3.C) corresponds to data where (col2 == B && col3 == C), not (col1 == A && col2 == B && col3 == C).
     *        If there are more (col2 == B && col3 == C) rows than (col1 == A && col2 == B) rows, this will overestimate the number of 
     *        (col1 == A && col2 == B && col3 == C) rows.
     *
     * New plan: On link mouseover, highlight link to show popup with link value.
     *           On node selection/mouseover, update histogram viz to show total number of students, and new grade distribution.
     *           Streeeeeetch goal: compute new link that satisfies all selected nodes and animate it. Feels like a bit too much work.
     *           - When nodes col1.X and col2.Y are selected, split col1 X node into col1.(X && all other selected) and col1.(X && !(all other selected)).
     *           - Recompute links.
     */
    /*
    // selected nodes only highlights the node bar and changes the histogram in bottom right.
    let selectedCols = new Set(newNodes.map(n => n.column));
    const newLinks = newNodes.flatMap(n => links.filter(l => {
      if (!isEmpty(newNodes)) { // no nodes selected
        return false;
      }
      // if only nodes from one column selected
      if (selectedCols.size === 1) {
        return (l.source.id === n.id || l.target.id === n.id);
      } else {
        return nodeSelected(newNodes, l.source) && nodeSelected(newNodes, l.target);
      }
    }));
    console.log(newLinks);
    setSelectedLinks(newLinks);
    */
  }

  // On column click: deselect all nodes in column
  const handleColumnClick = (e, d) => {
    setSelectedCols(selectedCols.filter(c => !(c === d.column)));
    setSelectedNodes(selectedNodes.filter(n => !(n.column === d.column)));
  }

  // for logging changes in state
  useEffect(() => {
    console.log("nodes", selectedNodes);
    console.log("cols", selectedCols);
  }, [selectedNodes, selectedCols])

  function renderGraph(nodes, links) {
    // Define and configure Sankey generator
    const sankey = d3sankey.sankey()
        .nodeId(d => d.id)
        .nodeSort(sortNodes)
        .linkSort(sortLinks)
        .nodeWidth(NODE_WIDTH)
        .nodePadding(15)
        .extent([[margin.left, margin.top], [size.width - margin.right, size.height - margin.bottom]]);

    // Deep copy nodes/links so sankeyData is not mutated.
    // Doesn't matter for now since sankeyData is static, but may matter for stretch goal of changing columns.
    const transformedData = sankey({
      nodes: nodes.map(d => ({...d})),
      links: links.map(d => ({...d}))
    })

    console.log('nodes', transformedData.nodes);
    console.log('links', transformedData.links);

    let svg = d3.select('#sankey-diagram-svg').append('g');

    // Render nodes
    const nodeRects = svg.append('g')
      .selectAll()
      .data(transformedData.nodes)
      .join('rect')
        .attr('x', n => n.x0)
        .attr('y', n => n.y0)
        .attr('height', n => n.y1 - n.y0)
        .attr('width', n => n.x1 - n.x0)
        .attr('fill', n => color(n.id))
        // Highlight selected node. If none selected, highlight all by default.
        // TODO: add glow to selected nodes
        .attr('opacity', n => isEmpty(selectedNodes) ? 1 : nodeSelected(n) ? 1 : 0.5)
        .on('click', (e, d) => handleNodeClick(e, d));

    // Render links
    const linkPaths = svg.append('g')
      .selectAll()
      .data(transformedData.links)
      .join('g')
        .attr('fill', 'none')
        .attr('stroke-opacity', isEmpty(selectedNodes) ? 0.6 : 0.3)
        // .attr('stroke-opacity', l => linkSelected(selectedLinks, l) ? 0.8 : 0.2);
        .style('mix-blend-mode', 'soft-light')
      .append('path')
        .attr('d', d3sankey.sankeyLinkHorizontal())
        // TODO: add highlight on hover over.
        // TODO: color flows as gradient from source to target.
        .attr('stroke', l => color(l.source.id)) // color flow by value of previous
        .attr('stroke-width', l => l.width);

    // Add tooltip to nodes.
    nodeRects.append('title')
    .text(n => `${n.label}\n${n.value}`);
    
    // TODO: add hover for highlight/value to links
    // Add tooltip to links.
    linkPaths.append('title')
    .text(l => `${l.source.column}=${l.source.label} --> ${l.target.column}=${l.target.label}: \n${l.value}`);

    // Add labels to nodes
    let nodeLabels = svg.append('g');
    nodeLabels.selectAll()
      .data(transformedData.nodes)
      .join('text')
        .attr('x', n => n.x1 + 6)
        .attr('y', n => (n.y1 + n.y0) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', n => 'start')
        .text(n => n.label + ': ' + n.value); // TODO: show frequency on link hover
    // drop shadow text for visibility
    nodeLabels.selectAll('text')
      .clone(true).lower()
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.4)
      .attr('stroke', 'gray');

    // Add labels to columns
    let columnCoords = [];
    SELECTED_COLUMNS.forEach(c => {
      let topNodeForCol = transformedData.nodes.find(n => n.column === c);
      topNodeForCol && columnCoords.push({
        column: topNodeForCol.column,
        label: COL_TO_LABEL_MAP.get(topNodeForCol.column),
        x: topNodeForCol.x0, 
        y: topNodeForCol.y0,
      });
    });

    let columnLabels = svg.append('g');
    columnLabels.selectAll('g')
    .data(columnCoords)
    .enter()
    .append('text')
      .attr('x', c => c.x + NODE_WIDTH / 2)
      .attr('y', c => c.y - 12)
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .attr('font-weight', 'bold')
      .attr('font-size', 'medium')
      .text(c => c.label)
      .on('click', (e, d) => handleColumnClick(e, d));
  }

  return (
    <>
      <div ref={graphRef} className='chart-container'>
        <svg id='sankey-diagram-svg' width='100%' height='100%'></svg>
      </div>
    </>
  )
}
