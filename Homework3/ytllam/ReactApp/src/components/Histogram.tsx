import { useEffect, useState, useContext, useRef } from 'react';
import * as d3 from 'd3';
import * as d3sankey from 'd3-sankey';
import * as style from '../style.css'
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import DataContext from '../stores/DataContext.ts';
import SelectedDataContext from '../stores/SelectedDataContext.ts';

import { ComponentSize, DataRow, BooleanEnum, COL_TO_ENUM_MAP, ALL_NODES, COL_TO_LABEL_MAP } from '../types.ts';

export default function Histogram() {
  // Get data from context
  const data = useContext(DataContext);
  const { selectedData } = useContext(SelectedDataContext);

  const margin = { top: 100, right: 200, bottom: 100, left: 200 };

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

  useEffect(() => {
    // if (isEmpty(data)) return;
    if (size.width === 0 || size.height === 0) return; // if component not rendered

    // Reset graph
    d3.select('#histogram-svg').selectAll('*').remove();

    // Generate list of filters
    const filters = selectedData.map(n => {
      const col = n.column;
      // const colType = COL_TO_ENUM_MAP.get(col);
      const filter = d => d[col] === n.val;
      return filter;
    });

    console.log(filters);
    let filteredData;
    if (!isEmpty(filters)) {
      filteredData = data.filter(d => filters.every(f => f(d)));
    } else {
      filteredData = data;
    }

    renderGraph(filteredData);
  }, [data, selectedData, size]) // For some reason if we don't include size then data will not render.

  // for logging changes in state
  useEffect(() => {
    // console.log("histogram render");
  }, [])

  function renderGraph(filteredData) {
    // let svg = d3.select('#histogram-svg').append('g');
    console.log("filtered", filteredData);
  }

  return (
    <>
      <p>{selectedData.length}</p>
      <div ref={graphRef} className='chart-container'>
        <svg id='histogram-svg' width='100%' height='100%'>
          <text>test</text>
        </svg>
      </div>
    </>
  )
}
