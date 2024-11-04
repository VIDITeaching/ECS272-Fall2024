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
  const SCORE_DOMAIN = [0, 20];
  const BAR_SPACING = 4;

  const margin = { top: 10, right: 20, bottom: 50, left: 20 };

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
      // TODO: OR filters in same column
      // TODO: create strings for displaying filters
      // const colType = COL_TO_ENUM_MAP.get(col);
      const filter = d => d[col] === n.val;
      return filter;
    });

    console.log('filters', filters);
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
    // console.log("filtered", filteredData);
    let svg = d3.select('#histogram-svg').append('g');
                // .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
    const bin = d3.bin()
      .domain(SCORE_DOMAIN)
      .thresholds(20)
      .value(d => d.G3);
    const binnedData = bin(filteredData);

    const x = d3.scaleLinear()
      .domain([binnedData[0].x0, binnedData[binnedData.length - 1].x1])
      .range([margin.left, size.width - margin.right]);

    svg.append('g')
      .attr("transform", `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(x).tickValues(Array.from(Array(SCORE_DOMAIN[1]).keys())));
    
    const y = d3.scaleLinear()
      .range([size.height - margin.bottom, margin.top])
      .domain([0, d3.max(binnedData, bd => bd.length)]);

    const yAxisTicks = y.ticks().filter(Number.isInteger); // so we don't get decimal ticks when there's only 1-2 items per bin
    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).tickSizeOuter(0).tickValues(yAxisTicks).tickFormat(d3.format('.0f')));
    

    // console.log(binnedData.map(b => b.length));

    const histBars = svg.append('g')
      .selectAll('rect')
      .data(binnedData)
      .join('rect')
      .attr('x', d => x(d.x0) + BAR_SPACING / 2)
      .attr('y', d => y(d.length))
      .attr('width', d => x(d.x1) - x(d.x0) - BAR_SPACING)
      .attr('height', d => Math.abs(y(0) - y(d.length)))
      .attr('fill', 'teal');

    // TODO: add chart, axis titles
    // TODO: add tooltip for total number on top of bar
    // TODO: highlight bar on hover
    // TODO: add timestep for data shift
    // TODO: color scheme for bars?
    // TODO: display message when no students satisfy filters
    // TODO: list selected filters
    // TODO: add dropdown/radio button for grade period G1/G2/G3 and/or timestep between G1/G2/G3.
    //      (note: timestepping between grades will stretch y axis unless the scale is fixed to max bin freq over all periods)
  }

  // TODO: convert to scaleBand so ticks are middle aligned
  return (
    <>
      <div ref={graphRef} className='chart-container'>
        <svg id='histogram-svg' width='100%' height='100%'></svg>
      </div>
    </>
  )
}
