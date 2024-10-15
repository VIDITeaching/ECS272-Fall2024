import * as d3 from 'd3';
import { isEmpty, debounce } from 'lodash';

let size = { width: 800, height: 800 };
const onResize = (targets) =>
{
  targets.forEach(target =>
  {
    const targetId = target.target.getAttribute('id');
    if (targetId !== 'bar-container-graph1' && targetId !== 'bar-container-graph2' && targetId !== 'bar-container-graph3') return;
    size = { width: target.contentRect.width, height: target.contentRect.height };
    if (!isEmpty(size))
    {
      if (targetId === 'bar-container-graph1' && !isEmpty(column_from_csv))
      {
        d3.select('#Graph1').selectAll('*').remove();
        Graph1_Overall();
      } else if (targetId === 'bar-container-graph2')
      {
        d3.select('#Graph2').selectAll('*').remove();
        Graph2_Detail();
      } else if (targetId === 'bar-container-graph3')
      {
        d3.select('#Graph3').selectAll('*').remove();
        Graph3_Detail();
      }
    }
  });
};

export const Graph1_OverallView = (
  `<div class='chart-container d-flex' id='bar-container-graph1'>
        <svg id='Graph1'>
        </svg>
    </div>`
);
export const Graph2_DetailView = (
  `<div class='chart-container d-flex' id='bar-container-graph2'>
        <svg id='Graph2'>
        </svg>
        <p> Here we place the chart 2 </p>
    </div>`
);
export const Graph3_DetailView = (
  `<div class='chart-container d-flex' id='bar-container-graph3'>
        <svg id='Graph3'>
        </svg>
        <p> Here we place the chart 3 </p>
    </div>`
);

export const VisualizeLayout_grid = (`
  <br>
  <div>
    <div class="grid-container">
      <div class="left-side">${ Graph1_OverallView }</div>
      <div class="right-top">${ Graph2_DetailView }</div>
      <div class="right-bottom">${ Graph3_DetailView }</div>
    </div>
  </div>
  <br>
`);


const chartObserver = new ResizeObserver(debounce(onResize, 100));
console.log("Start data import");
let column_from_csv = await d3.csv('../data/car_prices.csv', (d) =>
{
  return {
    year: +d.year,
    make: d.make,
    model: d.model,
    body: d.body,
    odometer: +d.odometer,
    price: +d.sellingprice
  };
});
// Sort the data by year
column_from_csv.sort((a, b) => a.year - b.year);
console.log("data import finished, we have " + column_from_csv.length + " rows");
export function mountChart1()
{ // registering this element to watch its size change
  console.log("Start mountChart1");
  let Graph1Container = document.querySelector('#bar-container-graph1');
  chartObserver.observe(Graph1Container);
}

export function mountChart2()
{ // registering this element to watch its size change
  console.log("Start mountChart2");
  let Graph2Container = document.querySelector('#bar-container-graph2');
  chartObserver.observe(Graph2Container);
}

export function mountChart3()
{ // registering this element to watch its size change
  console.log("Start mountChart3");
  let Graph3Container = document.querySelector('#bar-container-graph3');
  chartObserver.observe(Graph3Container);
}

