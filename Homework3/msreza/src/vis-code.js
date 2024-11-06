// CONSULT README FILE FOR RATIONALE BEHIND CHOSEN VISUALIZATIONS

// necessary imports
import * as d3 from 'd3';
import axios from 'axios';
import { isEmpty, debounce } from 'lodash';

const margin = { left: 40, right: 20, top: 70, bottom: 110 }
var size = { width: 0, height: 0 }

// ead in CSV file, stored in ./data
// rename columns accordingly for future use
const data = await d3.csv('./data/mental-health.csv', (d) => { 
    return { 
        depression: d["Do you have Depression?"],
        anxiety: d["Do you have Anxiety?"],
        panic: d["Do you have Panic attack?"],
        year: d["Your current Year of Study"],
        gpa: d["What is your CGPA?"],
        gender: d["Choose your gender"],
        age: d["Age"]
    };
});


// VISUALIZATION # 1: Histogram of either GPA, Year, Gender, and Age
// Stacked bar chart, two colors representing depressed and not depressed students
// Overview of the data, since data focuses on student mental health and associated attributes
// Interactivity: Dropdown menu that allows user to toggle which attribute to visualize

// function for rolling up data to calculate "Yes" and "No" frequency
const rollupData = (key) => {
    return d3.rollups(
        data,
        v => v.length,
        d => d[key],
        d => d.depression // Further categorize by depression status
    ).map(([category, values]) => ({
        category,
        values: values.map(([subCategory, count]) => ({ subCategory, count }))
    }));
};

// Default data for GPA on initial load
let selectedAttribute = 'gpa';
let histogramData = rollupData(selectedAttribute);

// Color scale for depression categories
const colorScale = d3.scaleOrdinal()
    .domain(['No', 'Yes'])
    .range(['#1f77b4', '#ff0000']); // Blue for "No", Red for "Yes"

// Resize observer function for histogram container
const histResize = (targets) => {
    targets.forEach(target => {
        if (target.target.getAttribute('id') !== 'container1') return;
        size = { width: target.contentRect.width - 100, height: target.contentRect.height };
        if (!isEmpty(size) && !isEmpty(histogramData)) {
            d3.select('#hist-svg').selectAll('*').remove();
            initHist();
        }
    });
};

// histogram resizing
const histObserver = new ResizeObserver(debounce(histResize, 100));

// defining SVG container for histogram + dropdown menu
export const Histogram = () => (
    `<div style='margin: 10px;'>
        <label for="attribute-dropdown">Select Attribute:</label>
        <select id='attribute-dropdown' style='display: inline-block; width: auto; height: auto;'>
            <option value='gpa' selected>GPA</option>
            <option value='year'>Year</option>
            <option value='gender'>Gender</option>
            <option value='age'>Age</option>
        </select>
    </div>
    <div class='chart-container d-flex' id='container1' style='margin-left: 30px;'>
        <svg id='hist-svg' width='100%' height='400'></svg>
    </div>
    <div id="tooltip" style="position: absolute; opacity: 0; background: lightgray; padding: 5px; border-radius: 4px;"></div>`
);

// function to mount histogram and setup dropdown interaction
export function mountHistogram() { 
    let histContainer = document.querySelector('#container1');
    histObserver.observe(histContainer);

    // initialize histogram for the first time
    initHist();

    // verify dropdown is accessible
    const dropdown = document.getElementById('attribute-dropdown');

    // add event listener
    dropdown.addEventListener('change', (event) => {
        selectedAttribute = event.target.value;
        console.log("Selected attribute changed:", selectedAttribute); // Debugging
        histogramData = rollupData(selectedAttribute);
        console.log("New histogram data:", histogramData); // Debugging
        d3.select('#hist-svg').selectAll('*').remove();
        initHist();
    });
}

