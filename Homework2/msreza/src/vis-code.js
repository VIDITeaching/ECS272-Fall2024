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
    };
});


// VISUALIZATION # 1: Side-by-side-by-side histogram of depression, anxiety, and panic attack
// Overview of the data, since data focuses on student mental health
// These three variables are good indicators of the students' mental health status

// function for rolling up data to calculate "Yes" and "No" frequency
const rollupData = (key) => {
    return d3.rollups(
        data,
        v => v.length,
        d => d[key] 
    ).map(([key, value]) => ({ category: key, value }));
};

// apply function to each of three variables
var depressionData = rollupData('depression');
var anxietyData = rollupData('anxiety');
var panicData = rollupData('panic');

// combine the data to display in a single histogram
const combinedData = [
    ...depressionData.map(d => ({ ...d, type: 'depression' })),
    ...anxietyData.map(d => ({ ...d, type: 'anxiety' })),
    ...panicData.map(d => ({ ...d, type: 'panic' }))
];

// color scale for histogram
const colorScale = d3.scaleOrdinal()
    .domain(['depression', 'anxiety', 'panic'])
    .range(['#1f77b4', '#ff7f0e', '#2ca02c']); // Assign colors

// resize functionality for histogram observation
const histResize = (targets) => {
    targets.forEach(target => {
        if (target.target.getAttribute('id') !== 'container1') return;
        size = { width: target.contentRect.width-100, height: target.contentRect.height }
        if (!isEmpty(size) && !isEmpty(combinedData)) {
            d3.select('#hist-svg').selectAll('*').remove()
            console.log(size, combinedData)
            initHist()
        }
    })
}

const histObserver = new ResizeObserver(debounce(histResize, 100))

// defining SVG container for histogram
export const Histogram = () => ( 
    `<div class='chart-container d-flex' id='container1' style='margin-top: 50px; margin-left: 30px;'>
        <svg id='hist-svg' width='100%' height='400'>
        </svg>
    </div>`
)

// function for mounting/displaying histogram
export function mountHistogram() { 
    let histContainer = document.querySelector('#container1')
    histObserver.observe(histContainer)
}

// function for creating histogram
function initHist() {

    // initialize container
    let chartContainer = d3.select('#hist-svg')

    let yExtents = d3.extent(combinedData.map((d) => d.value))
    let xCategories = ['Yes', 'No']
 
    // define scaling for axes
    let xScale = d3.scaleBand()
        .rangeRound([margin.left, size.width - margin.right])
        .domain(xCategories)
        .padding(0.2)

    let groupScale = d3.scaleBand()
        .domain(['depression', 'anxiety', 'panic'])
        .range([0, xScale.bandwidth()])
        .padding(0.05);

    let yScale = d3.scaleLinear()
        .range([size.height - margin.bottom, margin.top])
        .domain([0, yExtents[1]])

    // initialize x-axis
    const xAxis = chartContainer.append('g')
        .attr('transform', `translate(0, ${size.height - margin.bottom})`)
        .call(d3.axisBottom(xScale))

    // initialize y-axis
    const yAxis = chartContainer.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale))

    // define y-axis label
    const yLabel = chartContainer.append('g')
        .attr('transform', `translate(${10}, ${size.height / 2}) rotate(-90)`)
        .append('text')
        .text('Frequency')
        .style('font-size', '.8rem')

    // define x-axis label
    const xLabel = chartContainer.append('g')
        .attr('transform', `translate(${(size.width / 2 - margin.left)-20}, ${size.height - margin.top})`)
        .append('text')
        .text('Student Responses')
        .style('font-size', '1rem')
    
    // draw histogram pars
    chartContainer.append('g')
        .selectAll('g')
        .data(combinedData)
        .join('g')
        .attr('transform', d => `translate(${xScale(d.category)}, 0)`)
        .append('rect')
        .attr('x', d => groupScale(d.type))
        .attr('y', d => yScale(d.value))
        .attr('width', groupScale.bandwidth()) 
        .attr('height', d => Math.abs(yScale(0) - yScale(d.value)))
        .attr('fill', d => colorScale(d.type));

    // add and color-code legend
    const legend = chartContainer.append('g')
        .attr('transform', `translate(${size.width - margin.right - 750}, ${margin.top})`);

    const categories = ['depression', 'anxiety', 'panic'];
    categories.forEach((cat, i) => {
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
            .text(cat.charAt(0).toUpperCase() + cat.slice(1));
    });

    // add title to visualization
    const title = chartContainer.append('g')
        .append('text')
        .attr('transform', `translate(${(size.width / 2)}, ${size.height - margin.top-360})`)
        .attr('dy', '0.5rem') 
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', '1.3rem')
        .text('Distribution of Student Mental Health Responses')
}