// Graph 1 - Parallel Coordinates. Used columns: year, make, model, Body, odometer, price.
function Graph1_Overall()
{
  // set the columns and margins of the graph
  console.log("Start Graph1_Overall");
  let chartContainer = d3.select("#Graph1").attr("viewBox", [0, 0, size.width, size.height])
    .attr("preserveAspectRatio", "xMidYMid meet"); // This will scale the SVG to always fit the parent element
  // Set the columns, those are we care when choosing a used car.
  const columns = ["year", "make", "model", "body", "odometer", "price"];

  //set the color for the line
  const color = d3.scaleOrdinal()
    .domain(column_from_csv.map(d => d.make))
    .range(d3.quantize(t => d3.hsl(
      t * 360,
      0.55,
      0.5 + t * 0.25
    ).formatHex(), column_from_csv.length));

  // Create Y scale
  const y = {};
  columns.forEach(dim =>
  {
    if (["year", "odometer", "price"].includes(dim))
    {
      // If they're numbers, use linear scale
      y[dim] = d3.scaleLinear()
        .domain(d3.extent(column_from_csv, d => +d[dim])) // Make sure to convert the string to number
        .range([size.height, 0]);
    }
    else
    {
      // If they're not numbers, use point scale
      y[dim] = d3.scalePoint()
        .domain([...new Set(column_from_csv.map(d => d[dim]))]) // Remove duplicates
        .range([size.height, 0]);
    }
  });

  // Create X scale.
  const x = d3.scalePoint()
    .domain(columns)
    .range([0, size.width])
    .padding(0.1);

  // Draw the vertical lines for each dimension (i.e. the vertical lines for "year", "make", "model", "body", "odometer", "price")
  const axis = chartContainer.selectAll(".axis")
    .data(columns)
    .enter().append("g")
    .attr("class", "axis")
    .attr("transform", d => `translate(${ x(d) },0)`)
    .each(function (d) { d3.select(this).call(d3.axisLeft(y[d])); });

  // Add the label for each vertical line (The "year", "make", "model", "body", "odometer", "price" labels)
  axis.append("text")
    .style("text-anchor", "middle")
    .attr("y", -9)
    .text(d => d)
    .style("fill", "black");

  // Draw the lines connecting the each dimension based on the value
  const line = d3.line()
    .defined(d => !isNaN(d[1]))
    .x((d, i) => x(columns[i]))
    .y(d => y[d[0]](d[1])); // d[0] is the dimension, d[1] is the value

  // Append the line into the graph
  chartContainer.selectAll(".line")
    .data(column_from_csv)
    .enter().append("path")
    .attr("class", "line")
    .attr("d", d => line(columns.map(dim => [dim, d[dim]]))) // d[dim] is the value
    .attr("stroke", d => color(d.make))
    .style("opacity", 0.5);

  console.log("Printed the line");
}

function Graph2_Detail()
{
  // select the svg tag so that we can insert(render) elements, i.e., draw the chart, within it.
  // let chartContainer = d3.select('#Graph2');
  // We need a way to map our data to where it should be rendered within the svg (in screen pixels), based on the data
  // value, so the extents and the unique values above help us define the limits.
  // Scales are just like mapping functions y = f(x), where x refers to domain, y refers to range.
  //      In our case, x should be the data, y should be the screen pixels.
  // We have the margin here just to leave some space
  // In viewport (our screen), the leftmost side always refer to 0 in the horizontal coordinates in pixels (x).
  // let xScale = d3.scaleBand()
  //   .rangeRound([margin.left, size.width - margin.right])
  //   .domain(xCategories)
  //   .padding(0.1); // spacing between the categories

  // // In viewport (our screen), the topmost side always refer to 0 in the vertical coordinates in pixels (y).
  // let yScale = d3.scaleLinear()
  //   .range([size.height - margin.bottom, margin.top]) //bottom side to the top side on the screen
  //   .domain([0, yCategories[1]]); // This is based on your data, but if there is a natural value range for your data attribute, you should follow
  // // e.g., it is natural to define [0, 100] for the exame score, or [0, <maxVal>] for counts.

  // // There are other scales such as scaleOrdinal,
  // // whichever is appropriate depends on the data types and the kind of visualizations you're creating.

  // // This following part visualizes the axes along with axis labels.
  // // Check out https://observablehq.com/@d3/margin-convention?collection=@d3/d3-axis for more details
  // const xAxis = chartContainer.append('g')
  //   .attr('transform', `translate(0, ${ size.height - margin.bottom })`)
  //   .call(d3.axisBottom(xScale));

  // const yAxis = chartContainer.append('g')
  //   .attr('transform', `translate(${ margin.left }, 0)`)
  //   .call(d3.axisLeft(yScale));

  // const yLabel = chartContainer.append('g')
  //   .attr('transform', `translate(${ 10 }, ${ size.height / 2 }) rotate(-90)`)
  //   .append('text')
  //   .text('Value')
  //   .style('font-size', '.8rem');

  // const xLabel = chartContainer.append('g')
  //   .attr('transform', `translate(${ size.width / 2 - margin.left }, ${ size.height - margin.top - 5 })`)
  //   .append('text')
  //   .text('Categories')
  //   .style('font-size', '.8rem');

  // // "g" is grouping element that does nothing but helps avoid DOM looking like a mess
  // // We iterate through each <CategoricalBar> element in the array, create a rectangle for each and indicate the coordinates, the rectangle, and the color.
  // const barEles = chartContainer.append('g')
  //   .selectAll('rect')
  //   .data(column_from_csv) // TypeScript expression. This always expects an array of objects.
  //   .join('rect')
  //   // specify the left-top coordinate of the rectangle
  //   .attr('x', (d) => xScale(d.category))
  //   .attr('y', (d) => yScale(d.value))
  //   // specify the size of the rectangle
  //   .attr('width', xScale.bandwidth())
  //   .attr('height', (d) => Math.abs(yScale(0) - yScale(d.value))) // this substraction is reversed so the result is non-negative
  //   .attr('fill', 'teal');

  // // For transform, check out https://www.tutorialspoint.com/d3js/d3js_svg_transformation.htm, but essentially we are adjusting the positions of the selected elements.
  // const title = chartContainer.append('g')
  //   .append('text') // adding the text
  //   .attr('transform', `translate(${ size.width / 2 }, ${ size.height - margin.top + 5 })`)
  //   .attr('dy', '0.5rem') // relative distance from the indicated coordinates.
  //   .style('text-anchor', 'middle')
  //   .style('font-weight', 'bold')
  //   .text('Distribution of Demo Data'); // text content

}

