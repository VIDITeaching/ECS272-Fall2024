import React from 'react'
import { useEffect, useState, useContext, useRef } from 'react';
import * as d3 from 'd3';
import dataFromJson from '../../data/demo.json';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import DataContext from '../stores/DataContext.js';

import { Bar, ComponentSize, DataRow, Margin, NUMBER_COLUMNS } from '../types.js';

export default function Viz1TS() {
  // Get data from context
  const data = useContext(DataContext);
  const SELECTED_COLUMNS : string[] = [
    "school",
    "sex",
    "age",
    "address",
    "parentStatus",
    "travelTime",
    "studyTime",
    "famRel",
    "freeTime",
    "goOut",
    "weekdayAlc",
    "weekendAlc",
    "health",
    "absences",
  ];
  const COLOR_COLUMN = "G3";

  const margin: Margin = { top: 40, right: 20, bottom: 40, left: 20 };
  const interSetWidth = 100;
  const height = SELECTED_COLUMNS.length * interSetWidth; // compute total height of graph using number of columns

  // Component size, not window size. Depends on grid size.
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  // On window resize, call setSize with delay of 200 milliseconds
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)
  // If ref is created with useRef(null), React will map it to node in JSX on render.
  // Changes to ref (from d3) do not trigger rerenders.
  // Important: ref cannot be read while rendering, must be done in event handler or useEffect().
  const graphRef = useRef<HTMLDivElement>(null);
  useResizeObserver({ ref: graphRef, onResize });

  useEffect(() => {
    if (isEmpty(data)) return;
    if (size.width === 0 || size.height === 0) return; // if component not rendered

    // Reset graph
    d3.select('#para-coord-chart-svg').selectAll('*').remove();
    renderGraph();
  }, [data]) // Run if data updated

  function renderGraph() {
    // Create horizontal scales for each column
    // need to cast d[col] as any to fix
    const x = new Map(Array.from(SELECTED_COLUMNS, col => [col, d3.scaleOrdinal(d3.extent(data, d => d[col] as any) as [string, string], [margin.left,  size.width - margin.right])]));
    console.log(x);
    // Vertical scale - maps column to vertical position
    const y = d3.scalePoint(SELECTED_COLUMNS, [margin.top, height - margin.bottom]);
    // color for plotted lines - corresponds to final grade G3
    const color = d3.scaleLinear([0, 20], ["red", "green"]);

    let svg = d3.select('#para-coord-chart-svg');

    const lineGenerator = d3.line()
      .defined(([, value]) => value != null)
      .x(([key, value]) => x.get(key.toString())!(value.toString()))
      .y(([key]) => y(key.toString()));

    svg.append("g")
        .attr("fill", "none")
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.4)
      .selectAll("path")
      .data(data.slice().sort((a, b) => d3.ascending(a[COLOR_COLUMN], b[COLOR_COLUMN])))
      .join("path")
        .attr("stroke", d => color(d[COLOR_COLUMN]))
        .attr("d", d => lineGenerator(d3.cross(SELECTED_COLUMNS, [d], (key, d) => [key, d[key]])));
  }

  return (
    <>
      <div ref={graphRef} className='chart-container'>
        {/* <p>{data.length} rows in data.</p>
        <p>{size.height} x {size.width}</p> */}
        <svg id='para-coord-chart-svg' width='100%' height='100%'></svg>
      </div>
    </>
  )
}
