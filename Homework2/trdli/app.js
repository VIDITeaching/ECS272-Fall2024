import { Title } from './src/greetings';
import { VisualizeLayout_grid, mountChart1 } from './src/VisualizeLayout';
import './style.css';

// You can manage your layout through CSS, or this template also has materialize library supported.
// Materialize: https://materializecss.com/getting-started.html

document.querySelector('#app').innerHTML = `
  <div id='main-container' class='d-flex flex-column flex-nowrap'>
  ${ Title }
  ${ VisualizeLayout_grid }
  </div>
`;

mountChart1();

