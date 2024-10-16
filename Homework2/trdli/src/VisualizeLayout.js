import * as d3 from 'd3';
import { isEmpty, debounce } from 'lodash';

let size = { width: '100%', height: '100%' };
const onResize = (targets) =>
{
  targets.forEach(target =>
  {
    const targetId = target.target.getAttribute('id');
    if (targetId !== 'bar-container-graph1' && targetId !== 'bar-container-graph2' && targetId !== 'bar-container-graph3') return;
    size = { width: target.contentRect.width, height: target.contentRect.height };
    if (!isEmpty(size) && !isEmpty(column_from_csv))
    {
      if (targetId === 'bar-container-graph1')
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

export const Graph1_OverallView = () => (
  `<div class='chart-container d-flex' id='bar-container-graph1'>
        <svg id='Graph1'></svg>
    </div>`
);
export const Graph2_DetailView = () => (
  `<div class='chart-container d-flex' id='bar-container-graph2'>
        <svg id='Graph2'></svg>
    </div>`
);
export const Graph3_DetailView = () => (
  `<div class='chart-container d-flex' id='bar-container-graph3'>
        <svg id='Graph3'></svg>
    </div>`
);

const chartObserver = new ResizeObserver(debounce(onResize, 100));
let column_from_csv = await d3.csv('../data/car_prices.csv', (d) =>
{
  return {
    year: isNaN(+d.year) ? null : +d.year,
    make: d.make || "Unspecified",
    model: d.model || "Unspecified",
    body: d.body || "Unspecified",
    odometer: isNaN(+d.odometer) ? null : +d.odometer,
    price: isNaN(+d.sellingprice) ? null : +d.sellingprice
  };
}).then(data =>
{
  // Filter out rows where any critical values are missing or invalid (null)
  return data.filter(d =>
  {
    return d.year !== null && d.make !== "Unspecified" && d.model !== "Unspecified" &&
      d.body !== "Unspecified" && d.odometer !== null && d.price !== null;
  });
});


// Sort the data by year
column_from_csv.sort((a, b) => a.year - b.year);
export function mountChart1()
{ // registering this element to watch its size change
  console.log("Start mountChart1");
  let Graph1Container = document.querySelector('#bar-container-graph1');
  chartObserver.observe(Graph1Container);
}

/* For graph 1, we would like to draw a parallel coordinates chart. The vertical lines would be the year,
model, make, body, odometer, and price of the cars. By connecting those lines, we can see the relationship
between the car attributes and the price. Keep in mind here, the prince and odometer are binned into ranges
for better performance. To do that, we need to cleanup our data first.*/


/**
 * @brief Cleans and processes data for graph1 visualization.
 *
 * This function processes a CSV column data and maps it to a new format
 * with cleaned and categorized values for odometer and price.
 *
 * @returns {Array<Object>} An array of objects with cleaned data.
 * Each object contains the following properties:
 * - year: {number} The year of the vehicle.
 * - make: {string} The make of the vehicle.
 * - model: {string} The model of the vehicle.
 * - body: {string} The body type of the vehicle.
 * - odometer: {number} The categorized odometer reading.
 * - price: {number} The categorized price.
 */
function graph1_data_cleaning()
{
  const ranges = (value, steps) =>
  {
    for (let i = 0; i < steps.length; i++)
    {
      if (value < steps[i]) return (i === 0 ? 0 : (steps[i - 1] + steps[i]) / 2);  // Use midpoint of the range
    }
    return steps[steps.length - 1] + 5000;  // Handle values greater than the last step
  };

  return column_from_csv.map(d => ({
    year: d.year,
    make: d.make,
    model: d.model,
    body: d.body,
    odometer: ranges(d.odometer || 0, [5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000]),  // Use numeric ranges
    price: ranges(d.price || 0, [5000, 10000, 15000, 20000, 25000, 30000, 35000])  // Use numeric ranges
  }));
}


let afterCleanData_Graph1 = graph1_data_cleaning();
function Graph1_Overall()
{
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  // Select the svg tag so that we can insert(render) elements, i.e., draw the chart, within it.
  const chartContainer_graph1 = d3.select("#Graph1").append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", `translate(${ margin.left },${ margin.top })`);
  // Defined the categories for the parallel coordinates
  const dimensions = ['year', 'make', 'model', 'body', 'odometer', 'price'];

  // Defined the color that the line will be colored based on the make
  const color = d3.scaleOrdinal()
    .domain(afterCleanData_Graph1.map(d => d.make))
    .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), afterCleanData_Graph1.length).reverse());

  const yScales = {};
  // Now we need to define the scales for each dimension. Linear scale for numeric data like 'year', 'odometer', 'price'
  ['year', 'odometer', 'price'].forEach(dim =>
  {
    const extent = d3.extent(afterCleanData_Graph1, d => d[dim]);
    yScales[dim] = d3.scaleLinear()
      .domain(extent)  // Ensure the domain is based on valid data
      .range([size.height, 0]);
  });
  // 'make', 'model', 'body' are categorical, so we use ordinal scales
  ['make', 'model', 'body'].forEach(dim =>
  {
    yScales[dim] = d3.scalePoint()
      .domain(afterCleanData_Graph1.map(d => d[dim]).filter(Boolean))  // Filter out any invalid or empty strings
      .range([size.height, 0])
      .padding(1);
  });


  // Create the X axis, that's the distance between the vertical lines, the data will connect between the lines
  const xScale = d3.scalePoint()
    .range([0, size.width])
    .domain(dimensions);

  // Draw the lines for that vetical axis (Parallel Lines, each dimensions a line)
  chartContainer_graph1.selectAll("allAxies")
    .data(dimensions).enter()
    .append("g")
    .attr("transform", d => `translate(${ xScale(d) },0)`)
    .each(function (d)
    {
      d3.select(this).call(d3.axisLeft().scale(yScales[d]));
    });

  // Connect the vertical lines with the data. (i.e. connect from year, to make, to model, to body, to
  // odometer, to price)
  function path(d)
  {
    // Check if any dimension returns NaN for this data point
    const valid = dimensions.every(p =>
    {
      const scaledValue = yScales[p](d[p]);
      if (isNaN(scaledValue))
      {
        console.error(`Invalid value for ${ p }:`, d[p]);
      }
      return !isNaN(scaledValue);
    });

    // Only return path if all dimensions are valid
    return valid ? d3.line()(dimensions.map(p => [xScale(p), yScales[p](d[p])])) : null;
  }


  // Show the lines.
  chartContainer_graph1.selectAll("path_connect_lines")
    .data(afterCleanData_Graph1)
    .enter().append("path")
    .attr("d", path)
    .style("fill", "none")
    .style("stroke", d => color(d.make))
    .style("opacity", 0.5);

  // Make lables for each vertical line
  chartContainer_graph1.selectAll("dimension_labels")
    .data(dimensions).enter()
    .append("text")
    .text(d => d)
    .attr("text-anchor", "middle")
    .attr("x", d => xScale(d))
    .attr("y", size.height + 15);


}


export function mountChart2()
{ // registering this element to watch its size change
  console.log("Start mountChart2");
  let Graph2Container = document.querySelector('#bar-container-graph2');
  chartObserver.observe(Graph2Container);
}

function Graph2_Detail()
{
  const chartContainer_graph2 = d3.select("#Graph2")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", `translate(${ size.width / 2 }, ${ size.height / 2 })`);

  // Group data by car maker and count the number of cars for each maker
  const carMakerCount = d3.rollup(column_from_csv, v => v.length, d => d.make);

  // Convert the Map to an array for pie chart
  const data = Array.from(carMakerCount, ([make, count]) => ({ make, count }));

  // Set up SVG dimensions
  const radius = Math.min(size.width, size.height) / 2;
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  // Create the pie layout
  const pie = d3.pie()
    .value(d => d.count)
    .sort(null);

  // Create the arc generator
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  // Bind data and create pie chart slices
  const arcs = chartContainer_graph2.selectAll(".arc")
    .data(pie(data))
    .enter()
    .append("g")
    .attr("class", "arc");

  arcs.append("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data.make));

  // Add labels
  arcs.append("text")
    .attr("transform", d => `translate(${ arc.centroid(d) })`)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .text(d => d.data.make);
}

export function mountChart3()
{ // registering this element to watch its size change
  console.log("Start mountChart3");
  let Graph3Container = document.querySelector('#bar-container-graph3');
  chartObserver.observe(Graph3Container);
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
