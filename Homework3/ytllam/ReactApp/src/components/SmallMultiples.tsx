import { useEffect, useState, useContext, useRef } from 'react';
import * as d3 from 'd3';
import * as d3sankey from 'd3-sankey';
import * as style from '../style.css'
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import DataContext from '../stores/DataContext.ts';
import SelectedDataContext from '../stores/SelectedDataContext.ts';
import Grid from '@mui/material/Grid';


import { ComponentSize, DataRow, BooleanEnum, COL_TO_ENUM_MAP, ALL_NODES, COL_TO_LABEL_MAP } from '../types.ts';

// TODO: change histograms to box plots.

export default function SmallMultiples() {
  // Get data from context
  const data = useContext(DataContext);
  const { selectedData } = useContext(SelectedDataContext);

  const SCORE_DOMAIN = [0, 20];
  const NUM_GRADE_PERIODS = 3;
  const BAR_SPACING = 1;

  // const margin = { top: 10, right: 10, bottom: 20, left: 25 };
  const margin = { top: 20, right: 20, bottom: 20, left: 30 };

  // Component size, not window size. Depends on grid size.
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const [selectedCol, setSelectedCol] = useState('weekendAlc');
  const colValues = Object.values(COL_TO_ENUM_MAP.get(selectedCol));
  const boxWidth = size.width / NUM_GRADE_PERIODS;
  const boxHeight = size.height / colValues.length;

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
    // TODO: reset each individually
    d3.select('#small-multiples-svg').selectAll('*').remove();
    renderGraph();
  }, [data, size]) // For some reason if we don't include size then data will not render.

  // for logging changes in state
  useEffect(() => {
    // console.log("histogram render");
    // TODO: depending on column selected, update cellLayout
  }, [selectedData])

  // TODO: add dropdown for selecting dimension
  function renderGraph() {
    let svg = d3.select('#small-multiples-svg')

    for (let i = 0; i < NUM_GRADE_PERIODS; i++) {    
      for (let j = 0; j < colValues.length; j++) {
        const xOffset = boxWidth * i;
        const yOffset = boxHeight * j;
    
        const subChart = svg.append('g')
                        .attr('transform', `translate(${xOffset}, ${yOffset})`);

        const gradePeriodColumnName = 'G' + (i + 1).toString();
        const selectedColumnValueFilter = (d) => d[selectedCol] === colValues[j];
        renderSingle(subChart, selectedColumnValueFilter, gradePeriodColumnName);
      }
    }
    // TODO: add chart, axis titles
    // TODO: add tooltip for total number on top of bar
    // TODO: highlight bar on hover
    // TODO: add timestep for data shift
    // TODO: color scheme for bars?
  }

  function renderSingle(subChartNode, selectedColumnValueFilter, gradePeriodColumn) {
    const bin = d3.bin()
      .domain(SCORE_DOMAIN)
      .thresholds(10)
      .value(d => d[gradePeriodColumn]);
    const binnedData = bin(data.filter(d => selectedColumnValueFilter(d)));

    // TODO: use same y scale for all plots
    const x = d3.scaleLinear()
      .domain([binnedData[0].x0, binnedData[binnedData.length - 1].x1])
      .range([margin.left, boxWidth - margin.right]);

    subChartNode.append('g')
      .attr("transform", `translate(0, ${boxHeight - margin.bottom})`)
      .call(d3.axisBottom(x));

    const y = d3.scaleLinear()
      .range([boxHeight - margin.bottom, margin.top])
      .domain([0, d3.max(binnedData, bd => bd.length)]);

    const yAxisTicks = y.ticks().filter(Number.isInteger); // so we don't get decimal ticks when there's only 1-2 items per bin
    subChartNode.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).tickSizeOuter(0).ticks(4, '.0f'));
    
    const histBars = subChartNode.append('g')
      .selectAll('rect')
      .data(binnedData)
      .join('rect')
      .attr('x', d => x(d.x0) + BAR_SPACING / 2)
      .attr('y', d => y(d.length))
      .attr('width', d => Math.max((x(d.x1) - x(d.x0) - BAR_SPACING), 0))
      .attr('height', d => Math.abs(y(0) - y(d.length))) 
      .attr('fill', 'teal');
  }

  // TODO: label rows/columns
  return (
    <>
      <div ref={graphRef} className='chart-container'>
        <svg id='small-multiples-svg' width='100%' height='100%'></svg>
      </div>
    </>
  )
}
