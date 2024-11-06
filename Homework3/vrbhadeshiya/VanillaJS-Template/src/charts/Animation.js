import * as d3 from 'd3';

const margin = { top: 50, right: 60, bottom: 30, left: 150 };
const width = 600 - margin.left - margin.right; // Adjusted width to fit table
const height = 500 - margin.top - margin.bottom;
const maxBars = 10; // Only display top 10 countries

// Load CSV data and calculate cumulative medal counts by country and date
const loadData = async () => {
  const data = await d3.csv('./data/medallists.csv');

  // Track cumulative medals by country and date
  const cumulativeMedals = {};
  const medalCounts = [];

  data.forEach(d => {
    const date = d.medal_date;
    const country = d.country_long;
    
    // Initialize country's medal count if not present
    if (!cumulativeMedals[country]) cumulativeMedals[country] = 0;
    
    // Increment cumulative medal count for the country
    cumulativeMedals[country] += 1;
    
    // Capture cumulative count up to this date
    medalCounts.push({
      date,
      country,
      total: cumulativeMedals[country],
    });
  });

  return { medalCounts, finalTotals: cumulativeMedals };
};

// Component for the Animated Bar Chart with table beside it
export const AnimatedBarChartComponent = (title = 'Medals won animation by country (Will show final table at the end)') => (
  `     <h6 class='center-align'>${title}</h6>
        <hr>
        <hr>
  <div class='chart-container' id='animated-bar-chart' style="display: flex; gap: 20px; width: 100%; height: 100%;">
      <div style="position: relative; width: 70%;">
        <button id="restart-button" style="position: absolute; top: 10px; left: 10px;">Restart</button>
        <svg id="animated-bar-svg" style="width: 100%; height: 600px;"></svg>
      </div>
      <div id="final-medal-table" style="width: 30%; max-height: 600px; overflow-y: auto; display: none; border: 1px solid #ccc; padding: 10px; border-radius: 5px;"></div>
   </div>`
);

// Mount function to initialize the Animated Bar Chart
export function mountAnimatedBarChart(containerId) {
  loadData().then(({ medalCounts, finalTotals }) => {
    const restartAnimation = () => {
      // Clear any existing chart and hide the final medal table
      d3.select(`${containerId} svg`).selectAll("*").remove();
      document.getElementById('final-medal-table').style.display = 'none';

      // Restart the animation
      animateChart(containerId, medalCounts, finalTotals);
    };

    document.getElementById('restart-button').addEventListener('click', restartAnimation);
    restartAnimation(); // Start the initial animation
  });
}

// Initialize the SVG and scales for the chart
const initializeChart = (containerId) => {
  const svg = d3.select(`${containerId} svg`)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create scales
  const xScale = d3.scaleLinear().range([0, width]);
  const yScale = d3.scaleBand().range([0, maxBars * 30]).padding(0.1); // Bar height for each country
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10); // Color scale for countries

  // Axes
  svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`);
  svg.append("g").attr("class", "y-axis");

  // Date text display
  svg.append("text")
    .attr("class", "date-display")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold");

  return { svg, xScale, yScale, colorScale };
};

// Update chart based on the cumulative medal totals up to the current date
const updateChart = (svg, data, xScale, yScale, colorScale, date) => {
  // Get the cumulative data for the top 10 countries up to the current date
  const dateData = data
    .filter(d => d.date <= date)
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.country === curr.country);
      if (existing) {
        existing.total = Math.max(existing.total, curr.total);
      } else {
        acc.push({ ...curr });
      }
      return acc;
    }, [])
    .sort((a, b) => b.total - a.total)
    .slice(0, maxBars);

  // Update date display text
  svg.select(".date-display").text(`Date: ${date}`);

  // Update scales
  xScale.domain([0, d3.max(dateData, d => d.total)]);
  yScale.domain(dateData.map(d => d.country));

  // Update axes
  svg.select(".x-axis").transition().duration(500).call(d3.axisBottom(xScale).ticks(5));
  svg.select(".y-axis").transition().duration(500).call(d3.axisLeft(yScale));

  // Bind data to bars
  const bars = svg.selectAll(".bar").data(dateData, d => d.country);

  // Enter new bars
  bars.enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", 0)
    .attr("y", d => yScale(d.country))
    .attr("height", yScale.bandwidth())
    .attr("width", 0)
    .transition()
    .duration(500)
    .attr("width", d => xScale(d.total))
    .attr("fill", d => colorScale(d.country));

  // Update existing bars
  bars.transition().duration(500)
    .attr("y", d => yScale(d.country))
    .attr("width", d => xScale(d.total));

  // Exit bars
  bars.exit()
    .transition().duration(500)
    .attr("width", 0)
    .remove();

  // Medal count labels
  const labels = svg.selectAll(".label").data(dateData, d => d.country);

  labels.enter()
    .append("text")
    .attr("class", "label")
    .attr("x", d => xScale(d.total) + 5)
    .attr("y", d => yScale(d.country) + yScale.bandwidth() / 2 + 4)
    .text(d => d.total);

  labels.transition().duration(500)
    .attr("x", d => xScale(d.total) + 5)
    .attr("y", d => yScale(d.country) + yScale.bandwidth() / 2 + 4)
    .text(d => d.total);

  labels.exit().remove();
};

// Display the final medal table at the end of the animation
const displayFinalMedalTable = (finalTotals) => {
  const tableContainer = document.getElementById('final-medal-table');
  tableContainer.innerHTML = '<h3>Total Medals by Country</h3>';
  tableContainer.style.display = 'block';

  const sortedTotals = Object.entries(finalTotals)
    .sort(([, a], [, b]) => b - a) // Sort countries by total medals
    .map(([country, total]) => `<tr><td>${country}</td><td>${total}</td></tr>`)
    .join('');

  tableContainer.innerHTML += `
    <table border="1" cellpadding="8" cellspacing="0" style="width: 100%;">
      <thead>
        <tr><th>Country</th><th>Total Medals</th></tr>
      </thead>
      <tbody>${sortedTotals}</tbody>
    </table>
  `;
};

// Main function to animate the chart
const animateChart = async (containerId, data, finalTotals) => {
  const uniqueDates = Array.from(new Set(data.map(d => d.date))).sort();

  const { svg, xScale, yScale, colorScale } = initializeChart(containerId);

  let i = 0;
  const interval = setInterval(() => {
    if (i >= uniqueDates.length) {
      clearInterval(interval);
      displayFinalMedalTable(finalTotals);
    } else {
      const date = uniqueDates[i];
      updateChart(svg, data, xScale, yScale, colorScale, date);
      i++;
    }
  }, 2000); // Slower interval duration for smoother animation
};
