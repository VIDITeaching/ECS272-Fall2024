import * as d3 from 'd3';
import { isEmpty, debounce } from 'lodash';

// Define the global margin and the size of the graph
const margin = { top: 10, right: 15, bottom: 10, left: 15 };
let size = { width: 100, height: 100 };

/**
 * @brief Handles the resizing of graph containers and redraws the graphs accordingly.
 *
 * @function onResize
 * @param {Array} targets - An array of ResizeObserverEntry objects representing the elements being resized.
 *
 * This function iterates over the provided targets and checks if the target is one of the graph containers.
 * If the target is a graph container, it updates the size and redraws the corresponding graph.
 *
 * The function specifically handles three graph containers with IDs:
 * - 'parallel-coordinates-container-graph1'
 * - 'pie-container-graph2'
 * - 'bar-container-graph3'
 *
 * For each of these containers, it removes the existing graph elements and calls the appropriate function to redraw the graph:
 * - Graph1_Overall() for 'parallel-coordinates-container-graph1'
 * - Graph2_Detail() for 'pie-container-graph2'
 * - Graph3_Detail() for 'bar-container-graph3'
 *
 * The function also logs a message to the console indicating which graph has been redrawn.
 */
const onResize = (targets) =>
{
  targets.forEach(target =>
  {
    // Check if the target is the graph container
    const targetId = target.target.getAttribute('id');
    if (targetId !== 'parallel-coordinates-container-graph1' && targetId !== 'pie-container-graph2' && targetId !== 'bar-container-graph3') return;
    size = { width: target.contentRect.width, height: target.contentRect.height };
    if (!isEmpty(size) && !isEmpty(column_from_csv))
    {
      // Remove the existing graph and redraw it
      if (targetId === 'parallel-coordinates-container-graph1')
      {
        d3.select('#Graph1').selectAll('*').remove();
        Graph1_Overall();
      } else if (targetId === 'pie-container-graph2')
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

/**
 * @description Generates the overall view for Graph1.
 * @name Graph1_OverallView
 * @returns {string} HTML string containing a div with an SVG element for Graph1.
 */
export const Graph1_OverallView = () => (
  `<div id='parallel-coordinates-container-graph1'>
        <svg id='Graph1'></svg>
    </div>`
);

/**
 * @description Generates the HTML structure for the detailed view of Graph2.
 * @name Graph2_DetailView
 * @returns {string} The HTML string for the detailed view of Graph2.
 */
export const Graph2_DetailView = () => (
  `<div id='pie-container-graph2'>
        <svg id='Graph2'></svg>
    </div>`
);

/**
 * @description Generates the HTML structure for the detailed view of Graph 3.
 * @name Graph3_DetailView
 * @returns {string} The HTML string containing a div with an SVG element.
 */
export const Graph3_DetailView = () => (
  `<div id='bar-container-graph3'>
        <svg id='Graph3'></svg>
    </div>`
);

// Load the data from the CSV file
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
console.log("Data loaded from CSV file");
// Sort the data by year
column_from_csv.sort((a, b) => a.year - b.year);
console.log("Data sorted by year");

/* For graph 1, we would like to draw a parallel coordinates chart. The vertical lines would be the year,
model, make, body, odometer, and price of the cars. By connecting those lines, we can see the relationship
between the car attributes and the price. Keep in mind here, the prince and odometer are binned into ranges
for better performance. To do that, we need to cleanup our data first.*/

/**
 * @brief Mounts the chart for Graph1.
 * @function mountChart1
 * @returns {void}
 */
export function mountChart1()
{ // registering this element to watch its size change
  console.log("Start mountChart1");
  let Graph1Container = document.querySelector('#parallel-coordinates-container-graph1');
  chartObserver.observe(Graph1Container);
}

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
    for (let currentStepIndex = 0; currentStepIndex < steps.length; currentStepIndex++)
    {
      if (value < steps[currentStepIndex])
      {
        if (currentStepIndex === 0)
        {
          return 0;
        }
        else
        {
          const previousStep = steps[currentStepIndex - 1];
          const currentStep = steps[currentStepIndex];
          return (previousStep + currentStep) / 2;  // Use midpoint of the range
        }
      }
    }
    return steps[steps.length - 1] + 5000;  // Handle values greater than the last step
  };

  // Use a Set to track unique combinations of year, make, model, and body
  const uniqueEntries = new Set();

  return column_from_csv.map(d =>
  {
    const year = d.year;
    const make = d.make.toLowerCase();
    const model = d.model.toLowerCase();
    const body = d.body.toLowerCase();
    const uniqueKey = `${ year }-${ make }-${ model }-${ body }`;
    if (!uniqueEntries.has(uniqueKey))
    {
      uniqueEntries.add(uniqueKey);
      return {
        year: year,
        make: make,
        model: model,
        body: body,
        odometer: ranges(d.odometer || 0, [5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000]),  // Use numeric ranges
        price: ranges(d.price || 0, [5000, 10000, 15000, 20000, 25000, 30000, 35000])  // Use numeric ranges
      };
    }
    return null;
  }).filter(d => d !== null);  // Filter out null entries
}

// Consider getting rid of the model, and using the averge 


let afterCleanData_Graph1 = graph1_data_cleaning();
console.log("We have ", afterCleanData_Graph1.length, " rows of data after cleaning.");
console.log("Data cleaned and loaded for Graph 1, start drawing the chart.");

/**
 * @brief Draws the overall view for Graph1 (Parallel Coordinates Chart).
 * @function Graph1_Overall
 * @returns {void}
 */
function Graph1_Overall()
{
  // Select the svg tag so that we can insert(render) elements, i.e., draw the chart, within it.
  const chartContainer_graph1 = d3.select("#Graph1")
    .attr("width", "100%")
    .attr("height", "100%")
    .append("g")
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("transform", `translate(${ margin.left },${ margin.top })`);
  // Defined the categories for the parallel coordinates
  const dimensions = ['year', 'make', 'model', 'body', 'odometer', 'price'];

  // Defined the color that the line will be colored based on the make
  const color = d3.scaleOrdinal()
    .domain(dimensions)
    .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), dimensions.length).reverse());

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
      .padding(0.1);
  });
  console.log("Y Scales defined for graph 1");

  // Create the X axis, that's the distance between the vertical lines, the data will connect between the lines
  const xScale = d3.scalePoint()
    .range([0, size.width])
    .domain(dimensions);
  console.log("X Scale defined for graph 1");

  // Draw the lines for that vetical axis (Parallel Lines, each dimensions a line)
  chartContainer_graph1.selectAll("allAxies")
    .data(dimensions).enter()
    .append("g")
    .attr("transform", d => `translate(${ xScale(d) },0)`)
    .each(function (d)
    {
      d3.select(this).call(d3.axisLeft().scale(yScales[d]));
    });
  console.log("Vertical lines drawn for graph 1");
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
  console.log("Path defined for graph 1");

  // Show the lines.
  chartContainer_graph1.selectAll("path_connect_lines")
    .data(afterCleanData_Graph1)
    .enter().append("path")
    .attr("d", path)
    .style("fill", "none")
    .style("stroke", d => color(d.make))
    .style("opacity", 0.5);
  console.log("Lines drawn for graph 1");

  // Make lables for each vertical line
  chartContainer_graph1.selectAll("dimension_labels")
    .data(dimensions).enter()
    .append("text")
    .text(d => d)
    .attr("text-anchor", "middle")
    .attr("x", d => xScale(d))
    .attr("y", size.height + 15);
  console.log("Labels drawn for graph 1");
}


