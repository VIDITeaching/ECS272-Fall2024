import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { isEmpty } from 'lodash';
import { Bar, ComponentSize, Margin } from '../types';

// Define the MedalCountBar interface
interface MedalCountBar extends Bar {
  country: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number; // Include the total medals
}

interface BarChartProps {
  onBarClick?: (country: string) => void;
}

export default function BarChart({ onBarClick }: BarChartProps) {
  const [bars, setBars] = useState<MedalCountBar[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]); // State for selected countries
  const barRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 40, right: 20, bottom: 195, left: 100 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);
  useResizeObserver({ ref: barRef, onResize });

  useEffect(() => {
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv<MedalCountBar>('/data/olymic/medals_total.csv', d => ({
          country: d.country,
          gold: +d.Gold_Medal,
          silver: +d.Silver_Medal,
          bronze: +d.Bronze_Medal,
          total: +d.Total
        }));
        setBars(csvData);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };
    dataFromCSV();
  }, []);

  useEffect(() => {
    if (isEmpty(bars)) return;
    if (size.width === 0 || size.height === 0) return;
    d3.select('#bar-svg').selectAll('*').remove();
    initChart();
  }, [bars, size, selectedCountries]);

  function initChart() {
    let chartContainer = d3.select('#bar-svg');
  
    let xExtents = d3.extent(bars.map((d: MedalCountBar) => d.total as number)) as [number, number];
    let yCategories: string[] = [...new Set(bars.map((d: MedalCountBar) => d.country as string))];
  
    // Update xScale
    let xScale = d3.scaleLinear()
      .range([margin.left, size.width - margin.right])
      .domain([0, xExtents[1]]);
  
    // Update yScale
    let yScale = d3.scaleBand()
      .rangeRound([margin.top, size.height - margin.bottom])
      .domain(yCategories)
      .padding(0.1);
  
    // Create axes
    chartContainer.append('g')
      .attr('transform', `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(xScale));
  
    chartContainer.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));
  
    // Labels
    chartContainer.append('g')
      .attr('transform', `translate(${margin.left / 2}, ${size.height / 2}) rotate(-90)`)
      .append('text')
      .text('Country')
      .style('font-size', '.8rem');
  
    chartContainer.append('g')
      .attr('transform', `translate(${(size.width - margin.left) / 2}, ${size.height - margin.top + 40})`)
      .append('text')
      .text('Total')
      .style('font-size', '.8rem');
  
    // Stack the data
    const stack = d3.stack<MedalCountBar>()
      .keys(['gold', 'silver', 'bronze'])
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);
  
    const stackedData = stack(bars);
  
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['gold', 'silver', 'bronze'])
      .range(['#FFD700', '#C0C0C0', '#CD7F32']);
  
    // Draw bars
    const barsGroup = chartContainer
      .selectAll('g.country')
      .data(bars) // Use bars directly for groups
      .enter()
      .append('g')
      .attr('class', 'country')
      .attr('transform', d => `translate(0, ${yScale(d.country)})`); // Position the group based on the country
  
    // Draw the stacked rectangles
    barsGroup.selectAll('rect')
      .data(d => stack([d])) // Create a new stack for each country
      .enter()
      .append('rect')
      .attr('x', d => xScale(d[0][0]) + 2) // Positioning the rects
      .attr('width', d => xScale(d[0][1]) - xScale(d[0][0])) // Width of each medal stack
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.key))
      .on('click', (event, d) => {
        const country = d[0].data.country; // Get the country name
        onBarClick(country);
        
        // Toggle the highlighted class for the entire group
        const countryGroup = d3.select(event.currentTarget.parentNode); // Select the parent group
        const isHighlighted = countryGroup.classed('highlighted-bar'); // Check if it is highlighted
        countryGroup.classed('highlighted-bar', !isHighlighted); // Toggle highlight
  
        // // Update selectedCountries state
        // if (isHighlighted) {
        //   setSelectedCountries(prev => prev.filter(c => c !== country)); // Remove country from selection
        // } else {
        //   setSelectedCountries(prev => [...prev, country]); // Add country to selection
        // }
      });
  
    // Title
    chartContainer.append('g')
      .append('text')
      .attr('transform', `translate(${size.width / 2}, ${margin.top - 20})`)
      .style('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .text('Distribution of Medals Data');
  }
  
  

  return (
    <div ref={barRef} className='chart-container'>
      <svg id='bar-svg' width='100%' height='1000'></svg>
    </div>
  );
}
