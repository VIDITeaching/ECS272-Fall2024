import { useEffect, useState, useContext, useRef } from 'react';
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

export default function Histogram() {
  // Get data from context
  const data = useContext(DataContext);
  const { selectedData, setSelectedData } = useContext(SelectedDataContext);
  const { selectedNodes, selectedCols } = selectedData;
  const [ gradePeriod, setGradePeriod ] = useState({
    label: 'Period 3',
    value: 'G3'
  });

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

  const SCORE_DOMAIN = [0, 20];
  const BAR_SPACING = 4;

  const margin = { top: 80, right: 20, bottom: 50, left: 50 };

  // Component size, not window size. Depends on grid size.
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const [filterLabel, setFilterLabel] = useState('');
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
    const filters = [];
    const filterStrings = [];

    selectedCols.forEach(col => { // for each selected column,
      const selectedNodesForCol = selectedNodes.filter(n => n.column === col);
      const filtersForCol =  selectedNodesForCol.map(n => d => d[col] === n.val); // get selected sankey nodes for the column

      if (filtersForCol.length === Object.values(COL_TO_ENUM_MAP.get(col)).length) return;

      const colValLabels = invertBy(COL_TO_ENUM_MAP.get(col));
      const valStringsForCol = selectedNodesForCol.map(n => `'${colValLabels[n.val][0]}'`); // create predicate for selected value
      
      const filterStringForCol = `( ${COL_TO_LABEL_MAP.get(col)} =\
        ${valStringsForCol.length === 1 ? '' : '['} ${valStringsForCol.join(' | ')} ${valStringsForCol.length === 1 ? '' : '['} \
      )`;

      filters.push(filtersForCol);
      filterStrings.push(filterStringForCol);
    });

    setFilterLabel(filterStrings.join(' && '));

    let filteredData;
    if (!isEmpty(filters)) {
      filteredData = data.filter(d => 
        filters.every(colFilters => // AND filters between columns
          !isEmpty(colFilters)
          && colFilters.some(colValueFilter => colValueFilter(d)) // OR filters within columns
        )
      );
    } else {
      filteredData = data;
    }
    // console.log('fd', filteredData);

    renderGraph(filteredData);
  }, [data, selectedData, gradePeriod, size]) // For some reason if we don't include size then data will not render.

  // for logging changes in state
  useEffect(() => {
    // console.log('histogram render');
  }, [])

  function renderGraph(filteredData) {
    // console.log('filtered', filteredData);
    let svg = d3.select('#histogram-svg').append('g');
                // .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    const bin = d3.bin()
      .domain(SCORE_DOMAIN)
      .thresholds(20)
      .value(d => d[gradePeriod.value]);
    const binnedData = bin(filteredData);

    const x = d3.scaleLinear()
      .domain([binnedData[0].x0, binnedData[binnedData.length - 1].x1])
      .range([margin.left, size.width - margin.right]);

    svg.append('g')
      .attr('transform', `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(x).tickValues(Array.from(Array(SCORE_DOMAIN[1]).keys())));
    
    const y = d3.scaleLinear()
      .range([size.height - margin.bottom, margin.top])
      .domain([0, d3.max(binnedData, bd => bd.length)]);

    const yAxisTicks = y.ticks().filter(Number.isInteger); // so we don't get decimal ticks when there's only 1-2 items per bin
    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).tickSizeOuter(0).tickValues(yAxisTicks).tickFormat(d3.format('.0f')));

    console.log('allempty', binnedData.every(bin => bin.length === 0), binnedData);
    if (binnedData.every(bin => bin.length === 0)) {
      const noDataMessage = svg.append('g')
      .append('text')
      .attr('transform', `translate(${margin.left + (size.width - margin.left)/ 2}, ${size.height / 2})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '1rem')
      .text('No students satisfy all the given filters.');
    };
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

    // Add chart, axis titles
    const yLabel = svg.append('g')
      .attr('transform', `translate(${margin.left / 4}, ${margin.top + (size.height - margin.top - margin.bottom) / 2}) rotate(-90)`)
      .append('text')
      .attr('font-size', '.8rem')
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .text('Frequency');

    const chartTitle = svg.append('g')
    .append('text')
      .attr('transform', `translate(${margin.left + (size.width - margin.left)/ 2}, ${margin.top * 0.6})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '1rem')
      .attr('font-weight', 'bold')
      .text('Selected student grade distribution for ' + gradePeriod.label);
    
    const xLabel = svg.append('g')
      .append('text')
        .attr('transform', `translate(${margin.left + (size.width - margin.left)/ 2}, ${size.height - margin.bottom / 3})`)
        .attr('text-anchor', 'middle')
        .attr('font-size', '.8rem')
        .attr('font-weight', 'bold')
        .text('Student grade (out of 20)');
      
    // TODO: highlight bar and show total on top of bar on mouseover
    // TODO: add timestep when changing between grade period
    // TODO: color scheme for bars?
    //      (note: timestepping between grades will stretch y axis unless the scale is fixed to max bin freq over all periods)
  }

  // https://github.com/JedWatson/react-select/issues/4201#issuecomment-874098561
  const reactSelectStyle = {
    menu: (base) => ({
      ...base,
      width: "max-content",
      minWidth: "100%",
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