export function mountChart2()
{ // registering this element to watch its size change
  console.log("Start mountChart2");
  let Graph2Container = document.querySelector('#pie-container-graph2');
  chartObserver.observe(Graph2Container);
}

function Graph2_Detail()
{

  const chartContainer_graph2 = d3.select("#Graph2")
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



/** For the third chart, we would like to see the distribution of buyer's choice based on years.
 * To be more specific, we would like to see how many cars were sold in each year. We will use a bar
 * chart to demostrate this */
export function mountChart3()
{ // registering this element to watch its size change
  console.log("Start mountChart3");
  let Graph3Container = document.querySelector('#bar-container-graph3');
  chartObserver.observe(Graph3Container);
}

function Graph3_Detail()
{
  let chartContainer_graph3 = d3.select('#Graph3');
  // Group data by year and count the number of cars for each year
  const carYearCount = d3.rollup(column_from_csv, v => v.length, d => d.year);

  // Convert the Map to an array for bar chart
  const data = Array.from(carYearCount, ([year, count]) => ({ year, count }));

  // Set up SVG dimensions
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };
  const width = size.width - margin.left - margin.right;
  const height = size.height - margin.top - margin.bottom;

  // Define color for the bars
  function getColor(index)
  {
    if (index < 10000)
    {
      return '#ff0000'; // red for 10000
    } else if (index < 50000)
    {
      return '#ffb700'; // orange for 50000
    }
    else if (index < 100000)
    {
      return '#d0ff00'; // Yellow for 100000
    }
    else
    {
      return '#0fd971'; // Green for 100000 and above
    }
  }
  // Create the SVG element
  const svg = chartContainer_graph3
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", `translate(${ margin.left }, ${ margin.top })`);

  // Create the X scale
  const xScale = d3.scaleBand()
    .domain(data.map(d => d.year))
    .range([0, width])
    .padding(0.1);

  // Create the Y scale
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count)])
    .nice()
    .range([height, 0]);

  // Create the X axis
  svg.append("g")
    .attr("transform", `translate(0, ${ height })`)
    .call(d3.axisBottom(xScale));

  // Create the Y axis
  svg.append("g")
    .call(d3.axisLeft(yScale));

  // Create the bars
  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => xScale(d.year))
    .attr("y", d => yScale(d.count))
    .attr("width", xScale.bandwidth())
    .attr("height", d => height - yScale(d.count))
    .attr("fill", d => getColor(d.count));

  // Add number of cars labels on top of the bars
  svg.selectAll("text")
    .data(data)
    .enter()
    .append("text")
    .attr("x", d => xScale(d.year) + xScale.bandwidth() / 2)
    .attr("y", d => yScale(d.count) - 5) // Position the label above the bar
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "black")
    .text(d => d.count);

}
