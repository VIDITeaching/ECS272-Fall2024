import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

// Define the interface for your data
interface CategoricalBar {
  gender: string;
  loan: string;
  amount: number;
}

// Interface for component size and margin
interface ComponentSize {
  width: number;
  height: number;
}

interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export default function BarChart() {
  const [bars, setBars] = useState<CategoricalBar[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 60, right: 40, bottom: 60, left: 100 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);

  useResizeObserver({ ref: barRef, onResize });

  useEffect(() => {
    // For reading csv file
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/financial_risk_assessment.csv', d => ({
          gender: d.Gender,
          loan: d['Loan Purpose'],
          amount: +d['Loan Amount']
        }));
        setBars(csvData as CategoricalBar[]);
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
  }, [bars, size]);

  // Function to aggregate the data and calculate the average loan amount
  function aggregateData(data: CategoricalBar[]): { [key: string]: CategoricalBar[] } {
    const groupedData = d3.groups(data, d => d.gender, d => d.loan);

    const averages: CategoricalBar[] = [];

    groupedData.forEach(([gender, loanGroups]) => {
      loanGroups.forEach(([loan, loans]) => {
        const avgAmount = d3.mean(loans, d => d.amount) || 0;  // Calculate average
        averages.push({ gender, loan, amount: avgAmount });
      });
    });

    return averages;
  }

  function initChart() {
    const chartContainer = d3.select('#bar-svg');
    const aggregatedData = aggregateData(bars);
  
    const genders = [...new Set(aggregatedData.map(d => d.gender))];
    const loanTypes = [...new Set(aggregatedData.map(d => d.loan))];
  
    // Color scale for different loan purposes
    const colorScale = d3.scaleOrdinal()
      .domain(loanTypes)
      .range(['#5dade2', '#ec7063', '#58d68d', '#f7dc6f']);  // Custom colors
  
    // X-axis for gender groups
    const x0 = d3.scaleBand()
      .range([margin.left, size.width - margin.right])
      .domain(genders)
      .padding(0.2);
  
    // X-axis for loan types within each gender group
    const x1 = d3.scaleBand()
      .range([0, x0.bandwidth()])
      .domain(loanTypes)
      .padding(0.1);
  
    // Y-axis for the loan amount
    const y = d3.scaleLinear()
      .range([size.height - margin.bottom, margin.top])
      .domain([0, d3.max(aggregatedData, d => d.amount)!]).nice();
  
    // Append x-axis
    chartContainer.append('g')
      .attr('transform', `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(x0))
      .selectAll('text')
      .style('font-size', '14px')
      .style('font-family', 'monospace');  // Increase font size for x-axis labels
  
    // Append y-axis
    chartContainer.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('font-size', '14px')
      .style('font-family', 'monospace');  // Increase font size for y-axis labels
  
    // Create bars
    chartContainer.append('g')
      .selectAll('g')
      .data(genders)
      .join('g')
      .attr('transform', d => `translate(${x0(d)},0)`)
      .selectAll('rect')
      .data(gender => aggregatedData.filter(d => d.gender === gender))
      .join('rect')
      .attr('x', d => x1(d.loan)!)
      .attr('y', d => y(d.amount))
      .attr('width', x1.bandwidth())
      .attr('height', d => y(0) - y(d.amount))
      .attr('fill', d => colorScale(d.loan));
  
    // Add labels for loan types
    chartContainer.append('g')
      .selectAll('text')
      .data(aggregatedData)
      .join('text')
      .attr('x', d => x0(d.gender)! + x1(d.loan)! + x1.bandwidth() / 2)
      .attr('y', d => y(d.amount) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-family', 'monospace')  // Font size for bar value labels
      .text(d => d.amount.toFixed(2));
  
    // Add title
    chartContainer.append('text')
      .attr('x', size.width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')  // Font size for title
      .style('font-weight', 'bold')
      .style('font-family', 'monospace')
      .text('Average Loan Amount by Gender and Loan Type');
  
    // Add x-axis label
    chartContainer.append('text')
      .attr('x', size.width / 2)
      .attr('y', size.height - margin.bottom + 40)  // Position below the x-axis
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')  // Font size for x-axis label
      .style('font-family', 'monospace')
      .text('Gender');
  
    // Add y-axis label
    chartContainer.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(size.height / 2))
      .attr('y', margin.left - 80)  // Position to the left of the y-axis
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')  // Font size for y-axis label
      .style('font-family', 'monospace')
      .text('Average Loan Amount');

      // Add Legend
    const legend = chartContainer.append('g')
    .attr('transform', `translate(${size.width - margin.right - 100}, ${margin.top})`);  // Position the legend

    loanTypes.forEach((loanType, i) => {
    // Append legend rectangles
    legend.append('rect')
        .attr('x', 35)
        .attr('y', i * 30)  // Space each legend item by 20px
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', colorScale(loanType));

    // Append legend text
    legend.append('text')
        .attr('x', 60)
        .attr('y', i * 30 + 9)  // Position the text vertically aligned with the rectangles
        .attr('dy', '0.35em')
        .style('font-size', '14px')
        .style('font-family', 'monospace')
        .text(loanType);
    });
  }
  

  return (
    <>
      <div ref={barRef} className='chart-container'>
        <svg id='bar-svg' width='100%' height='100%'></svg>
      </div>
    </>
  );
}
