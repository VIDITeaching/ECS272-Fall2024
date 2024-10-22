import * as d3 from 'd3';
import { debounce } from 'lodash';

const margin = { left: 20, right: 20, top: 20, bottom: 100 };
var size = { width: 0, height: 0 };

// Read CSV and prepare the data
const loadData = async () => {
  const data = await d3.csv('./data/athletes.csv');
  
  // Process the data to group athletes by country and count them by sport
  const countryData = d3.rollups(
    data,
    v => v.length, // Count athletes
    d => d.country, // Group by country
    d => d.disciplines // Group by sport
  );

  // Format the data for use in the bar chart
  return countryData.map(([country, sports]) => ({
    country,
    sports: sports.map(([sport, count]) => ({ sport: sport.replace(/[\[\]']+/g, ""), count })),
    totalAthletes: d3.sum(sports, ([, count]) => count),
  }));
};

const onResize = async (targets) => {
    const formattedData = await loadData();
    targets.forEach(target => {
        if (!target.target.getAttribute('id').includes('bar-chart')) return;

        const newWidth = target.contentRect.width;
        const newHeight = target.contentRect.height;
        size = { width: newWidth, height: newHeight };

        if (size && formattedData) {
            d3.select(`#${target.target.id} svg`).selectAll('*').remove();
            initChart(target.target.id, formattedData);
        }
    });
};


const chartObserver = new ResizeObserver(debounce(onResize, 100));

export const BarChartComponent = (title = 'Athletes per Country and Sport') => (
    `<div class='chart-container' id='bar-chart' style="width: 100%; height: 100%;">
        <svg id='bar-svg' style="width: 100%; height: 100%;"></svg>
        <h6 class='center-align'>${title}</h6>
    </div>`

);

export function mountBarChart(containerId) {
    let barContainer = document.querySelector(containerId);
    chartObserver.observe(barContainer);
}

async function initChart(containerId, data) {
    const chartContainer = d3.select(`#${containerId} svg`)
        .attr("viewBox", `0 0 ${size.width} ${size.height}`) // Make sure the viewBox scales to fit the available space
        .attr("preserveAspectRatio", "xMidYMid meet");

    // Set scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([margin.left, size.width - margin.right])
        .padding(0.2);

    let maxCount = d3.max(data, d => d.totalAthletes);
    maxCount = 150;
    const yScale = d3.scaleLinear()
        .domain([0, maxCount + maxCount * 0.1]) // Extend the domain by 10% beyond the max count
        .range([size.height - margin.bottom, margin.top]);

    let colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // Add bars (stacked for sports)
    const barGroups = chartContainer.selectAll('g.bar-group')
        .data(data)
        .enter()
        .append('g')
        .attr('transform', d => `translate(${xScale(d.country)}, 0)`);

    barGroups.selectAll('rect')
        .data(d => d.sports)
        .enter()
        .append('rect')
        .attr('x', d => xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.count))
        .attr('width', xScale.bandwidth())
        .attr('height', d => size.height - margin.bottom - yScale(d.count))
        .attr('fill', d => colorScale(d.sport))
        .on('mouseover', function (event, d, i) {
            const country = d3.select(this.parentNode).datum().country; // Get the country from parent group
            tooltip.transition().duration(200).style('opacity', 1);
            tooltip.html(`Country: ${country}<br>Sport: ${d.sport}<br>Athletes: ${d.count}`)
                .style('left', (event.pageX + 5) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function () {
            tooltip.transition().duration(200).style('opacity', 0);
        });

    // Add tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'lightgray')
        .style('border', '1px solid black')
        .style('padding', '5px')
        .style('border-radius', '5px');

    // Add x-axis with scrambled (rotated) text
    chartContainer.append('g')
        .attr('transform', `translate(0, ${size.height - margin.bottom})`)
        .call(d3.axisBottom(xScale).tickSizeOuter(0))
        .selectAll("text")
        .attr("y", 0)
        .attr("x", -9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(-65)") // Rotate the text to scramble it
        .style("text-anchor", "end");

    // Add y-axis
    chartContainer.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale));

    // Add x-axis label
    chartContainer.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${size.width / 2}, ${size.height - margin.bottom + 90})`) // Position below the x-axis
        .text("Countries");

    // Add y-axis label
    chartContainer.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${margin.left - 50}, ${size.height / 2}) rotate(-90)`) // Rotate and position left of y-axis
        .text("Number of Athletes");
}


