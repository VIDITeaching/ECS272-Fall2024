import * as d3 from 'd3';
import { isEmpty, debounce } from 'lodash';

let size = { width: 0, height: 0 };
/**
 * @brief Handles the resizing of graph containers and redraws the graphs accordingly.
 *
 * @function onResize
 * @param {Array} targets - An array of ResizeObserverEntry objects representing the
 * elements being resized.
 *
 * This function iterates over the provided targets and checks if the target is one of the
 * graph containers.
 * If the target is a graph container, it updates the size and redraws the corresponding
 * graph.
 *
 * The function specifically handles three graph containers with IDs:
 * - 'parallel-coordinates-container-graph1'
 * - 'pie-container-graph2'
 * - 'bar-container-graph3'
 *
 * For each of these containers, it removes the existing graph elements and calls the
 * appropriate function to redraw the graph:
 * - Graph1_Overall() for 'parallel-coordinates-container-graph1'
 * - Graph2_Detail() for 'pie-container-graph2'
 * - Graph3_Detail() for 'bar-container-graph3'
 *
 * The function also logs a message to the console indicating which graph has been
 * redrawn.
 */
const onResize = (targets) =>
{
  targets.forEach(target =>
  {
    const targetId = target.target.getAttribute('id');
    if (!['parallel-coordinates-container-graph1', 'pie-container-graph2',
      'bar-container-graph3'].includes(targetId)) return;

    size = { width: target.contentRect.width, height: target.contentRect.height };
    if (isEmpty(size) || isEmpty(column_from_csv)) return;

    const graphMap = {
      'parallel-coordinates-container-graph1': {
        selector: '#Graph1',
        redraw: Graph1_Overall
      },
      'pie-container-graph2': { selector: '#Graph2', redraw: Graph2_Detail },
      'bar-container-graph3': { selector: '#Graph3', redraw: Graph3_Detail }
    };

    d3.select(graphMap[targetId].selector).selectAll('*').remove();
    graphMap[targetId].redraw();
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
        <svg id='Graph2'>Graph 2 - Percentage of each car brand sell situation</svg>
    </div>
    `
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
    body: d.body || "Unspecified",
    odometer: isNaN(+d.odometer) ? null : +d.odometer,
    price: isNaN(+d.sellingprice) ? null : +d.sellingprice
  };
}).then(data =>
{
  // Filter out rows where any critical values are missing or invalid (null) or price is 0
  return data.filter(d =>
  {
    return d.year !== null && d.make !== "Unspecified" && d.body !== "Unspecified"
      && d.odometer !== null && d.price !== null && d.price !== 0;
  });
});
// Sort the data by year
column_from_csv.sort((a, b) => a.year - b.year);

/* For graph 1, we would like to draw a parallel coordinates chart. The vertical lines
would be the year, model, make, body, odometer, and price of the cars. By connecting those
lines, we can see the relationship between the car attributes and the price. Keep in mind
here, the prince and odometer are binned into ranges for better performance. To do that, we
need to cleanup our data first.*/

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
  const yearRanges = [
    { start: 1980, end: 1985, label: '1980-1985' },
    { start: 1986, end: 1990, label: '1986-1990' },
    { start: 1991, end: 1995, label: '1991-1995' },
    { start: 1996, end: 2000, label: '1996-2000' },
    { start: 2001, end: 2005, label: '2001-2005' },
    { start: 2006, end: 2010, label: '2006-2010' },
    { start: 2011, end: 2015, label: '2011-2015' }
  ];

  const categorizeYear = (year) =>
  {
    for (const range of yearRanges)
    {
      if (year >= range.start && year <= range.end)
      {
        return range.label;
      }
    }
    return 'Unknown';
  };

  const categorizeBody = (body) =>
  {
    const bodyLower = body.toLowerCase();
    const categories = ['coupe', 'sedan', 'suv', 'minivan', 'truck', 'van', 'wagon', 'hatchback', 'convertible', 'roadster', 'cab'];
    if (bodyLower.includes('koup'))
    {
      return 'coupe';
    }
    if (bodyLower.includes('navitgation'))
    {
      return 'suv'; // Exclude entries with 'navigation'
    }
    if (bodyLower.includes('supercrew'))
    {
      return 'truck';
    }
    return categories.find(category => bodyLower.includes(category)) || bodyLower;
  };

  // Use a Set to track unique combinations of year, make, model, and body
  const uniqueEntries = new Set();

  return column_from_csv.map(d =>
  {
    const year = categorizeYear(d.year);
    const make = d.make.toLowerCase();
    const body = categorizeBody(d.body);
    const uniqueKey = `${ year }-${ make }-${ body }`;
    const luxuryBrands = ['ferrari', 'rolls-royce', 'fisker', 'tesla', 'lamborghini',
      'bentley', 'porsche', 'bmw', 'mercedes-benz', 'jaguar', 'land rover', 'maserati',
      'alfa romeo', 'fiat', 'smart', 'hummer', 'lotus', 'aston martin'];
    if (!uniqueEntries.has(uniqueKey) && !luxuryBrands.includes(make))
    {
      uniqueEntries.add(uniqueKey);
      const odometer = ranges(d.odometer || 0, [5000, 10000, 15000, 20000, 25000, 30000,
        35000, 40000, 45000, 50000]);
      const price = ranges(d.price || 0, [5000, 10000, 15000, 20000, 25000, 30000,
        35000]);
      if (price === 0) return null;  // Filter out entries with price 0
      return {
        year: year,
        make: make,
        body: body,
        odometer: odometer,  // Use numeric ranges
        price: price  // Use numeric ranges
      };
    }
    return null;
  }).filter(d => d !== null);  // Filter out null entries
}

// Consider getting rid of the model, and using the averge


let afterCleanData_Graph1 = graph1_data_cleaning();
console.log("Data cleaned and loaded for Graph 1, start drawing the chart.");

/**
 * @brief Draws the overall view for Graph1 (Parallel Coordinates Chart).
 * @function Graph1_Overall
 * @returns {void}
 */
function Graph1_Overall()
{
  // Set up the margins for the chart
  const margin = { top: 20, right: 5, bottom: 35, left: 5 };
  const width = size.width - margin.left - margin.right;
  const height = size.height - margin.top - margin.bottom;

  // Select the svg tag so that we can insert(render) elements, i.e., draw the chart,
  // within it.
  const chartContainer_graph1 = d3.select("#Graph1")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("transform", `translate(${ margin.left },${ margin.top })`)
    .append("g")
    .attr("preserveAspectRatio", "xMidYMid meet");
  // Defined the categories for the parallel coordinates
  const dimensions = ['year', 'make', 'body', 'odometer', 'price'];

  // Defined the color that the line will be colored based on the make
  const colorScale = d3.scaleOrdinal()
    .domain(['1980-1985', '1986-1990', '1991-1995', '1996-2000', '2001-2005', '2006-2010',
      '2011-2015'])
    .range(['#ff0000', '#ff8c00', '#ffd700', '#32cd32', '#00008b', '#8a2be2', '#ffb700']);

  function getColor(year)
  {
    return colorScale(year) || '#000000'; // default to black for unknown or other years
  }
  const yScales = {};
  // Now we need to define the scales for each dimension. Linear scale for numeric data
  // like 'odometer', 'price'
  ['odometer', 'price'].forEach(dimensions =>
  {
    const numeric_value = d3.extent(afterCleanData_Graph1, d => d[dimensions]);
    yScales[dimensions] = d3.scaleLinear()
      .domain(numeric_value)  // Ensure the domain is based on valid data
      .range([height - margin.bottom, margin.top]);
  });
  // 'make', 'body' are categorical, so we use ordinal scales
  ['year', 'make', 'body'].forEach(dimensions =>
  {
    yScales[dimensions] = d3.scalePoint()
      .domain(afterCleanData_Graph1.map(d => d[dimensions]).filter(Boolean))
      .range([height - margin.bottom, margin.top])
      .padding(0.01);
  });

  // Create the X axis, that's the distance between the vertical lines, the data will
  // connect between the lines
  const xScale = d3.scalePoint()
    .range([margin.left, width - margin.right])
    .domain(dimensions)
    .padding(0.2);
  console.log("X Scale defined for graph 1");

  // Connect the vertical lines with the data. (i.e. connect from year, to make, to model,
  // to body, to odometer, to price)
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
    .style("stroke", d => getColor(d.year))
    .style("opacity", 0.5)
    .style("stroke-width", 1.5);
  // Draw the lines for that vertical axis (Parallel Lines, each dimension a line)
  chartContainer_graph1.selectAll("allAxies")
    .data(dimensions).enter()
    .append("g")
    .attr("transform", d => `translate(${ xScale(d) },0)`)
    .each(function (d)
    {
      d3.select(this).call(d3.axisLeft().scale(yScales[d]));
    })
    .attr("padding", 0.5)
    .style("font-size", 12)
    .style("font-weight", "bold");

  // Make lables for each vertical line (i.e. year, make, model, body, odometer, price)
  chartContainer_graph1.selectAll("dimension_labels")
    .data(dimensions).enter()
    .append("text")
    .text(d => d)
    .attr("text-anchor", "middle")
    .attr("x", d => xScale(d))
    .attr("y", height)
    .style("fill", "black")
    .style("font-size", 14)
    .style("text-decoration", "underline")
    .style("font-weight", "bold");
}


export function mountChart2()
{ // registering this element to watch its size change
  console.log("Start mountChart2");
  let Graph2Container = document.querySelector('#pie-container-graph2');
  chartObserver.observe(Graph2Container);
}

function Graph2_data_cleaning()
{
  return column_from_csv.map(d =>
  {
    const make = d.make.toLowerCase();
    const luxuryBrands = ['ferrari', 'rolls-royce', 'fisker', 'tesla', 'lamborghini',
      'bentley', 'porsche', 'bmw', 'mercedes-benz', 'jaguar', 'land rover', 'maserati',
      'alfa romeo', 'fiat', 'smart', 'hummer', 'lotus', 'aston martin'];
    if (!luxuryBrands.includes(make))
    {
      return {
        make: make,
      };
    }
    return null;
  }).filter(d => d !== null);  // Filter out null entries
}



/**
 * For this chart, we would like to see the distribution of car makers based on the number
 * of cars sold. We will use a pie chart to demonstrate this.
 */
function Graph2_Detail()
{
  // Set up the margin for the chart
  const margin = { top: 10, right: 10, bottom: 10, left: 10 };
  const width = size.width - margin.left - margin.right;
  const height = size.height - margin.top - margin.bottom;

  // Set up the SVG container
  const chartContainer_graph2 = d3.select("#Graph2")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", `translate(${ width / 2 }, ${ height / 2 })`);

  // Data preprocessing, group the data by car maker and count the number of cars sold
  const carMakerCount = d3.rollup(Graph2_data_cleaning(), v => v.length, d => d.make);
  // Convert the Map to an array for pie chart
  const data = Array.from(carMakerCount, ([make, count]) => ({ make, count }));

  // Merge the low percentage makers (percentage < 3) into 'Other'
  let total = d3.sum(data, d => d.count);
  let otherCount = 0;
  const filteredData = data.filter(d =>
  {
    if (d.count / total * 100 < 2.5)
    {
      otherCount += d.count;
      return false;
    }
    return true;
  });

  if (otherCount > 0)
  {
    filteredData.push({ make: 'Other', count: otherCount });
  }

  // Set up SVG dimensions
  const radius = Math.min(width, height) / 3;

  // Set up the color scale
  const color = d3.scaleOrdinal()
    .domain(filteredData.map(d => d.make))
    .range(d3.schemeCategory10);

  // Create the pie layout
  const pie = d3.pie()
    .value(d => d.count);

  // Create the arc generator
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  // Bind data and create pie chart slices
  const arcs = chartContainer_graph2.selectAll(".arc")
    .data(pie(filteredData))
    .enter()
    .append("g")
    .attr("class", "arc");

  arcs.append("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data.make));

  // Create the arc for the labels
  const outerArc = d3.arc()
    .outerRadius(radius * 1.2)
    .innerRadius(radius * 1.2);

  // Create text labels outside the pie
  chartContainer_graph2.selectAll("text")
    .data(pie(filteredData))
    .enter()
    .append("text")
    .attr("transform", function (d)
    {
      const pos = outerArc.centroid(d);
      const mid = midAngle(d);
      pos[0] = radius * (mid < Math.PI ? 1.3 : -1.3); // Adjust for left/right

      // Adjust 'volkswagen' label manually
      if (d.data.make === "volkswagen")
      {
        pos[1] -= 10;  // Move up by 10 units
      }

      return `translate(${ pos })`;
    })
    .attr("text-anchor", function (d)
    {
      return (midAngle(d) < Math.PI ? "start" : "end");
    })
    .text(d =>
    {
      const percentage = ((d.data.count / total) * 100).toFixed(2);
      return `${ d.data.make } (${ percentage }%)`;
    });


  // Create the lines connecting slices to labels
  chartContainer_graph2.selectAll("polyline")
    .data(pie(filteredData))
    .enter()
    .append("polyline")
    .attr("points", function (d)
    {
      const pos = outerArc.centroid(d);
      const mid = midAngle(d);
      const outerPos = pos.slice();
      outerPos[0] = radius * (mid < Math.PI ? 1.3 : -1.3); // Position of label
      // Adjust 'volkswagen' polyline position manually other wise it would collide
      if (d.data.make === "volkswagen")
      {
        outerPos[1] -= 10;  // Move line connection up by 10 units
      }
      return [arc.centroid(d), outerArc.centroid(d), outerPos];
    })
    .style("fill", "none")
    .style("stroke", "black");

  // MidAngle function for determining side of the pie
  function midAngle(d)
  {
    return d.startAngle + (d.endAngle - d.startAngle) / 2;
  }

}



/** For the third chart, we would like to see the distribution of buyer's choice based on
 * years. To be more specific, we would like to see how many cars were sold in each year.
 * We will use a bar chart to demostrate this */
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
  const margin = { top: 10, right: 10, bottom: 30, left: 60 };
  const width = size.width - margin.left - margin.right;
  const height = size.height - margin.top - margin.bottom;

  // Define color for the bars
  const colorScale = d3.scaleThreshold()
    .domain([10000, 50000, 100000])
    .range(['#ff0000', '#ffb700', '#d0ff00', '#0fd971']);

  function getColor(index)
  {
    return colorScale(index);
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


  // Add the X axis label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.top + 20)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "black")
    .text("Year")
    .style("font-weight", "bold");

  // Add the Y axis label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left)
    .attr("dy", "1em")
    .text("Number of car sold")
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "black")
    .style("font-weight", "bold");

}
