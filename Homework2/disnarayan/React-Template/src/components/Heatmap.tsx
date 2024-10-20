import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

interface VehicleData {
  odometer: number;
  sellingprice: number;
  condition: number;
}

export default function Heatmap() {
  const [data, setData] = useState<VehicleData[]>([]);
  const plotRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onResize = useDebounceCallback((size) => setSize(size), 200);

  useResizeObserver({ ref: plotRef, onResize });

  // Preprocess data by filtering out invalid rows
  const preprocessData = (csvData: any[]) => {
    return csvData
      .filter(d => d.odometer && d.sellingprice && d.condition)
      .map(d => ({
        odometer: +d.odometer,
        sellingprice: +d.sellingprice,
        condition: +d.condition
      }));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const csvData = await d3.csv('../../data/demo.csv', d => d);
        setData(preprocessData(csvData));
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (data.length > 0 && size.width > 0 && size.height > 0) {
      d3.select('#heatmap-svg').selectAll('*').remove();
      drawHeatmap();
    }
  }, [data, size]);

  function drawHeatmap() {
    const width = size.width;
    const height = size.height;
    const margin = { top: 40, right: 80, bottom: 70, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select('#heatmap-svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Set up scales for X (odometer) and Y (selling price)
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.odometer) as [number, number])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.sellingprice) as [number, number])
      .range([innerHeight, 0]);

    // Define the binning structure for the heatmap
    const xBinSize = 20; // Number of bins for odometer
    const yBinSize = 20; // Number of bins for selling price

    const xBins = d3.histogram()
      .domain(xScale.domain() as [number, number])
      .thresholds(xScale.ticks(xBinSize))(data.map(d => d.odometer));

    const yBins = d3.histogram()
      .domain(yScale.domain() as [number, number])
      .thresholds(yScale.ticks(yBinSize))(data.map(d => d.sellingprice));

    // Nest data into a 2D bin structure
    const bins: { x0: number, x1: number, y0: number, y1: number, condition: number[] }[] = [];

    xBins.forEach((xBin) => {
      yBins.forEach((yBin) => {
        const vehiclesInBin = data.filter(d =>
          d.odometer >= xBin.x0! && d.odometer <= xBin.x1! &&
          d.sellingprice >= yBin.x0! && d.sellingprice <= yBin.x1!
        );
        if (vehiclesInBin.length > 0) {
          bins.push({
            x0: xBin.x0!,
            x1: xBin.x1!,
            y0: yBin.x0!,
            y1: yBin.x1!,
            condition: vehiclesInBin.map(v => v.condition)
          });
        }
      });
    });

    // Color scale for condition (average condition in each bin)
    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn)
      .domain(d3.extent(data, d => d.condition) as [number, number]);

    // Draw the heatmap squares
    svg.selectAll('.heatmap-cell')
      .data(bins)
      .enter().append('rect')
      .attr('x', d => xScale(d.x0))
      .attr('y', d => yScale(d.y1)) // Note: Y-axis is inverted
      .attr('width', d => xScale(d.x1) - xScale(d.x0))
      .attr('height', d => yScale(d.y0) - yScale(d.y1))
      .attr('fill', d => colorScale(d3.mean(d.condition) || 0))
      .attr('stroke', 'black')
      .attr('stroke-width', 0.5);

    // Add x-axis
    svg.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(10).tickFormat(d3.format('~s')))
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 50)
      .attr('fill', 'black')
      .style('font-size', '12px')
      .style('text-anchor', 'middle')
      .text('Odometer (Mileage)');

    // Add y-axis
    svg.append('g')
      .call(d3.axisLeft(yScale).ticks(10).tickFormat(d3.format('~s')))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -50)
      .attr('fill', 'black')
      .style('font-size', '12px')
      .style('text-anchor', 'middle')
      .text('Selling Price');

    // Add color scale legend
    const legendHeight = 200;
    const legendWidth = 20;
    const legendSvg = svg.append('g')
      .attr('transform', `translate(${innerWidth + 40}, 20)`); // Moved further to the right

    const legendScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.condition) as [number, number])
      .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale).ticks(6);

    legendSvg.append('g')
      .attr('transform', `translate(${legendWidth}, 0)`)
      .call(legendAxis);

    const legendGradient = legendSvg.append('defs')
      .append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');

    legendGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', d3.interpolateRdYlGn(0));

    legendGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', d3.interpolateRdYlGn(1));

    legendSvg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)')
      .style('stroke', 'black')  // Add border for better visibility
      .style('stroke-width', '1px');

    // Add title
    svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .text('2D Heatmap: Odometer vs. Selling Price by Condition');
  }

  return (
    <div ref={plotRef} style={{ height: '500px', width: '100%' }}>
      <svg id="heatmap-svg" width="100%" height="100%"></svg>
    </div>
  );
}
