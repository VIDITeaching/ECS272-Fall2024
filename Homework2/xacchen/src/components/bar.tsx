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

export default function BoxPlot() {
  const [bars, setBars] = useState<CategoricalBar[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 60, right: 40, bottom: 60, left: 100 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 400);

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

  // Function to aggregate the data into quartiles
  function aggregateData(data: CategoricalBar[]): { [key: string]: any[] } {
    const groupedData = d3.groups(data, d => d.gender, d => d.loan);

    const boxData: any[] = [];

    groupedData.forEach(([gender, loanGroups]) => {
      loanGroups.forEach(([loan, loans]) => {
        const amounts = loans.map(d => d.amount).sort(d3.ascending);
        const q1 = d3.quantile(amounts, 0.25) || 0;
        const median = d3.quantile(amounts, 0.5) || 0;
        const q3 = d3.quantile(amounts, 0.75) || 0;
        const min = amounts[0];
        const max = amounts[amounts.length - 1];
        boxData.push({ gender, loan, q1, median, q3, min, max });
      });
    });

    return boxData;
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
      .domain([0, d3.max(aggregatedData, d => d.max)!]).nice();

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

    // Create boxplots
    const boxWidth = x1.bandwidth() * 0.8;

    chartContainer.append('g')
      .selectAll('g')
      .data(genders)
      .join('g')
      .attr('transform', d => `translate(${x0(d)},0)`)
      .selectAll('rect')
      .data(gender => aggregatedData.filter(d => d.gender === gender))
      .join('g')
      .attr('transform', d => `translate(${x1(d.loan)}, 0)`)
      .call(g => {
        // Vertical line (min to max)
        g.append('line')
          .attr('x1', boxWidth / 2)
          .attr('x2', boxWidth / 2)
          .attr('y1', d => y(d.min))
          .attr('y2', d => y(d.max))
          .attr('stroke', 'black');

        // Box (q1 to q3) with different color per loan type
        g.append('rect')
          .attr('x', 0)
          .attr('y', d => y(d.q3))
          .attr('width', boxWidth)
          .attr('height', d => y(d.q1) - y(d.q3))
          .attr('fill', d => colorScale(d.loan));

        // Median line
        g.append('line')
          .attr('x1', 0)
          .attr('x2', boxWidth)
          .attr('y1', d => y(d.median))
          .attr('y2', d => y(d.median))
          .attr('stroke', 'black');
      });

    // Add title
    chartContainer.append('text')
      .attr('x', size.width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')  // Font size for title
      .style('font-weight', 'bold')
      .style('font-family', 'monospace')
      .text('Loan Amount Distribution by Gender and Loan Type');

    // Add x-axis label
    chartContainer.append('text')
      .attr('x', size.width - 40)
      .attr('y', size.height - margin.bottom + 30)  // Position below the x-axis
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')  // Font size for x-axis label
      .style('font-family', 'monospace')
      .text('Gender');

    // Add y-axis label
    chartContainer.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(size.height / 2))
      .attr('y', margin.left - 80)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-family', 'monospace')
      .text('Loan Amount');

    // Add Legend
    const legend = chartContainer.append('g')
      .attr('transform', `translate(${size.width - margin.right - 100}, ${margin.top})`);

    loanTypes.forEach((loanType, i) => {
      // Append legend rectangles
      legend.append('rect')
        .attr('x', 35)
        .attr('y', i * 30)  
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', colorScale(loanType));

      // Append legend text
      legend.append('text')
        .attr('x', 60)
        .attr('y', i * 30 + 9)  
        .attr('dy', '0.35em')
        .style('font-size', '14px')
        .style('font-family', 'monospace')
        .text(loanType);
    });
  }

  return (
    <>
      <div ref={barRef} className='chart-container'>
        <svg id='bar-svg' width='100%' height='100%' style={{minHeight: '400px'}}></svg>
      </div>
    </>
  );
}
