import * as d3 from 'd3';
import { debounce } from 'lodash';

const margin = { left: 50, right: 20, top: 20, bottom: 100 };
var size = { width: 0, height: 0 };

const loadData = async () => {
    const data = await d3.csv('./data/athletes.csv');
    
    const countryData = d3.rollups(
        data,
        v => v.length,
        d => d.country,
        d => d.disciplines
    );

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

export const BarChartComponent = (title = 'Athletes distribution per Country with respect to sports') => (
    `<div class='chart-container' id='bar-chart' style="width: 100%; height: 100%;">
        <hr>
        <h6 class='center-align'>${title}</h6>
        <h7 class='center-align'>======= Notes: click on grey background to open tooltip with more info ======</h7><br>
        <h7 class='center-align'>======= Second graph sanky graph is connected to bar graph, when you open tool tip it'll generate sanky for that country only ======</h7>
        <hr>
        <div id='bar-chart-scrollable' style="overflow-x: auto; width: 1000px; white-space: nowrap;">
        <svg id='bar-svg' style="width: 100%; height: 100%;"></svg>
        </div>
        <div id="bar-chart-legend" style="padding: 10px; margin-bottom: 20px;"></div>
        <hr>
        <hr>
    </div>`
);

export function mountBarChart(containerId) {
    let barContainer = document.querySelector(containerId);
    chartObserver.observe(barContainer);
}

async function initChart(containerId, data) {
    const scrollableContainer = d3.select(`#${containerId} #bar-chart-scrollable`);
    const legendContainer = d3.select(`#${containerId} #bar-chart-legend`);

    const maxSportsCount = d3.max(data, d => d.sports.length);
    const maxSportCount = d3.max(data, d => d3.max(d.sports, sport => sport.count));

    const containerWidth = 1000;
    const countryWidth = 60 + maxSportsCount * 20;
    const svgWidth = Math.max(containerWidth, data.length * countryWidth);
    const svgHeight = 500;

    scrollableContainer.select("svg").remove();
    legendContainer.selectAll("*").remove();
    scrollableContainer.style("overflow-x", "auto");

    const mainSvg = scrollableContainer.append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    data.sort((a, b) => {
        if (a.country === "United States") return -1;
        if (b.country === "United States") return 1;
        return a.country.localeCompare(b.country);
    });

    const xScale = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([margin.left, svgWidth - margin.right])
        .padding(0.3);

    const yScale = d3.scaleLinear()
        .domain([0, maxSportCount + maxSportCount * 0.1])
        .range([svgHeight - margin.bottom, margin.top]);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);
    const barWidth = (xScale.bandwidth() - 10) / maxSportsCount;

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("pointer-events", "auto");

    // Add background rectangles for each country to separate them visually (only once)
    mainSvg.selectAll("rect.country-bg")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "country-bg")
        .attr("x", d => xScale(d.country))
        .attr("y", margin.top)
        .attr("width", xScale.bandwidth())
        .attr("height", svgHeight - margin.top - margin.bottom)
        .attr("fill", "#f0f0f0")
        .on("click", function(event, d) {
            console.log(`Country clicked: ${d.country}`);

            // Dispatch custom event for selected country
            const countryEvent = new CustomEvent("countrySelected", { detail: { country: d.country } });
            window.dispatchEvent(countryEvent);
            console.log('event sent');

            const tooltipContent = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h4 style="margin: 0;">${d.country}</h4>
                    <button id="close-tooltip" style="background: none; border: none; font-size: 16px; cursor: pointer;">✖</button>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr>
                            <th style="text-align: left;">Sport</th>
                            <th style="text-align: left;">Athletes</th>
                            <th style="text-align: left;">% of Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${d.sports.map(sport => `
                            <tr>
                                <td>${sport.sport}</td>
                                <td>${sport.count}</td>
                                <td>${((sport.count / d.totalAthletes) * 100).toFixed(2)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            tooltip.html(tooltipContent)
                .style("opacity", 1)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 30) + "px");

            // Close tooltip when the "X" button is clicked
            d3.select("#close-tooltip").on("click", () => {
                tooltip.style("opacity", 0);
            });
        });

    // Add bars
    const barGroups = mainSvg.selectAll('g.bar-group')
        .data(data)
        .enter()
        .append('g')
        .attr('transform', d => `translate(${xScale(d.country)}, 0)`);

    barGroups.selectAll('rect.sport-bar')
        .data(d => d.sports)
        .enter()
        .append('rect')
        .attr('class', 'sport-bar')
        .attr('x', (d, i) => i * barWidth)
        .attr('y', d => yScale(d.count))
        .attr('width', barWidth - 2)
        .attr('height', d => svgHeight - margin.bottom - yScale(d.count))
        .attr('fill', d => colorScale(d.sport));

    // Add x-axis for countries
    mainSvg.append('g')
        .attr('transform', `translate(0, ${svgHeight - margin.bottom})`)
        .call(d3.axisBottom(xScale).tickSizeOuter(0))
        .selectAll("text")
        .attr("y", 10)
        .attr("x", 0)
        .attr("dy", ".35em")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Add x-axis label
    mainSvg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${svgWidth / 2}, ${svgHeight - margin.bottom + 50})`)
        .text("Countries");

    // Add y-axis
    const yAxisSvg = mainSvg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale));
}

