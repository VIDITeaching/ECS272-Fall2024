import * as d3 from 'd3';
import { isEmpty, debounce } from 'lodash';

let size = { width: 600, height: 600 };
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
    year: +d.year || null, // Ensure year is a valid number or null
    make: d.make || null,
    model: d.model || null,
    body: d.body || null,
    odometer: +d.odometer || null, // Ensure odometer is a valid number or null
    price: +d.sellingprice || null // Ensure price is a valid number or null
  };
}).then(data =>
{
  // Filter out any rows with missing critical values
  return data.filter(d => d.year && d.make && d.model && d.body && d.odometer && d.price);
});
// Sort the data by year
column_from_csv.sort((a, b) => a.year - b.year);
export function mountChart1()
{ // registering this element to watch its size change
  console.log("Start mountChart1");
  let Graph1Container = document.querySelector('#bar-container-graph1');
  chartObserver.observe(Graph1Container);
}

function Graph1_Overall()
{
  console.log("Start Graph1_Overall");
  let chartContainer = d3.select("#Graph1").attr("viewBox", [0, 0, size.width, size.height])
    .attr("preserveAspectRatio", "xMidYMid meet");
  const columns = ["year", "make", "model", "body", "odometer", "price"];

  const color = d3.scaleOrdinal()
    .domain(column_from_csv.map(d => d.make))
    .range(d3.quantize(t => d3.hsl(
      t * 360,
      0.55,
      0.5 + t * 0.25
    ).formatHex(), column_from_csv.length));

  // Function to create range bins
  const createRanges = (data, field, binCount) =>
  {
    const validData = data.filter(d => !isNaN(+d[field]));
    const extent = d3.extent(validData, d => +d[field]);
    const step = (extent[1] - extent[0]) / binCount;
    return d3.range(binCount).map(i =>
    {
      const min = extent[0] + i * step;
      const max = min + step;
      return `${ Math.round(min / 1000) }k-${ Math.round(max / 1000) }k`;
    });
  };

  // Create Y scale
  const y = {};
  columns.forEach(dim =>
  {
    if (dim === "odometer" || dim === "price")
    {
      const ranges = createRanges(column_from_csv, dim, 10);
      y[dim] = d3.scalePoint()
        .domain(ranges)
        .range([size.height, 0]);
    } else if (dim === "year")
    {
      const validYears = column_from_csv.map(d => +d[dim]).filter(year => !isNaN(year));
      y[dim] = d3.scaleLinear()
        .domain(d3.extent(validYears))
        .range([size.height, 0]);
    } else
    {
      y[dim] = d3.scalePoint()
        .domain([...new Set(column_from_csv.map(d => d[dim]).filter(Boolean))])
        .range([size.height, 0]);
    }
  });

  // Create X scale
  const x = d3.scalePoint()
    .domain(columns)
    .range([0, size.width])
    .padding(1);

  // Draw the vertical lines for each dimension
  const axis = chartContainer.selectAll(".axis")
    .data(columns)
    .enter().append("g")
    .attr("class", "axis")
    .attr("transform", d => `translate(${ x(d) },0)`)
    .each(function (d) { d3.select(this).call(d3.axisLeft(y[d])); });

  // Add the label for each vertical line
  axis.append("text")
    .style("text-anchor", "middle")
    .attr("y", -9)
    .text(d => d)
    .style("fill", "black");

  // Function to get the appropriate y value (exact or range)
  const getYValue = (dim, value) =>
  {
    if (isNaN(value) || value === null) return null; // Check for invalid or null values
    if (dim === "odometer" || dim === "price")
    {
      const ranges = y[dim].domain();
      const range = ranges.find(range =>
      {
        const [min, max] = range.split('-').map(v => parseFloat(v) * 1000);
        return value >= min && value < max;
      });
      return range ? y[dim](range) : null; // Ensure `range` is valid
    }
    return y[dim](value);
  };

  // Draw the lines connecting each dimension based on the value
  const line = d3.line()
    .defined(d => d[1] !== null)
    .x((d, i) => x(columns[i]))
    .y(d => d[1]);

  // Append the line into the graph
  chartContainer.selectAll(".line")
    .data(column_from_csv)
    .enter().append("path")
    .attr("class", "line")
    .attr("d", d =>
    {
      const points = columns.map(dim => [dim, getYValue(dim, d[dim])]);
      return line(points);
    })
    .attr("stroke", d => color(d.make))
    .style("opacity", 0.5);

  console.log("Printed the line");
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
    .attr("width", size.width)
    .attr("height", size.height)
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
