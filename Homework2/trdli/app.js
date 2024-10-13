import { TextMessage, Title } from './src/greetings';
import { VisualizeLayout_grid } from './src/VisualizeLayout';
import './style.css';

// You can manage your layout through CSS, or this template also has materialize library supported.
// Materialize: https://materializecss.com/getting-started.html

document.querySelector('#app').innerHTML = `
  <div id='main-container' class='d-flex flex-column flex-nowrap'>
  ${ Title }
  ${ TextMessage }
  ${ VisualizeLayout_grid }
  </div>
`;

mountBarChart();
mountCounter(document.querySelector('#counter-button'));