// function for creating histogram
function initHist() {

    // container setup for SVG
    const chartContainer = d3.select('#hist-svg');
    chartContainer.selectAll('*').remove();

    // set x-axis categories and y-axis range based on the current data
    const xCategories = histogramData.map(d => d.category);
    const yExtents = d3.max(histogramData.map(d => d3.sum(d.values.map(sub => sub.count))));

    const xScale = d3.scaleBand()
        .range([margin.left, size.width - margin.right])
        .domain(xCategories)
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .range([size.height - margin.bottom, margin.top])
        .domain([0, yExtents]);

    // create x-axis and y-axis
    chartContainer.append('g')
        .attr('transform', `translate(0, ${size.height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    chartContainer.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale));

    // add y-axis label
    chartContainer.append('g')
        .attr('transform', `translate(${10}, ${size.height / 2}) rotate(-90)`)
        .append('text')
        .text('Frequency')
        .style('font-size', '.8rem');

    // add x-axis label
    chartContainer.append('g')
        .attr('transform', `translate(${(size.width / 2 - margin.left)}, ${size.height - margin.top})`)
        .append('text')
        .text(selectedAttribute.charAt(0).toUpperCase() + selectedAttribute.slice(1))
        .style('font-size', '1rem');
    
    // Draw the bars for the histogram, stacking based on depression status, transitions included
    chartContainer.append('g')
        .selectAll('g')
        .data(histogramData)
        .join('g')
        .attr('transform', d => `translate(${xScale(d.category)}, 0)`)
        .selectAll('rect')
        .data(d => {
            let cumulative = 0;
            return d.values.map(sub => {
                const barData = { ...sub, y0: cumulative };
                cumulative += sub.count;
                return barData;
            });
        })
        .join('rect')
        .attr('x', d => xScale(d.category))
        .attr('width', xScale.bandwidth())
        .attr('y', size.height - margin.bottom) // set initial height to 0 for animation, expands from the bottom
        .attr('height', 0)
        .attr('fill', d => colorScale(d.subCategory))
        .transition() // animate height and position of bars
        .duration(750)
        .attr('y', d => yScale(d.y0 + d.count))
        .attr('height', d => Math.abs(yScale(0) - yScale(d.count)));


    // add legend for depression status
    const legend = chartContainer.append('g')
        .attr('transform', `translate(${size.width - margin.right - 150}, ${margin.top})`);

    ['Not Depressed', 'Depressed'].forEach((cat, i) => {
        legend.append('rect')
            .attr('x', 0)
            .attr('y', i * 20)
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', colorScale(cat));

        legend.append('text')
            .attr('x', 25)
            .attr('y', i * 20 + 9)
            .attr('dy', '0.35em')
            .text(cat);
    });

    // title for histogram
    chartContainer.append('g')
        .append('text')
        .attr('transform', `translate(${(size.width / 2)}, ${margin.top - 50})`) // Centered title
        .attr('dy', '0.5rem')
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', '1.5rem')
        .text(`Distribution of ${selectedAttribute.charAt(0).toUpperCase() + selectedAttribute.slice(1)} Among Students`);
}


// VISUALIZATION # 2: Pie chart displaying either GPA, Year, Gender, or Age distribution among students that said "Yes" to being depressed
// A more focused view on the students that are depressed, meant to connect with and build on overview visualization
// Will help determine if these attributes are associated with being depressed
// Interactivity: Shares a dropdown menu with histogram - dropdown menu selection affects both histogram and pie chart concurrently
// Allows user to examine both overview chart and in depth chart at the same time
// Interactivity: Hover/Mouseover element that displays the quantity and percentage of each slice, as well as repeats the category
// Interactivity: Legend to the right of pie chart that serves as checkboxes that allows user to choose which categories to include in the pie chart

// pie chart resize observer function
const pieResize = (targets) => {
    targets.forEach(target => {
        if (target.target.getAttribute('id') !== 'container2') return;
        size = { width: target.contentRect.width - 100, height: target.contentRect.height };
        if (!isEmpty(size) && !isEmpty(data)) {
            d3.select('#pie-svg').selectAll('*').remove();
            initPieChart();
        }
    });
};

const pieObserver = new ResizeObserver(debounce(pieResize, 100));

// defining SVG element for pie chart with dropdown and tooltip container
export const PieChart = () => (
    `<div class='chart-container d-flex' id='container2' style='margin-left: 800px; margin-top: -500px;'>
        <svg id='pie-svg' width='100%' height='400'></svg>
    </div>
    <div id="tooltip" style="position: absolute; opacity: 0; background: lightgray; padding: 5px; border-radius: 4px;"></div>`
);

// track slice visibility
let visibilityState = {};

// function for mounting/displaying pie chart
export function mountPieChart() { 
    let pieContainer = document.querySelector('#container2');
    pieObserver.observe(pieContainer);

    // event listener for dropdown menu to update the pie chart
    document.getElementById('attribute-dropdown').addEventListener('change', (event) => {
        selectedAttribute = event.target.value;
        d3.select('#pie-svg').selectAll('*').remove();
        initPieChart();
    });

    initPieChart(); // initial call
}

// function to filter data by selected attribute and create pie chart
function initPieChart() {
    const selectedAttribute = document.getElementById('attribute-dropdown').value;

    // filter data by depressed students 
    const depressedData = data.filter(d => d.depression === 'Yes')

    // filter data by selected attribute and count occurrences
    const filteredData = depressedData.reduce((acc, d) => {
        const key = d[selectedAttribute];
        if (key) {
            acc[key] = (acc[key] || 0) + 1;
        }
        return acc;
    }, {});

    // generate pie data from filtered results
    const pieData = Object.keys(filteredData).map(key => ({
        key: key,
        count: filteredData[key]
    }));

    // set visibility state for each category if not already set
    pieData.forEach(d => {
        if (!(d.key in visibilityState)) visibilityState[d.key] = true;
    });

    // setting up dimensions and radius of the pie chart, redefining width and height
    const width = size.width;
    const height = size.height;
    const radius = Math.min(width, height) / 3;

    // initializing SVG container
    const pieContainer = d3.select('#pie-svg')
        .attr('width', width)
        .attr('height', height);

    const g = pieContainer.append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // tooltip setup with d3
    const tooltip = d3.select("#tooltip");

    // pie and arc layout
    const pie = d3.pie()
        .value(d => d.count)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    // color scale for categories
    const colorScale = d3.scaleOrdinal()
        .domain(pieData.map(d => d.key))
        .range(d3.schemeSet3);

    // update pie chart based on current visible slices
    function updateChart() {
        const visibleData = pieData.filter(d => visibilityState[d.key]);
        const arcs = g.selectAll('.arc')
            .data(pie(visibleData), d => d.data.key);

        // remove hidden slices
        arcs.exit().remove();

        // add slices with animation on first enter
        const newArcs = arcs.enter().append('g')
            .attr('class', 'arc');

        newArcs.append('path')
            .attr('fill', d => colorScale(d.data.key))
            .attr('stroke', 'black')
            .attr('stroke-width', 1)
            .on('mouseover', function(event, d) {
                const percentage = ((d.data.count / d3.sum(visibleData.map(d => d.count))) * 100).toFixed(1);
                tooltip.html(`${d.data.key}: ${d.data.count} (${percentage}%)`)
                    .style("opacity", 1)
                    .style("left", `${event.pageX + 5}px`)
                    .style("top", `${event.pageY - 30}px`);
            })
            .on('mousemove', function(event) {
                tooltip.style("left", `${event.pageX + 5}px`)
                    .style("top", `${event.pageY - 30}px`);
            })
            .on('mouseout', function() {
                tooltip.style("opacity", 0);
            })
            .transition()
            .duration(1000)
            .attrTween('d', function(d) {
                const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
                return function(t) {
                    return arc(i(t));
                };
            });

        // for returning slices, skip animation and directly set the path
        newArcs.merge(arcs).select('path')
            .attr('d', arc);

        // add and update labels for existing arcs
        newArcs.append('text')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .attr('text-anchor', 'middle')
            .style('font-size', '0.8rem')
            .text(d => d.data.key);

        arcs.select('text')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .text(d => d.data.key);
    }


    // call updateChart to render pie slices based on visibility
    updateChart();

    // add legend for interactivity
    const legend = pieContainer.append("g")
        .attr("transform", `translate(${width - 200}, 150)`);

    legend.selectAll("rect")
        .data(pieData)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", d => colorScale(d.key))
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            visibilityState[d.key] = !visibilityState[d.key];
            updateChart();
        });

    legend.selectAll("text")
        .data(pieData)
        .enter()
        .append("text")
        .attr("x", 24)
        .attr("y", (d, i) => i * 20 + 14)
        .text(d => d.key)
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            visibilityState[d.key] = !visibilityState[d.key];
            updateChart();
        });

    // add title to the pie chart
    pieContainer.append('text')
        .attr('x', width / 2)
        .attr('y', 30)
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', '1.5rem')
        .text(`${selectedAttribute.charAt(0).toUpperCase() + selectedAttribute.slice(1)} Distribution for Depressed Students`);
}


// VISUALIZATION # 3: Parallel Coordinates Plot of Gender, GPA, Year of Study, and Depression (Advanced visualization)
// Meant to build on first two visualizations - Reveals more details about depressed vs. happy students 
// Showcases how different attributes interact with one another in relation to depression
// Interactivity: Checkboxes for each attribute that allows user to choose which attributes to include in the visualization
// Interactivity: Brush element for each axis in the visualization that allow user to focus on and examine specific patterns of interest 

// resize functionality for parallel coordinate plot observation
const parallelResize = (targets) => {
    targets.forEach(target => {
        if (target.target.getAttribute('id') !== 'container3') return;
        size = { width: target.contentRect.width-100, height: target.contentRect.height }
        if (!isEmpty(size) && !isEmpty(data)) {
            d3.select('#parallel-svg').selectAll('*').remove()
            console.log(size, data)
            initParallelCoordinates()
        }
    })
}

const parallelObserver = new ResizeObserver(debounce(parallelResize, 100))

// defining SVG element for parallel plot with checkboxes 
export const ParallelCoordinates = () => (
    `<div id="controls" style="display: flex; flex-direction: column; position: absolute; left: 240px; top: 620px;">
        <label style="display: flex; align-items: center;">
            <input type="checkbox" class="variable-checkbox" value="gender" checked /> 
            <span style="margin-left: 5px;">Gender</span>
        </label>
        <label style="display: flex; align-items: center;">
            <input type="checkbox" class="variable-checkbox" value="gpa" checked /> 
            <span style="margin-left: 5px;">GPA</span>
        </label>
        <label style="display: flex; align-items: center;">
            <input type="checkbox" class="variable-checkbox" value="year" checked /> 
            <span style="margin-left: 5px;">Year</span>
        </label>
        <label style="display: flex; align-items: center;">
            <input type="checkbox" class="variable-checkbox" value="age" checked /> 
            <span style="margin-left: 5px;">Age</span>
        </label>
    </div>
    <div class='chart-container d-flex' id='container3' style='margin-top: 0px; margin-left: 350px; width: 1400px; height: 500px; position: relative'>
        <svg id='parallel-svg' width='100%' height='100%'>
        </svg>
    </div>`
);

// function for mounting/displaying parallel plot
export function mountParallelCoordinates() {
    let parallelContainer = document.querySelector('#container3');
    parallelObserver.observe(parallelContainer);

    // initialize checkboxes for variable selection
    document.querySelectorAll('.variable-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => updateParallelCoordinates());
    });

    // initial render of parallel coordinates
    initParallelCoordinates();
}

// function for constructing parallel coordinates plot, instantly calles update function 
function initParallelCoordinates() {
    updateParallelCoordinates();
}

// function for updating parallel coordinates plot based on checked variables
function updateParallelCoordinates() {
    const selectedVariables = Array.from(document.querySelectorAll('.variable-checkbox:checked'))
        .map(cb => cb.value)
        .concat('depression');

    const width = size.width;
    const height = size.height;
    const margin = { top: 50, right: 50, bottom: 100, left: 50 };

    // filter and process data based on selected variables
    const parallelData = data.map(d => selectedVariables.reduce((obj, key) => {
        obj[key] = d[key];
        return obj;
    }, {}));

    // define xScale based on selected variables
    const xScale = d3.scalePoint()
        .domain(selectedVariables)
        .range([margin.left, width - margin.right]);

    // define yScales for each axis (using only selected variables)
    const yScales = {
        gender: d3.scalePoint().domain(['Male', 'Female']).range([height - margin.bottom, margin.top]),
        gpa: d3.scalePoint().domain(['0 - 1.99', '2.00 - 2.49', '2.50 - 2.99', '3.00 - 3.49', '3.50 - 4.00']).range([height - margin.bottom, margin.top]),
        year: d3.scalePoint().domain(['Year 1', 'Year 2', 'Year 3', 'Year 4']).range([height - margin.bottom, margin.top]),
        age: d3.scalePoint().domain(['18', '19', '20', '21', '22', '23', '24']).range([height - margin.bottom, margin.top]),
        depression: d3.scalePoint().domain(['Yes', 'No']).range([height - margin.bottom, margin.top])
    };

    // clear previous plot
    d3.select('#parallel-svg').selectAll('*').remove();

    // Append new axes based on selected variables
    selectedVariables.forEach(axis => {
        d3.select('#parallel-svg')
            .append('g')
            .attr('transform', `translate(${xScale(axis)}, 0)`)
            .call(d3.axisLeft(yScales[axis]));

        // axis labels
        d3.select('#parallel-svg').append('text')
            .attr('x', xScale(axis))
            .attr('y', margin.top - 20)
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text(axis.charAt(0).toUpperCase() + axis.slice(1));

        // add brush to each axis
        const brush = d3.brushY()
            .extent([[-10, 0], [10, height]])
            .on('brush', function(event) {
                const selection = event.selection;
                updateBrushHighlighting(selection, axis, selectedVariables, xScale, yScales, parallelData);
            });

        d3.select('#parallel-svg').append('g')
            .attr('class', 'brush')
            .attr('transform', `translate(${xScale(axis)}, 0)`)
            .call(brush);
    });

    // draw lines based on selected variables
    const line = d3.line();
    d3.select('#parallel-svg').selectAll('path')
        .data(parallelData)
        .enter()
        .append('path')
        .attr('d', d => {
            const pathData = selectedVariables.map(key => [xScale(key), yScales[key](d[key])]);
            return line(pathData);
        })
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 0.4);

    // title of visualization
    d3.select('#parallel-svg').append('text')
        .attr('x', width / 2)
        .attr('y', height - margin.bottom + 50)
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', '1.5rem')
        .text('Parallel Coordinates (Interactive) Plot: Selected Variables and Depression');
}

// function to update lines based on brush selection
function updateBrushHighlighting(selection, axis, selectedVariables, xScale, yScales, parallelData) {
    
    // min and max values from brush selection
    const [brushMin, brushMax] = selection;

    // dim all lines by default
    d3.select('#parallel-svg').selectAll('path')
        .style('stroke', 'lightgray') // Dimmed color for non-highlighted lines

    // highlight the lines that pass the brush on this axis
    d3.select('#parallel-svg').selectAll('path')
        .data(parallelData)
        .style('stroke', d => {
            const yValue = yScales[axis](d[axis]);
            return (yValue >= brushMin && yValue <= brushMax) ? 'steelblue' : 'lightgray';
        });
}