// VISUALIZATION # 2: Pie chart displaying GPA distribution among students that said "Yes" to being depressed
// A more focused view on the students that are depressed, meant to build on the overview visualization
// Will help determine if GPA has an impact on mental health
// Chose GPA variable because it is something that seems significant as a student myself (grades and GPA concerns often adversely affect my mental health)

// resize functionality for pie chart observation
const pieResize = (targets) => {
    targets.forEach(target => {
        if (target.target.getAttribute('id') !== 'container2') return;
        size = { width: target.contentRect.width-100, height: target.contentRect.height }
        if (!isEmpty(size) && !isEmpty(data)) {
            d3.select('#pie-svg').selectAll('*').remove()
            console.log(size, data)
            initPieChart()
        }
    })
}

const pieObserver = new ResizeObserver(debounce(pieResize, 100))

// defining SVG element for pie chart
export const PieChart = () => ( 
    `<div class='chart-container d-flex' id='container2' style='margin-top: -450px; margin-left: 1000px;'>
        <svg id='pie-svg' width='100%' height='400'>
        </svg>
    </div>`
);

// function for mounting/displaying pie chart
export function mountPieChart() { 
    let pieContainer = document.querySelector('#container2')
    pieObserver.observe(pieContainer)
    initPieChart(); // Call the pie chart initialization function
}

// function for creating pie chart
function initPieChart() {

    // filter data by students that are depressed
    const filteredData = data
        .filter(d => d.depression === 'Yes')
        .reduce((acc, d) => {
            if (d.gpa) {
                acc[d.gpa] = (acc[d.gpa] || 0) + 1;
            }
            return acc;
        }, {});

    // calculate counts for depressed students in each GPA category 
    const pieData = Object.keys(filteredData).map(gpa => ({
        gpa: gpa,
        count: filteredData[gpa]
    }));

    // redefining size dimensions + radius of pie (circle)
    const width = size.width;
    const height = size.height;
    const radius = Math.min(width, height) / 3;

    // initializing and drawing chart 
    const pieContainer = d3.select('#pie-svg')
        .attr('width', width)
        .attr('height', height);

    const g = pieContainer.append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie()
        .value(d => d.count)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    // color scheme for pie chart
    const colorScale = d3.scaleOrdinal()
        .domain(pieData.map(d => d.gpa))
        .range(d3.schemeSet3);

    const arcs = g.selectAll('.arc')
        .data(pie(pieData))
        .enter()
        .append('g')
        .attr('class', 'arc');

    // adding categories to pie chart
    arcs.append('path')
        .attr('d', arc)
        .attr('fill', d => colorScale(d.data.gpa))
        .attr('stroke', 'black')
        .attr('stroke-width', 1);

    // adding labels to each pie chart category
    arcs.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .style('font-size', '0.8rem')
        .text(d => `${d.data.gpa} (${d.data.count})`);

    // add title to visualization
    pieContainer.append('text')
        .attr('x', width / 2)
        .attr('y', 30)
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', '1.5rem')
        .text('GPA Distribution for Depressed Students');
}

