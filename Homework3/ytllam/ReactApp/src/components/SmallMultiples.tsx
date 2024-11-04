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

export default function SmallMultiples() {
  // Get data from context
  const data = useContext(DataContext);
  const SCORE_DOMAIN = [0, 20];
  const BAR_SPACING = 1;

  const margin = { top: 10, right: 10, bottom: 20, left: 25 };

  // Component size, not window size. Depends on grid size.
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const [cellLayout, setCellLayout] = useState([2, 2]);
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
    // TODO: reset each individually
    d3.select('#smallMult0_0').selectAll('*').remove();
    d3.select('#smallMult1_1').selectAll('*').remove();
    d3.select('#smallMult2_2').selectAll('*').remove();
    d3.select('#smallMult2_3').selectAll('*').remove();  
    d3.select('#smallMult2_4').selectAll('*').remove();
    d3.select('#smallMult2_5').selectAll('*').remove();
    
    console.log('rerendering');

    renderGraph();
  }, [data, size]) // For some reason if we don't include size then data will not render.

  // for logging changes in state
  useEffect(() => {
    // console.log("histogram render");
  }, [])

  // TODO: make small multiples.
  function renderGraph() {
    renderSingle(0, 0);
    renderSingle(1, 1);
    renderSingle(2, 2);
    renderSingle(2, 3);
    renderSingle(2, 4);

  }

  function renderSingle(i, rowDiv) {
    let svg = d3.select('#smallMult' + i + '_' + rowDiv)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%');
    
    const { height: boxHeight, width: boxWidth, x: boxX, y: boxY } = svg.node()?.getBoundingClientRect();
    // const boxHeight = size.height / cellLayout[1];
    // const boxWidth = size.width / cellLayout[0];
    // console.log('smallMult', svg.node()?.getBoundingClientRect());
    
    const bin = d3.bin()
    .domain(SCORE_DOMAIN)
    .thresholds(10)
    .value(d => d.G3);
    const binnedData = bin(data);
    // console.log('smallMult', binnedData);

    const x = d3.scaleLinear()
    .domain([binnedData[0].x0, binnedData[binnedData.length - 1].x1])
    .range([margin.left, boxWidth - margin.right]);

    svg.append('g')
    .attr("transform", `translate(0, ${boxHeight - margin.bottom})`)
    .call(d3.axisBottom(x));

    const y = d3.scaleLinear()
    .range([boxHeight - margin.bottom, margin.top])
    .domain([0, d3.max(binnedData, bd => bd.length)]);

    const yAxisTicks = y.ticks().filter(Number.isInteger); // so we don't get decimal ticks when there's only 1-2 items per bin
    svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y).tickSizeOuter(0).ticks(4, '.0f'));
    
    const histBars = svg.append('g')
    .selectAll('rect')
    .data(binnedData)
    .join('rect')
    .attr('x', d => x(d.x0) + BAR_SPACING / 2)
    .attr('y', d => y(d.length))
    .attr('width', d => Math.max((x(d.x1) - x(d.x0) - BAR_SPACING), 0))
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

    return (
      <svg id={i}></svg>
    )
  }

  // TODO: convert to scaleBand so ticks are middle aligned
  // TODO: label rows/columns
  return (
    <>
      <div ref={graphRef} className='small-multiples-container'>
        <Grid container direction='column' textAlign='center' id='smallMultiples' fontSize="0.8rem" >
          {/* TODO: dynamically generate cells. Fixed 3 rows G1/G2/G3, dynamic columns based on #values for chosen column. */}
          <Grid container item id='smallMultipleTitleY' sm={1} justifyContent='center' >Chart title</Grid>
          <Grid container item id='smallMultRow0' xs>
            <Grid item id='smallMult0_label' xs={1}>labelA</Grid>
            <Grid item id='smallMult0_0' xs></Grid>
            <Grid item id='smallMult0_1' xs></Grid>
            <Grid item id='smallMult0_2' xs></Grid>
            <Grid item id='smallMult0_3' xs></Grid>
            <Grid item id='smallMult0_4' xs></Grid>
          </Grid>
          <Grid container item id='smallMultRow1' xs>
            <Grid item id='smallMult1_label' xs={1}>labelB</Grid>
            <Grid item id='smallMult1_0' xs></Grid>
            <Grid item id='smallMult1_1' xs></Grid>
            <Grid item id='smallMult1_2' xs></Grid>
            <Grid item id='smallMult1_3' xs></Grid>
            <Grid item id='smallMult1_4' xs></Grid>
          </Grid>
          <Grid container item id='smallMultRow2' xs>
            <Grid item id='smallMult2_label' xs={1}>labelC</Grid>
            <Grid item id='smallMult2_0' xs></Grid>
            <Grid item id='smallMult2_1' xs></Grid>
            <Grid item id='smallMult2_2' xs></Grid>
            <Grid item id='smallMult2_3' xs></Grid>
            <Grid item id='smallMult2_4' xs></Grid>
          </Grid>
          <Grid container item id='smallMultipleTitleX' textAlign='center' sm={1} columns={13}>
            <Grid item id='smallMultipleTitleX0' xs={1}></Grid>
            <Grid item id='smallMultipleTitleX1' xs>label1</Grid>
            <Grid item id='smallMultipleTitleX2' xs>label2</Grid>
            <Grid item id='smallMultipleTitleX3' xs>label3</Grid>
            <Grid item id='smallMultipleTitleX4' xs>label3</Grid>
            <Grid item id='smallMultipleTitleX5' xs>label3</Grid>
          </Grid>
        </Grid>
      </div>
    </>
  )
}
