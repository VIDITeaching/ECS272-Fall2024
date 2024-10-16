import { Graph1_OverallView, Graph2_DetailView, Graph3_DetailView, mountChart1, mountChart2, mountChart3 } from './src/VisualizeLayout';
import './style.css';

// You can manage your layout through CSS, or this template also has materialize library supported.
// Materialize: https://materializecss.com/getting-started.html

document.querySelector('#app').innerHTML = `
  <div id='main-container' class='d-flex flex-column flex-nowrap' style='min-height: 100vh;'>
    <div class='Greeting_div'>
        <h1>Car Price Visualization</h1>
        <i> The ultimate guide to buy a car </i>
    </div>
    <br>
      <div class="grid-container">
        <div class="left-side">${ Graph1_OverallView() }</div>
        <div class="right-top">${ Graph2_DetailView() }</div>
        <div class="right-bottom">${ Graph3_DetailView() }</div>
      </div>
    <br>
    <div class='mt-auto'>
  <footer class="footer">
    <span class="text-muted"> &copy 2024 Hengyi Li. All rights reserved</span>
    <span class="text-muted"> | </span>
    <span class="text-muted"> <a href="https://github.com/TheRealMilesLee" target="_blank">GitHub</a> </span>
    <span class="text-muted"> | </span>
    <span class="text-muted"> <a href="https://www.linkedin.com/in/hengyi-li-968744191/?locale=en_US" target="_blank">LinkedIn</a> </span>
  </footer>
</div>
  </div>
`;

mountChart1();
mountChart2();
mountChart3();

