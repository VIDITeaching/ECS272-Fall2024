import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

interface DataType {
  EducationLevel: string;
  PaymentHistory: string;
  Income: number;
  RiskRating: string;
}

export default function ParallelCoordinatesPlot() {
  const scatterRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<DataType[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const margin = { top: 50, right: 60, bottom: 100, left: 60 }; // Increased bottom margin for axis labels
  const legendMargin = 20;
  const legendRectSize = 15;
  const onResize = useDebounceCallback((size) => setSize(size), 200);
  useResizeObserver({ ref: scatterRef, onResize });

  // Define income ranges
  const incomeRanges = [
    '< 20K',
    '20K - 50K',
    '50K - 100K',
    '100K - 200K',
    '> 200K',
  ];

  // Helper function to assign income to a range
  const assignIncomeToRange = (income: number) => {
    if (income < 20000) return '< 20K';
    if (income >= 20000 && income < 50000) return '20K - 50K';
    if (income >= 50000 && income < 100000) return '50K - 100K';
    if (income >= 100000 && income < 200000) return '100K - 200K';
    return '> 200K';
  };

  // Load the CSV data with a check for empty income values
  useEffect(() => {
    d3.csv('/data/financial_risk_assessment.csv', (d) => {
      const educationLevel = d['Education Level'];
      const paymentHistory = d['Payment History'];
      const income = d['Income'] && d['Income'].trim() !== '' ? +d['Income'] : NaN;  // Handle empty or whitespace income values
      const riskRating = d['Risk Rating'];

      // Filter out rows with invalid or missing values
      if (educationLevel && paymentHistory && !isNaN(income) && riskRating) {
        return {
          EducationLevel: educationLevel,
          PaymentHistory: paymentHistory,
          Income: assignIncomeToRange(income),  // Assign income to range
          RiskRating: riskRating,
        } as DataType;
      }
      return null;  // Filter out rows with invalid data
    }).then((loadedData) => {
      const validData = loadedData.filter((d) => d !== null) as DataType[];
      setData(validData);
    });
  }, []);

  // Initialize chart only if data is available
  useEffect(() => {
    if (data.length === 0 || size.width === 0 || size.height === 0) return;

    d3.select('#parallel-coordinates-svg').selectAll('*').remove();
    initChart();
  }, [data, size]);

  function initChart() {
    const svg = d3.select('#parallel-coordinates-svg')
      .attr('width', size.width)
      .attr('height', size.height);

    // Explicitly name the dimensions from left to right
    const dimensions = ['RiskRating', 'EducationLevel', 'PaymentHistory', 'Income'];
    const axisLabels = ['Risk Rating', 'Education', 'Payment History', 'Income'];
    
    const yScales: Record<string, d3.ScaleLinear<number, number> | d3.ScalePoint<string>> = {};

    // Create scales for each axis
    const categoricalVars = {
      EducationLevel: ['High School', "Bachelor's", "Master's", 'PhD'],
      PaymentHistory: ['Poor', 'Fair', 'Good', 'Excellent'],
      Income: incomeRanges,  // Use income ranges instead of continuous values
      RiskRating: ['Low', 'Medium', 'High'],
    };

    dimensions.forEach((dimension) => {
      yScales[dimension] = d3.scalePoint()
        .domain(categoricalVars[dimension as keyof typeof categoricalVars])
        .range([size.height - margin.bottom, margin.top]);
    });

    // Create the X scale for the dimensions
    const xScale = d3.scalePoint()
      .domain(dimensions)
      .range([margin.left, size.width - margin.right]);

    // Draw axes for each dimension
    dimensions.forEach((dimension, index) => {
      const axisGroup = svg.append('g')
        .attr('transform', `translate(${xScale(dimension)})`);

      axisGroup.call(d3.axisLeft(yScales[dimension] as any));

      // Add title to y-axis below the axis using the corresponding axisLabels array
      axisGroup.append('text')
        .attr('y', size.height - margin.bottom + 20)  // Adjusted value for better label positioning
        .attr('x', 0)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')  // Bold axis title
        .text(axisLabels[index]); // Use predefined axis labels
    });

    // Color scale for Risk Rating
    const colorScale = d3.scaleOrdinal()
      .domain(categoricalVars.RiskRating)
      .range(['#2ca02c', '#ff7f0e', '#d62728']);  // Low, Medium, High

    // Create distinct styles for lines based on RiskRating
    const lineStyles: Record<string, string> = {
      Low: '5,5',   // Dashed line for Low Risk
      Medium: '10,5', // Longer dashes for Medium Risk
      High: 'none',  // Solid line for High Risk
    };

    const lineWidths: Record<string, number> = {
      Low: 1,
      Medium: 1.5,
      High: 2,
    };

    // Draw lines colored and styled by Risk Rating
    svg.append('g')
      .selectAll('path')
      .data(data)
      .enter().append('path')
      .attr('d', (d) => d3.line()(
        dimensions.map((p) => [xScale(p)!, yScales[p](d[p as keyof DataType])!])
      ))
      .attr('fill', 'none')
      .attr('stroke', (d) => colorScale(d.RiskRating))
      .attr('stroke-width', (d) => lineWidths[d.RiskRating])
      .attr('stroke-dasharray', (d) => lineStyles[d.RiskRating]);  // Apply distinct dash patterns

    // Create a legend
    const legendGroup = svg.append('g')
      .attr('transform', `translate(${size.width - margin.right}, ${margin.top})`);  // Place on the right side

    // Add legend title
    legendGroup.append('text')
      .attr('x', -30)
      .attr('y', -legendRectSize - 5)
      .attr('text-anchor', 'start')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Risk Rating');

    // Draw legend items
    const legend = legendGroup.selectAll('.legend-item')
      .data(categoricalVars.RiskRating)
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * (legendRectSize + legendMargin)})`);

    // Add colored rectangles for legend
    legend.append('rect')
      .attr('x', 0)
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)
      .attr('fill', (d) => colorScale(d));

    // Add legend labels
    legend.append('text')
      .attr('x', legendRectSize + 5)
      .attr('y', legendRectSize / 2)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .text((d) => d);
  }

  return (
    <div ref={scatterRef} className="chart-container" style={{ width: '100%', height: '600px' }}>
      <svg id="parallel-coordinates-svg"></svg>
    </div>
  );
}