// VISUALIZATION # 3: Parallel Coordinates Plot of Gender, GPA, Year of Study, and Depression
// Advanced visualization
// Meant to build on first two visualizations - Reveals more details about depressed vs. happy students & observes other factors that may correlate with GPA

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

// defining SVG element for parallel plot
export const ParallelCoordinates = () => ( 
    `<div class='chart-container d-flex' id='container3' style='margin-top: 0px; margin-left: 500px;'>
        <svg id='parallel-svg' width='100%' height='400'>
        </svg>
    </div>`
);

// function for mounting/displaying parallel plot
export function mountParallelCoordinates() { 
    let parallelContainer = document.querySelector('#container3')
    parallelObserver.observe(parallelContainer)
    initParallelCoordinates(); // Call the pie chart initialization function
}

// function for creating parallel plot
function initParallelCoordinates() {
    // defining categories for each variable/axis
    const genderCategories = ['Male', 'Female'];
    const gpaCategories = ['0 - 1.99', '2.00 - 2.49', '2.50 - 2.99', '3.00 - 3.49', '3.50 - 4.00'];
    const yearCategories = ['Year 1', 'Year 2', 'Year 3', 'Year 4'];
    const depressionCategories = ['Yes', 'No'];

    // redefining margins and size dimensions
    const width = size.width;
    const height = size.height;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    // initializing plot
    const parallelContainer = d3.select('#parallel-svg')
        .attr('width', width)
        .attr('height', height);

    // diltering data based on variables of interest and their corresponding categories
    const parallelData = data.map(d => ({
        gender: d.gender,
        gpa: d.gpa,
        year: d.year,
        depression: d.depression
    })).filter(d => genderCategories.includes(d.gender) && gpaCategories.includes(d.gpa) && yearCategories.includes(d.year) && depressionCategories.includes(d.depression));

    // scales for each axis
    const xScale = d3.scalePoint()
        .domain(['gender', 'gpa', 'year', 'depression'])
        .range([margin.left, width - margin.right]);

    const yScales = {
        gender: d3.scalePoint()
            .domain(genderCategories)
            .range([height - margin.bottom, margin.top]),

        gpa: d3.scalePoint()
            .domain(gpaCategories)
            .range([height - margin.bottom, margin.top]),

        year: d3.scalePoint()
            .domain(yearCategories)
            .range([height - margin.bottom, margin.top]),
        
        depression: d3.scalePoint()
            .domain(depressionCategories)
            .range([height - margin.bottom, margin.top])
    };

    // draw axes of plot
    Object.keys(yScales).forEach(axis => {
        parallelContainer.append('g')
            .attr('transform', `translate(${xScale(axis)}, 0)`)
            .call(d3.axisLeft(yScales[axis]));

        // axis labels
        parallelContainer.append('text')
            .attr('x', xScale(axis))
            .attr('y', margin.top - 20)
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text(axis.charAt(0).toUpperCase() + axis.slice(1));
        
        console.log(`${axis.charAt(0).toUpperCase() + axis.slice(1)} Scale Domain:`, yScales[axis].domain());
    });

    // draw lines for plot
    parallelContainer.selectAll('path')
        .data(parallelData)
        .enter()
        .append('path')
        .attr('d', d => {
            const pathData = [
                [xScale('gender'), yScales['gender'](d.gender)],
                [xScale('gpa'), yScales['gpa'](d.gpa)],
                [xScale('year'), yScales['year'](d.year)],
                [xScale('depression'), yScales['depression'](d.depression)]
            ];
            console.log('Path Data for:', d, pathData);
            return d3.line()(pathData);
        })
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 0.4);

    // title of visualization
    parallelContainer.append('text')
        .attr('x', width / 2)
        .attr('y', 420)
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', '1.5rem')
        .text('Parallel Coordinates (Advanced) Plot: Gender, GPA, Year, and Depression ');
}
