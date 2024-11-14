import { useEffect, useState, useContext, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import * as d3sankey from 'd3-sankey';
import * as style from '../style.css'
import { invertBy, isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import DataContext from '../stores/DataContext.ts';
import SelectedDataContext from '../stores/SelectedDataContext.ts';
import Grid from '@mui/material/Grid';
import Select from 'react-select';

import { ComponentSize, DataRow, BooleanEnum, COL_TO_ENUM_MAP, ALL_NODES, COL_TO_LABEL_MAP } from '../types.ts';

export default function BarChart() {
  const margin = { top: 80, right: 20, bottom: 50, left: 80 };

  // Component size, not window size. Depends on grid size.
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  // On window resize, call setSize with delay of 200 milliseconds
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)
  // If ref is created with useRef(null), React will map it to node in JSX on render.
  // Changes to ref (from d3) do not trigger rerenders.
  // Important: ref cannot be read while rendering, must be done in event handler or useEffect().
  const graphRef = useRef<HTMLDivElement>(null);
  useResizeObserver({ ref: graphRef, onResize });

  // Get data from context
  const data = useContext(DataContext);
  const { selectedData, _ } = useContext(SelectedDataContext);
  const { selectedNodes, selectedCols } = selectedData;
  const [ gradePeriod, setGradePeriod ] = useState({
    label: 'Period 1',
    value: 'G1'
  });

  const GRADE_DOMAIN = [0, 20];

  // Generate list of filters    
  const filters = selectedCols.map(col => { // for each selected column,
    const selectedNodesForCol = selectedNodes.filter(n => n.column === col);
    const filtersForCol =  selectedNodesForCol.map(n => d => d[col] === n.val); // get selected sankey nodes for the column

    // short circuit comparisons if all possible values selected
    if (filtersForCol.length === Object.values(COL_TO_ENUM_MAP.get(col)).length)
      return [d => true];

    const colValLabels = invertBy(COL_TO_ENUM_MAP.get(col));
    const valStringsForCol = selectedNodesForCol.map(n => `'${colValLabels[n.val][0]}'`); // create predicate for selected value
    
    const filterStringForCol = `( ${COL_TO_LABEL_MAP.get(col)} =\
      ${valStringsForCol.length === 1 ? '' : '['} ${valStringsForCol.join(' | ')} ${valStringsForCol.length === 1 ? '' : '['} \
    )`;

    return filtersForCol;
  });

  const filterStrings = selectedCols.map(col => { // for each selected column,
    const selectedNodesForCol = selectedNodes.filter(n => n.column === col);
    const filtersForCol =  selectedNodesForCol.map(n => d => d[col] === n.val); // get selected sankey nodes for the column

    // short circuit comparisons if all possible values selected
    if (filtersForCol.length === Object.values(COL_TO_ENUM_MAP.get(col)).length) return;

    const colValLabels = invertBy(COL_TO_ENUM_MAP.get(col));
    const valStringsForCol = selectedNodesForCol.map(n => `'${colValLabels[n.val][0]}'`); // create predicate for selected value
    
    const filterStringForCol = `( ${COL_TO_LABEL_MAP.get(col)} =\
      ${valStringsForCol.length === 1 ? '' : '['} ${valStringsForCol.join(' | ')} ${valStringsForCol.length === 1 ? '' : '['} \
    )`;

    return filterStringForCol;
  });

  const filterLabel = filterStrings.join(' && ');
  
  const filteredData = isEmpty(filters) 
    ? data
    : data.filter(d => 
        filters.every(colFilters => // AND filters between columns
          !isEmpty(colFilters)
          && colFilters.some(colValueFilter => colValueFilter(d)) // OR filters within columns
      ));

  const bin = d3.bin()
    .domain(GRADE_DOMAIN)
    .thresholds(20)
    .value(d => d[gradePeriod.value]);
  const binnedData = bin(filteredData);

  const gradeDomain = Array.from({ length: GRADE_DOMAIN[1] + 1 }, (_, i) => i);
  // console.log(gradeDomain);
  const x = d3.scaleBand()
  .domain(gradeDomain)
  .range([margin.left, size.width - margin.right])
  .padding(0.1);

  useMemo(() => {
    // if (isEmpty(data)) return;
    if (size.width === 0 || size.height === 0) return; // if component not rendered

    // Reset graph
    d3.select('#histogram-svg').selectAll('*').remove();

    renderGraph();
  }, [data, size]) // For some reason if we don't include size then data will not render.

  // Trigger transition in data
  useEffect(() => {
    const newBinnedData = bin(filteredData);

    const newY = d3.scaleLinear()
    .range([size.height - margin.bottom, margin.top])
    .domain([0, d3.max(binnedData, bd => bd.length)]);
    const newYAxisTicks = newY.ticks().filter(Number.isInteger); // so we don't get decimal ticks when there's only 1-2 items per bin
    
    // Timestep bar height
    d3.select('#chart-bars')
    .selectAll('rect')
    .data(newBinnedData)
    .join('rect')
    .transition()
    .duration(1000)
      .attr('x', d => x(d.x0))
      .attr('width', x.bandwidth())
      .attr('fill', 'teal')
      .attr('y', d => newY(0)) // d.length is size of bin.
      .attr('height', 0)
        .attr('y', d => newY(d.length)) // d.length is size of bin.
        .attr('height', d => Math.abs(newY(0) - newY(d.length)));

    // Timestep y axis
    d3.select('#y-axis')
    .transition()
    .duration(1000)
    .call(d3.axisLeft(newY).tickSizeOuter(0).tickValues(newYAxisTicks).tickFormat(d3.format('.0f')));

    // Display message when no data that matches all filters exists
    d3.select('#no-data-msg')
      .transition()
      .duration(1000)
      .style('display', newBinnedData.every(bin => bin.length === 0) ? null : 'none');

  }, [filteredData, gradePeriod])

  function renderGraph() {
    let svg = d3.select('#histogram-svg').append('g');
                // .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    svg.append('g')
      .attr('id', 'x-axis')
      .attr('transform', `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(x).tickValues(Array.from(Array(GRADE_DOMAIN[1]).keys())));

    const y = d3.scaleLinear()
      .range([size.height - margin.bottom, margin.top])
      .domain([0, d3.max(binnedData, bd => bd.length)]);
    
    const yAxisTicks = y.ticks().filter(Number.isInteger); // so we don't get decimal ticks when there's only 1-2 items per bin
    svg.append('g')
      .attr('id', 'y-axis')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).tickSizeOuter(0).tickValues(yAxisTicks).tickFormat(d3.format('.0f')));

    const noDataMessage = svg.append('g')
      .append('text')
      .attr('id', 'no-data-msg')
      .attr('transform', `translate(${margin.left + (size.width - margin.left)/ 2}, ${size.height / 2})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '1rem')
      .text('No students satisfy all the given filters.')
      .style('display', 'none');
    // console.log(binnedData.map(b => b.length));

    // console.log('bin',binnedData)
    const chartBars = svg.append('g')
      .attr('id', 'chart-bars')
      .selectAll('rect')
      .data(binnedData)
      .join('rect')
      .attr('x', d => x(d.x0))
      .attr('width', x.bandwidth())
      .attr('fill', 'teal')
      .attr('y', d => y(0)) // d.length is size of bin.
      .attr('height', 0)
      .attr('y', d => y(d.length)) // d.length is size of bin.
      .attr('height', d => Math.abs(y(0) - y(d.length)));
    
    chartBars.append('title') // tooltip for frequency
    .text(d => d.length + ' students')

    // Add chart, axis titles
    const yLabel = svg.append('g')
      .attr('transform', `translate(${margin.left / 2}, ${margin.top + (size.height - margin.top - margin.bottom) / 2}) rotate(-90)`)
      .append('text')
      .attr('font-size', '1rem')
      .attr('text-anchor', 'middle')
      .text('Frequency');

    const chartTitle = svg.append('g')
    .append('text')
      .attr('transform', `translate(${margin.left + (size.width - margin.left)/ 2}, ${margin.top * 0.6})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '1.2rem')
      .attr('font-weight', 'bold')
      .text('Grades of selected students for ' + gradePeriod.label);
    
    const xLabel = svg.append('g')
      .append('text')
        .attr('transform', `translate(${margin.left + (size.width - margin.left)/ 2}, ${size.height - margin.bottom / 4})`)
        .attr('text-anchor', 'middle')
        .attr('font-size', '1rem')
        .text('Student grade (out of 20)');
      
    // TODO: highlight bar and show total on top of bar on mouseover
    // TODO: add timestep when changing between grade period
    // TODO: color scheme for bars?
    //      (note: timestepping between grades will stretch y axis unless the scale is fixed to max bin freq over all periods)
  }

  // For react-select
  const gradePeriodOptions = [
    {
      label: 'Period 1',
      value: 'G1'
    },
    {
      label: 'Period 2',
      value: 'G2'
    },
    {
      label: 'Period 3',
      value: 'G3'
    }
  ]

  // https://github.com/JedWatson/react-select/issues/4201#issuecomment-874098561
  const reactSelectStyle = {
    menu: (base) => ({
      ...base,
      width: 'max-content',
      minWidth: '100%',
      zIndex: 5,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999
    })
  }

  // TODO: convert to scaleBand so ticks are middle aligned. ie change from histogram to bar chart
  return (
    <>
      <div className='chart-container'>
        <Grid container direction='column' height='100%'>
          <Grid container item xs={1} spacing={3} justifyContent='center' height='100%' paddingLeft={3}>
            <Grid item xs height='3rem' alignItems='center' alignSelf='center' display='flex' alignItems='center'>
              <p className='filter-label'>Applied filters (hover for full list):<br/>{filterLabel || 'None'}</p>
            </Grid>
            <Grid item xs={4} justifyContent='end' alignItems='center' marginRight={3} display='flex'>
              <Select
                  options={gradePeriodOptions}
                  value={gradePeriod}
                  menuPortalTarget={document.body}
                  onChange={e => setGradePeriod(e)}
                  styles={reactSelectStyle}
                />
            </Grid>
          </Grid>
          <Grid item xs ref={graphRef} >
            <svg id='histogram-svg' width='100%' height='100%'></svg>
          </Grid>
        </Grid>
      </div>
    </>
  )
}
