import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { debounce } from 'lodash';

const margin = { left: 30, right: 20, top: 20, bottom: 20 };
var size = { width: 0, height: 0 };

// Read CSV and prepare the data
const loadData = async () => {
    const data = await d3.csv('./data/athletes.csv');
    
    // Process the data to group athletes by country and sport
    const countrySportData = d3.rollups(
      data,
      v => v.length, // Count athletes
      d => d.country, // Group by country
      d => d.disciplines // Group by sport
    );
  
    // Format the data for use in the Sankey diagram
    const nodes = [];
    const links = [];
  
    countrySportData.forEach(([country, sports]) => {
      // Add the country node if not already added
      if (!nodes.find(n => n.name === country)) {
        nodes.push({ name: country });
      }
  
      sports.forEach(([sport, count]) => {
        // Clean the sport name (remove brackets and single quotes)
        const cleanSport = sport.replace(/[\[\]']+/g, '');
  
        // Add the sport node if not already added
        if (!nodes.find(n => n.name === cleanSport)) {
          nodes.push({ name: cleanSport });
        }
  
        // Create a link between country and sport
        links.push({
          source: nodes.findIndex(n => n.name === country),
          target: nodes.findIndex(n => n.name === cleanSport),
          value: count
        });
      });
    });
  
    return { nodes, links };
  };
  

const onResize = async (targets) => {
    const formattedData = await loadData();
    targets.forEach(target => {
        if (!target.target.getAttribute('id').includes('sankey-chart')) return;

        const newWidth = target.contentRect.width;
        const newHeight = target.contentRect.height;
        size = { width: newWidth, height: newHeight };

        if (size && formattedData) {
            d3.select(`#${target.target.id} svg`).selectAll('*').remove();
            initSankeyChart(target.target.id, formattedData);
        }
    });
};

const chartObserver = new ResizeObserver(debounce(onResize, 100));

export const SankeyChartComponent = (title = 'Athletes sport volume per Country') => (
    `<div class='chart-container' id='sankey-chart' style="width: 100%; height: 100%;">
        <svg id='sankey-svg' style="width: 100%; height: 100%;"></svg>
        <h6 class='center-align'>${title}</h6>
    </div>`
);

export function mountSankeyChart(containerId) {
    let sankeyContainer = document.querySelector(containerId);
    chartObserver.observe(sankeyContainer);
}

async function initSankeyChart(containerId, data) {
    const chartContainer = d3.select(`#${containerId} svg`)
        .attr("viewBox", `0 0 ${size.width} ${size.height}`) // Make sure the viewBox scales to fit the available space
        .attr("preserveAspectRatio", "xMidYMid meet");

    // Create the sankey layout
    const sankeyGenerator = sankey()
        .nodeWidth(20)
        .nodePadding(10)
        .extent([[margin.left, margin.top], [size.width - margin.right, size.height - margin.bottom]]);

    // Generate the sankey diagram
    const { nodes, links } = sankeyGenerator(data);

    // Create a color scale
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // Add links
    const link = chartContainer.append("g")
        .attr("fill", "none")
        .selectAll("path")
        .data(links)
        .enter().append("path")
        .attr("d", sankeyLinkHorizontal())
        .attr("stroke", d => colorScale(d.source.name))
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("stroke-opacity", 0.5);

    // Add nodes
    const node = chartContainer.append("g")
        .selectAll("rect")
        .data(nodes)
        .enter().append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => colorScale(d.name));

    // Add labels to nodes
    chartContainer.append("g")
        .selectAll("text")
        .data(nodes)
        .enter().append("text")
        .attr("x", d => d.x0 - 6)
        .attr("y", d => (d.y0 + d.y1) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(d => d.name)
        .filter(d => d.x0 < size.width / 2)
        .attr("x", d => d.x1 + 6)
        .attr("text-anchor", "start");

    // Add tooltips for the links
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'lightgray')
        .style('border', '1px solid black')
        .style('padding', '5px')
        .style('border-radius', '5px');

    link.on('mouseover', function (event, d) {
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`${d.source.name} → ${d.target.name}<br>Number of Athletes: ${d.value}`)
            .style('left', (event.pageX + 5) + 'px')
            .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function () {
        tooltip.transition().duration(200).style('opacity', 0);
    });
}
