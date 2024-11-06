import { mountBarChart, BarChartComponent } from './src/charts/BarChart.js';
import { SankeyChartComponent, updateSankeyChart } from './src/charts/SankyChart.js'; // Import the update function for Sankey
import { mountAnimatedBarChart, AnimatedBarChartComponent } from './src/charts/Animation.js';
import { Notes, mountCounter } from './src/notes';
import './style.css';

// Set up layout and add the charts to the DOM
document.querySelector('#app').innerHTML = `
  <div id='main-container' class='container'>
    <div class="row">
      <div class="col s12">
        ${Notes("Interactive dashboard with multiple charts - Homework 3")}
      </div>
    </div>
    <div class='row'>
      <div id='bar-chart-container' class='col s12' style="width: 100%; height: 650px;">
        ${BarChartComponent()}
      </div>
    </div>
    <div class='row'>
      <div id='sankey-chart-container' class='col s12' style="width: 100%; height: 600px;">
        ${SankeyChartComponent()}
      </div>
    </div>
    <div class='row'>
      <div id='animated-bar-chart-container' class='col s12' style="width: 100%; height: 600px;">
        ${AnimatedBarChartComponent()}
      </div>
    </div>
  </div>
`;

// Mount all charts
mountBarChart('#bar-chart-container');
mountAnimatedBarChart('#animated-bar-chart-container');

// Add event listener for country selection
window.addEventListener("countrySelected", (event) => {
    const selectedCountry = event.detail.country;
    console.log(`Country selected: ${selectedCountry}`);
    updateSankeyChart('#sankey-chart-container', selectedCountry); // Call update function with selected country
});
