import { useEffect, useState, useContext, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import DataContext from '../stores/DataContext.ts';

import { ComponentSize, DataRow } from '../types.ts';

export default function Viz1() {
  // Get data from context
  const data = useContext(DataContext);

  // Define selected columns. Hardcode for now, make interactive in HW3.
  const SELECTED_COLUMNS_LABEL_MAP = new Map<string, string[]>([
    ['travelTime', ['<15min', '15-30min', '30min-1hr', '>1hr']],
    ['studyTime', ['<2hr', '2-5hr', '5-10hr', '>10hr']],
    ['famRel', ['Very Bad', 'Bad', 'Average', 'Good', 'Very Good']],
    ['freeTime', ['Very Low', 'Low', 'Average', 'High', 'Very High']],
    ['weekdayAlc', ['Very Low', 'Low', 'Average', 'High', 'Very High']],
    ['weekendAlc', ['Very Low', 'Low', 'Average', 'High', 'Very High']],
    ['health', ['Very Bad', 'Bad', 'Average', 'Good', 'Very Good']],
  ]);
  const SELECTED_COLUMNS = [
    'travelTime',
    'studyTime',
    'famRel',
    'freeTime',
    'weekdayAlc',
    'weekendAlc',
    'health',
  ];
  const COLOR_COLUMN = 'G3';

  const margin = { top: 200, right: 40, bottom: 40, left: 40 };

  // Component size, not window size. Depends on grid size.
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  // On window resize, call setSize with delay of 200 milliseconds
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)
  // If ref is created with useRef(null), React will map it to node in JSX on render.
  // Changes to ref (from d3) do not trigger rerenders.
  // Important: ref cannot be read while rendering, must be done in event handler or useEffect().
  const graphRef = useRef<HTMLDivElement>(null);
  useResizeObserver({ ref: graphRef, onResize });

  const interSetSpacing = size.height / SELECTED_COLUMNS.length;
  const height = SELECTED_COLUMNS.length * interSetSpacing; // compute total height of graph using number of columns

  useEffect(() => {
    if (isEmpty(data)) return;
    if (size.width === 0 || size.height === 0) return; // if component not rendered

    // Reset graph
    d3.select('#para-coord-chart-svg').selectAll('*').remove();
    renderGraph();
  }, [data, size]) // For some reason if we don't include size then data will not render.

  function renderGraph() {
    // Compute horizontal scale for each category
    // key: columnname (string), value: ScaleBand<string> or ScaleBand<number>
    let xScaleMap = new Map<string, d3.ScaleOrdinal<string, unknown, never>>();
    let domainMap = new Map<string, string[]>();
    SELECTED_COLUMNS.forEach(columnName => {
      let domainSet = SELECTED_COLUMNS_LABEL_MAP.get(columnName);
      let scale = d3.scaleOrdinal()
        .range(d3.quantize(d3.interpolate(margin.left, size.width - margin.right), domainSet!.length))
        .domain(domainSet!);
      xScaleMap.set(columnName, scale);
      domainMap.set(columnName, domainSet!);
    });
    console.log(domainMap);

    // Compute vertical position for each category
    const y = d3.scalePoint(SELECTED_COLUMNS, [margin.top-10, height - margin.bottom]);
    // color for plotted lines - corresponds to final grade G3
    // Not super distinguishable right now but will be better when made brushable.
    const color = d3.scaleLinear([0, 20], ['red', 'lime']);
    
    // Create path generator
    function path(row : DataRow) {
      return d3.line()(SELECTED_COLUMNS.map( columnName => {
        let xScale = xScaleMap.get(columnName);
        let xCoord = xScale?.(row[columnName] as string);
        let yCoord = y(columnName);
        return [ xCoord, yCoord ] as [number, number] 
      }));
    }

    let svg = d3.select('#para-coord-chart-svg');
    let paraCoordPlot = svg.append('g');

    // Plot coordinate lines and add tooltips.
    paraCoordPlot.append('g')
      .selectAll('path')
      .data(data)
      .join('path')
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', d => color(d[COLOR_COLUMN]))
        .attr('stroke-opacity', 0.75)
        .attr('stroke-width', 1.6)
      .append('title') // tooltip for final score for each plotted line
        .text(d => 'Final G3 math score: ' + d[COLOR_COLUMN] + '/20');

    // Append the axis for each dimension.
    paraCoordPlot.append('g')
      .selectAll('g')
      .data(SELECTED_COLUMNS)
      .enter()
      .append('g')
        .attr('transform', columnName => 'translate(0, ' + y(columnName) + ')')
        .each(function(columnName) { d3.select(this).call(
          d3.axisBottom(xScaleMap.get(columnName) as any)
            .tickValues(SELECTED_COLUMNS_LABEL_MAP.get(columnName) as string[])
        ); })
        .call(g => g.append('text') // axis title
          .attr('x', margin.left / 2)
          .attr('y', -6)
          .attr('text-anchor', 'start')
          .attr('fill', 'currentColor')
          .attr('font-weight', 'bold')
          .attr('font-size', 'small')
          .text(columnName => {
            return columnName;
          }))
        .call(g => g.selectAll('text') // background for text for visibility
          .clone(true).lower()
          .attr('stroke-width', 4)
          .attr('stroke', 'white'));

    // Chart title
    paraCoordPlot.append('g')
      .append('text')
        .attr('transform', `translate(${size.width / 2}, ${margin.top / 4})`)
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', 'large')
        .text('Math grade as related to selected student characteristics')
    
    // Chart subtitle
    paraCoordPlot.append('g')
      .append('text')
        .attr('transform', `translate(${size.width / 2}, ${margin.top / 4 + 20})`)
        .attr('font-size', 'small')
        .style('text-anchor', 'middle')
        .text('Hover over line for student\'s final math grade.')
    
    let colorLegend = paraCoordPlot.append('g');
    
    // Create gradient for color legend
    colorLegend.append('linearGradient')
      .attr('id', 'color-gradient')
      .selectAll('stop')
      .data(color.range())
      .enter().append('stop')
        .attr('offset', (_,i) => i/(color.range().length-1))
        .attr('stop-color', d => d);
    
    colorLegend.append('g')
      .append('rect')
        .attr('transform', `translate(${size.width / 2 - 300/2}, ${margin.top / 2 })`)
        .attr('width', 300)
        .attr('height', 20)
        .style('fill', 'url(#color-gradient');

    colorLegend.append('g')
      .append('text')
        .attr('transform', `translate(${size.width / 2}, ${margin.top / 2 + 45})`)
        .attr('font-size', 'small')
        .style('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .text('Final math grade (scored out of 20)');

    // colorLegend.append('g')
    //   .selectAll('text')
    //   .data(d3.quantize(d3.interpolateNumber(...color.domain() as [number, number]), 5))
    //   .enter().append('text')
    //     // translate size.width/2 to middle, 300/2 to start of 300 wide bar, + 300/4*i to get to correct tick
    //     .attr('transform', (_, i) => `translate(${size.width / 2 - 300/2 + 300 / 4 * i}, ${margin.top / 2 + 25})`)
    //     .attr('font-size', 'small')
    //     .style('text-anchor', 'middle')
    //     .text(d => d);
    
    const colorAxisScale = d3.scaleLinear([0, 20], [0, 300]);
    colorLegend.append('g')
      .attr('transform', `translate(${size.width / 2 - 300/2}, ${margin.top / 2 + 20})`)
      .call(d3.axisBottom(colorAxisScale).ticks(5).tickSize(-20))
      .select('.domain').remove();
  }

  return (
    <>
      <div ref={graphRef} className='chart-container'>
        <svg id='para-coord-chart-svg' width='100%' height='100%'></svg>
      </div>
    </>
  )
}
