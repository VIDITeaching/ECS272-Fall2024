import React from 'react'
import { useEffect, useState, useContext, useRef } from 'react';
import * as d3 from 'd3';
import dataFromJson from '../../data/demo.json';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import DataContext from '../stores/DataContext.js';

import { Bar, ComponentSize, Margin } from '../types.js';
// A "extends" B means A inherits the properties and methods from B.
interface CategoricalBar extends Bar{
  category: string;
}

export default function Viz1() {
  const data = useContext(DataContext);
  // console.log("logging data from viz1:", data);

  return (
    <>
      <p>{data.length} rows in data.</p>
    </>
  )
}
