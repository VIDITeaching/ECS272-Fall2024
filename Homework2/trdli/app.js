import { Graph1_OverallView, Graph2_DetailView, Graph3_DetailView, mountChart1, mountChart2, mountChart3 } from './src/VisualizeLayout';
import './style.css';

// You can manage your layout through CSS, or this template also has materialize library supported.
// Materialize: https://materializecss.com/getting-started.html

document.querySelector('#MainBody').innerHTML = `
  <div class="grid-container">
    <div class="row1 fade-in">${ Graph1_OverallView() }</div>
    <br>
    <div class="row2-left fade-in">${ Graph2_DetailView() }</div>
    <br>
    <div class="row2-right fade-in">${ Graph3_DetailView() }</div>
    <br>
  </div>
`;

mountChart1();
mountChart2();
mountChart3();

