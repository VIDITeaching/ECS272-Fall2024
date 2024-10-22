import { mountBarChart, BarChartComponent } from './src/charts/BarChart.js';
import { mountSankeyChart, SankeyChartComponent } from './src/charts/SankyChart.js';
import { mountPieChart, PieChartComponent } from './src/charts/PieChart.js';
import { Notes, mountCounter } from './src/notes';
import './style.css';

// Set up layout and add the charts to the DOM
document.querySelector('#app').innerHTML = `
  <div id='main-container' class='container'>
    <div class="row">
      <div class="col s12">
        ${Notes("Interactive dashboard with multiple charts")}
      </div>
    </div>
    <div class='row'>
      <div id='bar-chart-container' class='col s12' style="width: 100%; height: 1000px;">
        ${BarChartComponent()}
      </div>
    </div>
    <div class='row'>
      <div id='pie-chart-container' class='col s12' style="width: 100%; height: 1000px;">
        ${PieChartComponent()}
      </div>
    </div>
    <div class='row'>
      <div id='sankey-chart-container' class='col s12' style="width: 100%; height: 4000px;">
        ${SankeyChartComponent()}
      </div>
    </div>
  </div>
`;

// Mount all charts
mountBarChart('#bar-chart-container');
mountPieChart('#pie-chart-container');
mountSankeyChart('#sankey-chart-container');

// Mount the counter example
mountCounter(document.querySelector('#counter-button'));
