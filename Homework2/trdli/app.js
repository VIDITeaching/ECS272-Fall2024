import { Title } from './src/greetings';
import { Graph1_OverallView, Graph2_DetailView, Graph3_DetailView, mountChart1, mountChart2, mountChart3 } from './src/VisualizeLayout';
import { footer_layout } from './src/footer';
import './style.css';

// You can manage your layout through CSS, or this template also has materialize library supported.
// Materialize: https://materializecss.com/getting-started.html

document.querySelector('#app').innerHTML = `
  <div id='main-container' class='d-flex flex-column flex-nowrap' style='min-height: 100vh;'>
    ${ Title }
    <br>
      <div class="grid-container">
        <div class="left-side">${ Graph1_OverallView() }</div>
        <div class="right-top">${ Graph2_DetailView() }</div>
        <div class="right-bottom">${ Graph3_DetailView() }</div>
      </div>
    <br>
    ${ footer_layout }
  </div>
`;

mountChart1();
mountChart2();
mountChart3();

