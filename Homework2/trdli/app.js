import { Title } from './src/greetings';
import { VisualizeLayout_grid, mountChart1, Graph1_Detail, Graph2_Detail_explaination, Graph3_Detail_explaionation } from './src/VisualizeLayout';
import { footer_layout } from './src/footer';
import './style.css';

// You can manage your layout through CSS, or this template also has materialize library supported.
// Materialize: https://materializecss.com/getting-started.html

document.querySelector('#app').innerHTML = `
  <div id='main-container' class='d-flex flex-column flex-nowrap' style='min-height: 100vh;'>
    ${ Title }
    ${ VisualizeLayout_grid }
    ${ Graph1_Detail }
    ${ Graph2_Detail_explaination }
    ${ Graph3_Detail_explaionation }
    ${ footer_layout }
  </div>
`;

mountChart1();

