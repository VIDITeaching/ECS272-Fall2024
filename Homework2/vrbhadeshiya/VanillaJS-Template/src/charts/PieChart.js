import * as d3 from 'd3';
import { debounce } from 'lodash';

const margin = { left: 30, right: 20, top: 20, bottom: 20 };
var size = { width: 1000, height: 1000 };

// Read CSV and prepare the data
const loadData = async () => {
  const data = await d3.csv('./data/athletes.csv');
  
  // Process the data to group athletes by country
  const countryData = d3.rollups(
    data,
    v => v.length, // Count athletes
    d => d.country // Group by country
  );

  // Format the data for use in the pie chart
  return countryData.map(([country, count]) => ({
    country,
    count,
  }));
};

const onResize = async (targets) => {
    const formattedData = await loadData();
    targets.forEach(target => {
        if (!target.target.getAttribute('id').includes('pie-chart')) return;

        const newWidth = target.contentRect.width;
        const newHeight = target.contentRect.height;
        size = { width: newWidth, height: newHeight };

        if (size && formattedData) {
            d3.select(`#${target.target.id} svg`).selectAll('*').remove();
            initPieChart(target.target.id, formattedData);
        }
    });
};

const chartObserver = new ResizeObserver(debounce(onResize, 100));

export const PieChartComponent = (title = 'Athletes per Country') => (
    `<div class='chart-container' id='pie-chart' style="width: 100%; height: 100%;">
        <svg id='pie-svg' style="width: 100%; height: 100%;"></svg>
        <h6 class='center-align'>${title}</h6>
    </div>`
);

export function mountPieChart(containerId) {
    let pieContainer = document.querySelector(containerId);
    chartObserver.observe(pieContainer);
}

async function initPieChart(containerId, data) {
    const radius = Math.min(size.width, size.height) / 2 - Math.max(margin.top, margin.bottom);

    const chartContainer = d3.select(`#${containerId} svg`)
        .attr("viewBox", `0 0 ${size.width} ${size.height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const g = chartContainer.append("g")
        .attr("transform", `translate(${size.width / 2}, ${size.height / 2})`);

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const pie = d3.pie()
        .value(d => d.count)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'lightgray')
        .style('border', '1px solid black')
        .style('padding', '5px')
        .style('border-radius', '5px');

    const slices = g.selectAll('.slice')
        .data(pie(data))
        .enter()
        .append('g')
        .attr('class', 'slice');

    slices.append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.country))
        .on('mouseover', function (event, d) {
            tooltip.transition().duration(200).style('opacity', 1);
            tooltip.html(`Country: ${d.data.country}<br>Count: ${d.data.count}`)
                .style('left', (event.pageX + 5) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function () {
            tooltip.transition().duration(200).style('opacity', 0);
        });

    // Remove the labels (Optional, here we comment out the label code)
    /*
    slices.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('dy', '0.35em')
        .text(d => d.data.country);
    */
}
