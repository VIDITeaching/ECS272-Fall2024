import { createContext } from 'react';

const SelectedDataContext = createContext({
  selectedNodes: [],
  selectedCols: [],
});
export default SelectedDataContext;