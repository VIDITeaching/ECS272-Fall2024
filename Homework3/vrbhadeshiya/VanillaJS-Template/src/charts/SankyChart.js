import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

const margin = { left: 30, right: 20, top: 20, bottom: 20 };
var size = { width: 0, height: 0 };

// Load CSV and prepare the data
const loadData = async () => {
    const data = await d3.csv('./data/athletes.csv');
    
    // Process the data to group athletes by country and sport
    const countrySportData = d3.rollups(
        data,
        v => v.length,
        d => d.country,
        d => d.disciplines
    );
  
    return countrySportData;
};

// Update function for Sankey Chart to handle multiple countries
export async function updateSankeyChart(containerId, selectedCountries) {
    const data = await loadData();

    // Initialize empty arrays for nodes and links
    const nodes = [];
    const links = [];
    selectedCountries = [selectedCountries];

    selectedCountries.forEach(countryName => {
        const countryData = data.find(([country]) => country === countryName);

        if (!countryData) {
            console.log(`No data found for country: ${countryName}`);
            return;
        }

        const sports = countryData[1];

        // Add country node if not already present
        if (!nodes.find(n => n.name === countryName)) {
            nodes.push({ name: countryName });
        }

        // Loop through each sport for the country and create links
        sports.forEach(([sport, count]) => {
            const cleanSport = sport.replace(/[\[\]']+/g, '');

            // Add sport node if not already present
            if (!nodes.find(n => n.name === cleanSport)) {
                nodes.push({ name: cleanSport });
            }

            // Find indexes for source (country) and target (sport)
            const countryIndex = nodes.findIndex(n => n.name === countryName);
            const sportIndex = nodes.findIndex(n => n.name === cleanSport);

            // Check if the link between country and sport already exists
            const existingLink = links.find(link => link.source === countryIndex && link.target === sportIndex);
            if (existingLink) {
                // If the link exists, add to its value
                existingLink.value += count;
            } else {
                // Otherwise, create a new link
                links.push({
                    source: countryIndex,
                    target: sportIndex,
                    value: count
                });
            }
        });
    });

    // Create sankeyData in the format expected by initSankeyChart
    const sankeyData = { nodes, links };

    // Clear existing chart elements
    d3.select(`${containerId} svg`).selectAll('*').remove();

    // Render the Sankey chart for the selected countries
    initSankeyChart(containerId, sankeyData);
}

// Initial render for Sankey Chart (empty)
export const SankeyChartComponent = (title = 'Athletes sport volume per Country') => (
    `<div class='chart-container' id='sankey-chart' style="width: 100%; height: 100%;">
        <svg id='sankey-svg' style="width: 100%; height: 100%;"></svg>
        <h6 class='center-align'>${title}</h6>
    </div>`
);

// Initialize Sankey Chart function
function initSankeyChart(containerId, sankeyData) {
    console.log('event triggered');

    // Calculate dynamic height based on the number of nodes
    const nodeCount = sankeyData.nodes.length;
    const dynamicHeight = Math.max(600, nodeCount * 40); // Minimum height of 600px

    // Create a scrollable container with fixed height and place SVG inside it
    const chartContainer = d3.select(containerId)
        .style("height", "600px") // Fixed visible height for container
        .style("overflow-y", "auto") // Enable vertical scrolling for container
        .style("position", "relative");

    // Clear existing SVG and append a new SVG with dynamic height
    chartContainer.selectAll("svg").remove();

    const svg = chartContainer.append("svg")
        .attr("width", size.width || 800)
        .attr("height", dynamicHeight) // Dynamic height for SVG
        .attr("viewBox", `0 0 ${size.width || 800} ${dynamicHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const sankeyGenerator = sankey()
        .nodeWidth(20)
        .nodePadding(10)
        .extent([[margin.left, margin.top], [size.width || 800 - margin.right, dynamicHeight - margin.bottom]]);

    const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator({
        nodes: sankeyData.nodes.map(d => ({ ...d })),
        links: sankeyData.links.filter(link => link.value > 0)
    });

    console.log("data", sankeyNodes, sankeyLinks);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // Render links
    svg.append("g")
        .attr("fill", "none")
        .selectAll("path")
        .data(sankeyLinks)
        .enter()
        .append("path")
        .attr("d", sankeyLinkHorizontal())
        .attr("stroke", d => colorScale(d.source.name))
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("stroke-opacity", 0.5);

    // Render nodes
    svg.append("g")
        .selectAll("rect")
        .data(sankeyNodes)
        .enter()
        .append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => Math.max(0, d.y1 - d.y0))
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => colorScale(d.name));

    // Render node labels
    svg.append("g")
        .selectAll("text")
        .data(sankeyNodes)
        .enter()
        .append("text")
        .attr("x", d => d.x0 - 6)
        .attr("y", d => (d.y0 + d.y1) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(d => d.name)
        .filter(d => d.x0 < (size.width || 800) / 2)
        .attr("x", d => d.x1 + 6)
        .attr("text-anchor", "start");
}
