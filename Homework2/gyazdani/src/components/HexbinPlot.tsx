import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { hexbin as d3Hexbin, HexbinBin } from 'd3-hexbin';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

interface DataType {
  CreditScore: number;
  Income: number;
  RiskRating: string;
  DebtToIncomeRatio: number;
}

// Extend the HexbinBin interface to include avgDebtToIncomeRatio
interface ExtendedHexbinBin extends HexbinBin<DataType> {
  avgDebtToIncomeRatio: number;
}

export default function HexbinPlot() {
  const scatterRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<DataType[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const margin = { top: 80, right: 60, bottom: 120, left: 80 };  // Increased bottom margin to accommodate legend
  const onResize = useDebounceCallback((size) => setSize(size), 200);
  useResizeObserver({ ref: scatterRef, onResize });

  // Load the CSV data
  useEffect(() => {
    d3.csv('/data/financial_risk_assessment.csv', (d) => {
      const creditScore = +d['Credit Score'];
      const income = +d['Income'];
      const riskRating = d['Risk Rating'];
      const debtToIncomeRatio = +d['Debt-to-Income Ratio'];

      if (
        !isNaN(creditScore) &&
        !isNaN(income) &&
        !isNaN(debtToIncomeRatio) &&
        creditScore >= 600 &&
        creditScore <= 800 &&
        income > 0 &&
        riskRating
      ) {
        return {
          CreditScore: creditScore,
          Income: income,
          RiskRating: riskRating,
          DebtToIncomeRatio: debtToIncomeRatio,
        } as DataType;
      }
      return null;
    }).then((loadedData) => {
      const validData = loadedData.filter((d) => d !== null) as DataType[];
      setData(validData);
    });
  }, []);

  // Initialize chart only if data is available
  useEffect(() => {
    if (data.length === 0 || size.width === 0 || size.height === 0) return;

    d3.select('#hexbin-svg').selectAll('*').remove();
    initChart();
  }, [data, size]);

  function initChart() {
    const svg = d3.select('#hexbin-svg')
      .attr('width', size.width)
      .attr('height', size.height);

    const xScale = d3.scaleLinear()
      .domain([600, 800])
      .range([margin.left, size.width - margin.right]);

    const yMin = d3.min(data, (d) => d.Income)!;
    const yMax = d3.max(data, (d) => d.Income)!;
    const yBuffer = (yMax - yMin) * 0.05;

    const yScale = d3.scaleLinear()
      .domain([yMin - yBuffer, yMax + yBuffer])
      .range([size.height - margin.bottom, margin.top]);

    // Create a hexbin generator using d3Hexbin
    const hexbinGenerator = d3Hexbin<DataType>()
      .x((d) => xScale(d.CreditScore))
      .y((d) => yScale(d.Income))
      .radius(10)
      .extent([
        [margin.left, margin.top],
        [size.width - margin.right, size.height - margin.bottom],
      ]);

    // Cast bins to ExtendedHexbinBin[]
    const bins = hexbinGenerator(data) as ExtendedHexbinBin[];

    // Calculate the average Debt-to-Income Ratio for each bin
    bins.forEach((bin) => {
      bin.avgDebtToIncomeRatio = d3.mean(bin, (d) => d.DebtToIncomeRatio)!;
    });

    // Create a grayscale color scale based on the average Debt-to-Income Ratio
    const minRatio = d3.min(bins, (bin) => bin.avgDebtToIncomeRatio)!;
    const maxRatio = d3.max(bins, (bin) => bin.avgDebtToIncomeRatio)!;

    const colorScale = d3.scaleSequential(d3.interpolateGreys)
      .domain([minRatio, maxRatio]);  // Grayscale

    // Draw the hexagons
    svg.append('g')
      .selectAll('path')
      .data(bins)
      .enter().append('path')
      .attr('d', (d) => hexbinGenerator.hexagon())
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .attr('fill', (d) => colorScale(d.avgDebtToIncomeRatio))
      .attr('stroke', 'white')
      .attr('stroke-width', 0.5);

    // Add X-axis
    svg.append('g')
      .attr('transform', `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    // Add Y-axis
    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));

    // Add X-axis label
    svg.append('text')
      .attr('x', size.width / 2)
      .attr('y', size.height - margin.bottom + 40)  // Adjusted to allow room for legend
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Credit Score');

    // Add Y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -size.height / 2)
      .attr('y', margin.left - 60)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Income');

    // Add chart title
    svg.append('text')
      .attr('x', size.width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text('Credit Score vs. Income Hexbin Plot');

    // Adjust legend position to below X-axis
    const legendWidth = 300;
    const legendHeight = 10;

    const legendGroup = svg.append('g')
      .attr('transform', `translate(${(size.width - legendWidth) / 2}, ${size.height - margin.bottom + 70})`);  // Positioned below X-axis

    // Create gradient for legend
    const defs = svg.append('defs');
    defs.append('linearGradient')
      .attr('id', 'legend-gradient')
      .selectAll('stop')
      .data([
        { offset: '0%', color: colorScale(minRatio) },
        { offset: '100%', color: colorScale(maxRatio) }
      ])
      .enter().append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color);

    // Draw legend rectangle
    legendGroup.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)');

    // Create scale for legend axis
    const legendScale = d3.scaleLinear()
      .domain([minRatio, maxRatio])
      .range([0, legendWidth]);

    // Add legend axis
    legendGroup.append('g')
      .attr('transform', `translate(0, ${legendHeight})`)
      .call(d3.axisBottom(legendScale).ticks(5).tickFormat(d3.format(".2f")));

    // Add legend title below legend rectangle
    legendGroup.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', legendHeight + 30)  // Adjusted position below the rectangle
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Average Debt-to-Income Ratio');
  }

  return (
    <div ref={scatterRef} className="chart-container" style={{ width: '100%', height: '600px' }}>
      <svg id="hexbin-svg"></svg>
    </div>
  );
}
