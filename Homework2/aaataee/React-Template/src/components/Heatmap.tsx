import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ComponentSize, Margin, VehicleData } from '../types';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { isEmpty } from 'lodash';


// Helper function to calculate correlation
const calculateCorrelation = (x: number[], y: number[]): number => {
  const n = x.length;
  const meanX = d3.mean(x) || 0;
  const meanY = d3.mean(y) || 0;
  const numerator = d3.sum(x.map((xi, i) => (xi - meanX) * (y[i] - meanY)));
  const denominator = Math.sqrt(
    d3.sum(x.map(xi => Math.pow(xi - meanX, 2))) *
    d3.sum(y.map(yi => Math.pow(yi - meanY, 2)))
  );
  return denominator === 0 ? 0 : numerator / denominator;
};

interface HeatmapData extends VehicleData {
  mmr: number;
  condition: number;
  odometer: number;
}

const Heatmap: React.FC = () => {
  const svgRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<HeatmapData[]>([]);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)

  useResizeObserver({ ref: svgRef, onResize });

  // Load CSV data asynchronously
  useEffect(() => {
    const loadData = async () => {
      try {
        const csvData = await d3.csv('/data/car_prices.csv', d => ({
          mmr: +d['mmr'],
          year: +d['year'],
          condition: +d['condition'],
          odometer: +d['odometer'],
          sellingprice: +d['sellingprice']
        }));

        const filteredData = csvData.filter(
          d =>
            d.mmr > 0 &&
            d.year > 0 &&
            d.condition > 0 &&
            d.odometer > 0 &&
            d.sellingprice > 0
        ) as HeatmapData[];

        setData(filteredData);
      } catch (error) {
        console.error('Error loading CSV file:', error);
      }
    };

    loadData();
  }, []);

  // Draw heatmap when data is loaded
  useEffect(() => {
    if (isEmpty(data)) return;
    if (size.width === 0 || size.height === 0) return;

    const margin: Margin = { top: 100, right: 80, bottom: 50, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    
    const variables = ['year', 'condition', 'odometer', 'mmr', 'sellingprice'];
    const n = variables.length;

    // Clear previous SVG content
    d3.select('#heatmap-svg').selectAll('*').remove();

    // Create scales
    const xScale = d3.scaleBand()
      .domain(variables)
      .range([0, size.width])
      .padding(0.01)

    const yScale = d3.scaleBand()
      .domain(variables)
      .range([0, height])
      .padding(0.01);
    const colorScalePositive = d3.scaleSequential(d3.interpolateReds).domain([0, 1]);
    const colorScaleNegative = d3.scaleSequential(d3.interpolateReds).domain([0, -1]);

    // Calculate correlation matrix
    const correlationMatrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      correlationMatrix[i] = [];
      for (let j = 0; j < n; j++) {
        const x = data.map(d => d[variables[i] as keyof HeatmapData]);
        const y = data.map(d => d[variables[j] as keyof HeatmapData]);
        correlationMatrix[i][j] = calculateCorrelation(x, y);
      }
    }

    // Create SVG container
    const svg = d3.select('#heatmap-svg')
      .attr('width', size.width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Draw cells for heatmap
    svg.selectAll()
      .data(correlationMatrix.flat())
      .enter()
      .append('rect')
      .attr('x', (_, i) => xScale(variables[i % n])!)
      .attr('y', (_, i) => yScale(variables[Math.floor(i / n)])!)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .style('fill', d => d >= 0 ? colorScalePositive(d): colorScaleNegative(d));

    // Add correlation values on the cells
    svg.selectAll()
      .data(correlationMatrix.flat())
      .enter()
      .append('text')
      .attr('x', (_, i) => xScale(variables[i % n])! + xScale.bandwidth() / 2)
      .attr('y', (_, i) => yScale(variables[Math.floor(i / n)])! + yScale.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .style('fill', 'black')
      .text(d => d.toFixed(2));

    // Add X and Y axes labels
    svg.append('g')
      .call(d3.axisTop(xScale))
      .selectAll('text')
      .style('text-anchor', 'start')
      .attr('transform', 'rotate(-45)');

    svg.append('g')
      .call(d3.axisLeft(yScale));

    // Add title
    svg.append('text')
    .attr('x', size.width / 2)
    .attr('y', -margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .text('Correlation Heatmap');

  }, [data, size]);

  return (
    <>
      <div ref={svgRef} className='chart-container'>
        <svg id='heatmap-svg' width='100%' height='50%'></svg>
      </div>
    </>
  )
};

export default Heatmap;
