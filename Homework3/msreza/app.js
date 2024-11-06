import { mountHistogram, Histogram } from './src/vis-code'
import { mountPieChart, PieChart } from './src/vis-code';
import { mountParallelCoordinates, ParallelCoordinates } from './src/vis-code';
import './style.css'

document.querySelector('#app').innerHTML = `
  <div id='main-container' class='d-flex flex-column flex-nowrap'>
    ${Histogram()}
    ${PieChart()}
    ${ParallelCoordinates()}
    
  </div>
`

mountHistogram();
mountPieChart();
mountParallelCoordinates();
