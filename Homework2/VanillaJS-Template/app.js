import { mountBarChart, BarChart } from './src/Example'
import { Notes, mountCounter } from './src/notes';
import './style.css'

// You can manage your layout through CSS, or this template also has materialize library supported.
// Materialize: https://materializecss.com/getting-started.html

document.querySelector('#app').innerHTML = `
  <div id='main-container' class='d-flex flex-column flex-nowrap'>
    ${BarChart()}
    ${Notes("This is a message sent from app.js")}
  </div>
`

mountBarChart();
mountCounter(document.querySelector('#counter-button'));