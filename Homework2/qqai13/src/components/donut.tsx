import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { ComponentSize, Margin } from '../types';

// FinancialData interface with gender and education
interface FinancialData {
  gender: string;
  education: string;
}

// Aggregated data to show proportions
interface GenderData {
  gender: string;
  count: number;
}

interface EducationData {
  education: string;
  count: number;
}

export default function DonutChart() {
  const [data, setData] = useState<FinancialData[]>([]);
  const [genderData, setGenderData] = useState<GenderData[]>([]);
  const [eduData, setEduData] = useState<EducationData[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Set a static size for the chart
  const size: ComponentSize = { width: 500, height: 500 };
  const margin: Margin = { top: 40, right: 20, bottom: 80, left: 60 };

  // Load and process the data
  useEffect(() => {
    // For reading csv file
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/financial_risk_assessment.csv', d => {
          // This callback allows you to rename the keys, format values, and drop columns you don't need
          return {gender: d.Gender, education: d['Education Level']};
        });
        setData(csvData);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    } 
    dataFromCSV();
  }, []);

  // Aggregate data by gender and education
  useEffect(() => {
    if (isEmpty(data)) return;

    // Group by gender and count occurrences
    const genderCount = d3.rollups(
      data,
      v => v.length,
      d => d.gender
    ).map(([gender, count]) => ({ gender, count }));

    setGenderData(genderCount);

    // Group by education and count occurrences
    const eduCount = d3.rollups(
      data,
      v => v.length,
      d => d.education
    ).map(([education, count]) => ({ education, count }));

    setEduData(eduCount);
  }, [data]);

  useEffect(() => {
    if (isEmpty(genderData)) return;
    d3.select('#donut-svg').selectAll('*').remove(); // Clear previous chart
    initDonutChart_1(); // Initialize the gender donut chart
    initDonutChart_2(); // Initialize the education donut chart
  }, [genderData, eduData]);

  // Gender Donut Chart (Outer)
  function initDonutChart_1() {
    const svg = d3
      .select('#donut-svg')
      .attr('width', size.width)
      .attr('height', size.height)
      .append('g')
      .attr('transform', `translate(${size.width / 2},${size.height / 2})`);

    const outerRadius = Math.min(size.width, size.height) / 2 - margin.top;

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const pie = d3
      .pie<GenderData>()
      .value(d => d.count)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<GenderData>>()
      .innerRadius(outerRadius / 2) // Inner radius for the "donut" hole
      .outerRadius(outerRadius);

    const arcLabel = d3
      .arc<d3.PieArcDatum<GenderData>>()
      .innerRadius(outerRadius * 0.8) // Distance from center for the label lines
      .outerRadius(outerRadius * 0.8);

    const arcs = svg
      .selectAll('g.arc')
      .data(pie(genderData))
      .enter()
      .append('g')
      .attr('class', 'arc');

    // Draw the donut slices
    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.gender));

    // Add label lines
    arcs
      .append('line')
      .attr('x1', d => arc.centroid(d)[0])
      .attr('y1', d => arc.centroid(d)[1])
      .attr('x2', d => arcLabel.centroid(d)[0])
      .attr('y2', d => arcLabel.centroid(d)[1])
      .attr('stroke', 'black')
      .attr('stroke-width', 1);

    // Add labels outside the chart
    arcs
      .append('text')
      .attr('transform', d => {
        const pos = arcLabel.centroid(d);
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        pos[0] = outerRadius * (midAngle < Math.PI ? 1.1 : -1.1); // Adjust the x position depending on which side of the chart
        return `translate(${pos})`;
      })
      .attr('dy', '0.35em')
      .style('text-anchor', d => (d.startAngle + d.endAngle) / 2 < Math.PI ? 'start' : 'end') // Text anchor based on location
      .text(d => `${d.data.gender} (${d.data.count})`);

    // Add title to the chart
    svg
      .append('text')
      .attr('x', 0)
      .attr('y', 0 - (size.height / 2) + margin.top - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Gender Proportion in Data');
  }

  // Education Donut Chart (Inner)
  function initDonutChart_2() {
    const svg = d3.select('#donut-svg g'); // Reuse the same svg as above (inside the outer donut chart)

    const innerRadius = Math.min(size.width, size.height) / 4 - margin.top;
    const outerRadius = Math.min(size.width, size.height) / 2 - margin.top;

    const color = d3.scaleOrdinal(d3.schemeSet3);

    const pie = d3
      .pie<EducationData>()
      .value(d => d.count)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<EducationData>>()
      .innerRadius(30) // This will create a smaller full pie chart (no donut hole)
      .outerRadius(innerRadius);

    const arcs = svg
      .selectAll('g.inner-arc')
      .data(pie(eduData))
      .enter()
      .append('g')
      .attr('class', 'inner-arc');

    // Draw the inner donut slices
    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.education));

    // Add labels to the slices
    arcs
      .append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .text(d => `${d.data.education} (${d.data.count})`);
  }

  return (
    <>
      <div ref={chartRef} className='chart-container'>
        <svg id='donut-svg' width='800px' height='800px'></svg>
      </div>
    </>
  );
}