function Graph3_Detail()
{
  // select the svg tag so that we can insert(render) elements, i.e., draw the chart, within it.
  // let chartContainer = d3.select('#Graph3');
  // let data = dataFromCSV;
  // console.log(data);
  // // We need a way to map our data to where it should be rendered within the svg (in screen pixels), based on the data
  // // value, so the extents and the unique values above help us define the limits.
  // // Scales are just like mapping functions y = f(x), where x refers to domain, y refers to range.
  // //      In our case, x should be the data, y should be the screen pixels.
  // // We have the margin here just to leave some space
  // // In viewport (our screen), the leftmost side always refer to 0 in the horizontal coordinates in pixels (x).
  // let xScale = d3.scaleBand()
  //   .rangeRound([margin.left, size.width - margin.right])
  //   .domain(xCategories)
  //   .padding(0.1); // spacing between the categories

  // // In viewport (our screen), the topmost side always refer to 0 in the vertical coordinates in pixels (y).
  // let yScale = d3.scaleLinear()
  //   .range([size.height - margin.bottom, margin.top]) //bottom side to the top side on the screen
  //   .domain([0, yCategories[1]]); // This is based on your data, but if there is a natural value range for your data attribute, you should follow
  // // e.g., it is natural to define [0, 100] for the exame score, or [0, <maxVal>] for counts.

  // // There are other scales such as scaleOrdinal,
  // // whichever is appropriate depends on the data types and the kind of visualizations you're creating.

  // // This following part visualizes the axes along with axis labels.
  // // Check out https://observablehq.com/@d3/margin-convention?collection=@d3/d3-axis for more details
  // const xAxis = chartContainer.append('g')
  //   .attr('transform', `translate(0, ${ size.height - margin.bottom })`)
  //   .call(d3.axisBottom(xScale));

  // const yAxis = chartContainer.append('g')
  //   .attr('transform', `translate(${ margin.left }, 0)`)
  //   .call(d3.axisLeft(yScale));

  // const yLabel = chartContainer.append('g')
  //   .attr('transform', `translate(${ 10 }, ${ size.height / 2 }) rotate(-90)`)
  //   .append('text')
  //   .text('Value')
  //   .style('font-size', '.8rem');

  // const xLabel = chartContainer.append('g')
  //   .attr('transform', `translate(${ size.width / 2 - margin.left }, ${ size.height - margin.top - 5 })`)
  //   .append('text')
  //   .text('Categories')
  //   .style('font-size', '.8rem');

  // // "g" is grouping element that does nothing but helps avoid DOM looking like a mess
  // // We iterate through each <CategoricalBar> element in the array, create a rectangle for each and indicate the coordinates, the rectangle, and the color.
  // const barEles = chartContainer.append('g')
  //   .selectAll('rect')
  //   .data(column_from_csv) // TypeScript expression. This always expects an array of objects.
  //   .join('rect')
  //   // specify the left-top coordinate of the rectangle
  //   .attr('x', (d) => xScale(d.category))
  //   .attr('y', (d) => yScale(d.value))
  //   // specify the size of the rectangle
  //   .attr('width', xScale.bandwidth())
  //   .attr('height', (d) => Math.abs(yScale(0) - yScale(d.value))) // this substraction is reversed so the result is non-negative
  //   .attr('fill', 'teal');

  // // For transform, check out https://www.tutorialspoint.com/d3js/d3js_svg_transformation.htm, but essentially we are adjusting the positions of the selected elements.
  // const title = chartContainer.append('g')
  //   .append('text') // adding the text
  //   .attr('transform', `translate(${ size.width / 2 }, ${ size.height - margin.top + 5 })`)
  //   .attr('dy', '0.5rem') // relative distance from the indicated coordinates.
  //   .style('text-anchor', 'middle')
  //   .style('font-weight', 'bold')
  //   .text('Distribution of Demo Data'); // text content

}
