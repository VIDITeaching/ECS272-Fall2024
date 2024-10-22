import { createContext } from 'react';
import { DataRow } from '../types';

const DataContext = createContext<DataRow[]>([]);
export default DataContext;