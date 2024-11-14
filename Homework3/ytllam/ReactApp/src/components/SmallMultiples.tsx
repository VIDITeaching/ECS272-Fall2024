import { useEffect, useState, useContext, useRef } from 'react';
import * as d3 from 'd3';
import * as style from '../style.css'
import { invertBy } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import DataContext from '../stores/DataContext.ts';
import Grid from '@mui/material/Grid';
import Select from 'react-select';


import { ComponentSize, DataRow, BooleanEnum, COL_TO_ENUM_MAP, ALL_NODES, COL_TO_LABEL_MAP } from '../types.ts';

export default function SmallMultiples() {
  // Get data from context
  const data = useContext(DataContext);

  const GRADE_DOMAIN = [0, 20];
  const NUM_GRADE_PERIODS = 3;

  // const margin = { top: 10, right: 10, bottom: 20, left: 25 };
  const margin = { top: 80, right: 20, bottom: 80, left: 60 };

  // Component size, not window size. Depends on grid size.
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const [selectedCol, setSelectedCol] = useState({
    label: COL_TO_LABEL_MAP.get('gradeTrend'),
    value: 'gradeTrend'
  });
  const colOptions = Array.from(COL_TO_LABEL_MAP.entries()).map(([colName, colLabel]) => ({
    label: colLabel,
    value: colName
  }));

  const colEnumType = COL_TO_ENUM_MAP.get(selectedCol.value);
  const colValues = Object.values(colEnumType);
  const colValToLabels = invertBy(colEnumType);
  const boxWidth = size.width / (NUM_GRADE_PERIODS);

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
    d3.select('#small-multiples-svg').selectAll('*').remove();
    renderGraph();
  }, [data, selectedCol, size]) // For some reason if we don't include size then data will not render.

  // for logging changes in state
  useEffect(() => {
    // console.log('histogram render');
  }, [])

  function renderGraph() {
    let svg = d3.select('#small-multiples-svg')
    const chartNodes = [];

    for (let i = 0; i < NUM_GRADE_PERIODS; i++) {    
        const xOffset = boxWidth * i;
        const subChart = svg.append('g')
                        .attr('transform', `translate(${xOffset})`);

        chartNodes.push(renderSingle(subChart, 'G' + (i + 1).toString()));
    }
  }

  function renderSingle(subChartNode, gradePeriodColumn) {
    const boxPlotForValue = subChartNode.append('g');

    // Set up scales and axes
    const x = d3.scaleBand()
    .domain(colValues)
    .range([margin.left, boxWidth - margin.right])
    .padding(0.45);

    const xAxis = subChartNode.append('g')
    .attr('transform', `translate(0, ${size.height - margin.bottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0).tickFormat(d => colValToLabels[d][0]));
    
    xAxis.selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-0.75em')
      .attr('dy', '0.5em')
      .attr('transform', 'rotate(-25)');

    const selectedColLabel = COL_TO_LABEL_MAP.get(selectedCol.value);

    const y = d3.scaleLinear()
      .domain(GRADE_DOMAIN)
      .range([size.height - margin.bottom, margin.top]);
    const yAxis = subChartNode.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y))

    const yLabel = subChartNode.append('g')
      .attr('transform', `translate(${margin.left / 2}, ${margin.top + (size.height - margin.top - margin.bottom) / 2}) rotate(-90)`)
      .append('text')
      .attr('font-size', '1rem')
      .attr('text-anchor', 'middle')
      .text('Grade (out of 20)');

    const chartTitle = subChartNode.append('g')
    .append('text')
      .attr('transform', `translate(${margin.left + (boxWidth - margin.left)/ 2}, ${margin.top * 0.6})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '1.1rem')
      .attr('font-weight', 'bold')
      .text(selectedColLabel + ' v. ' + gradePeriodColumn + ' grade');
    
    const xLabel = subChartNode.append('g')
      .append('text')
        .attr('transform', `translate(${margin.left + (boxWidth - margin.left)/ 2}, ${size.height - margin.bottom / 8})`)
        .attr('text-anchor', 'middle')
        .attr('font-size', '1rem')
        .text(selectedColLabel);
  

    // Get statistics
    colValues.forEach(v => {
      const sortedGrades = data.filter(d => d[selectedCol.value] === v)
        .map(d => d[gradePeriodColumn])
        .sort((a, b) => a - b);
      const min = sortedGrades[0];
      const quartiles = [0.25, 0.5, 0.75].map(q => d3.quantile(sortedGrades, q));
      const max = sortedGrades[sortedGrades.length - 1];
      const iqr = quartiles[2] - quartiles[0];
      const outlier_min = Math.max(min, quartiles[0] - iqr * 1.5);
      const outlier_max = Math.min(max, quartiles[2] + iqr * 1.5);

      // Vertical line
      boxPlotForValue
        .append('line')
        .attr('x1', x(v) + x.bandwidth() / 2)
        .attr('x2', x(v) + x.bandwidth() / 2)
        .attr('y1', y(outlier_min))
        .attr('y2', y(outlier_max))
        .attr('stroke', 'black');
      
      // Horizontal lines
      boxPlotForValue
        .append('rect')
        .attr('x', x(v))
        .attr('y', y(quartiles[2]))
        .attr('height', y(quartiles[0]) - y(quartiles[2]))
        .attr('width', x.bandwidth())
        .attr('stroke', 'black')
        .style('fill', 'teal');
      
      boxPlotForValue.append('g')
        .selectAll('horLine')
        .data([outlier_min, quartiles[1], outlier_max])
        .join('line')
          .attr('x1', x(v))
          .attr('x2', x(v) + x.bandwidth())
          .attr('y1', d => y(d))
          .attr('y2', d => y(d))
          .attr('stroke', 'black');
      
      // Plot outliers with jitter for visibility
      const jitter = x.bandwidth() * 0.6;
      boxPlotForValue.append('g')
      .selectAll('circle')
      .data(sortedGrades)
      .join('circle')
        .attr('fill', d => d > outlier_max || d < outlier_min ? 'red' : 'silver')
        .attr('fill-opacity', d => d > outlier_max || d < outlier_min ? 0.6 : 0.15)
        .attr('stroke', 'none')
        .attr('r', 3)
        .attr('cx', () => x(v) + x.bandwidth() / 2 - jitter / 2 + Math.random() * jitter)
        .attr('cy', d => y(d));
    })
    return boxPlotForValue;
  }

  // TODO: add crosshair that renders across all 3 graphs for comparing across grade periods
  // TODO: hide scatter points when display too small

  // https://github.com/JedWatson/react-select/issues/4201#issuecomment-874098561
  const reactSelectStyle = {
    menu: (base) => ({
      ...base,
      width: "max-content",
      minWidth: "100%"
    }),
  }

  return (
    <>
      <div className='chart-container'>
        <Grid container direction='column' height='100%'>
          <Grid item xs={1} alignItems='center' paddingLeft={3} display='flex'>
            <label className='select-label'>Select column to see its relationship with grades:</label>
            <Select
              options={colOptions}
              value={selectedCol}
              onChange={e => setSelectedCol(e)}
              styles={reactSelectStyle}
            />
          </Grid>
          <Grid item xs ref={graphRef} >
            <svg id='small-multiples-svg' width='100%' height='100%'></svg>
          </Grid>
        </Grid>
      </div>
    </>
  )
}
