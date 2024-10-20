import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';

// FinancialData interface with gender and education
interface FinancialData {
  gender: string;
  education: string;
  loan: string;
}

// Aggregated data to show proportions
interface GenderData {
  gender: string;
  count: number;
  proportion: number;
}

interface EducationData {
  education: string;
  count: number;
  proportion: number;
}

interface LoanData {
  loan: string;
  count: number;
  proportion: number;
}

export default function DonutChart() {
  const [data, setData] = useState<FinancialData[]>([]);
  const [genderData, setGenderData] = useState<GenderData[]>([]);
  const [eduData, setEduData] = useState<EducationData[]>([]);
  const [loanData, setLoanData] = useState<LoanData[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);

  // Set dynamic size for the chart
  const margin = { top: 100, right: 100, bottom: 100, left: 100 };

  // Resize chart based on the parent container's width
  const [size, setSize] = useState({ width: 600, height: 600 });

  // Function to update chart size dynamically
  const updateSize = () => {
    if (chartRef.current) {
      const width = chartRef.current.offsetWidth;
      const height = width; // You can adjust this ratio if you want a different aspect ratio
      setSize({ width, height });
    }
  };

  useEffect(() => {
    // Call this function on initial render
    updateSize();
    // Update size whenever the window resizes
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const csvData = await d3.csv('../../data/financial_risk_assessment.csv', d => ({
          gender: d.Gender,
          education: d['Education Level'],
          loan: d['Loan Purpose'],
        }));

        setData(csvData as FinancialData[]);

        const totalCount = csvData.length;

        // Gender data
        const genderCount = d3.rollups(
          csvData,
          v => v.length,
          d => d.gender
        ).map(([gender, count]) => ({
          gender,
          count,
          proportion: (count / totalCount) * 100
        }));
        setGenderData(genderCount);

        // Education data
        const eduCount = d3.rollups(
          csvData,
          v => v.length,
          d => d.education
        ).map(([education, count]) => ({
          education,
          count,
          proportion: (count / totalCount) * 100
        }));
        setEduData(eduCount);

        // Loan data
        const loanCount = d3.rollups(
          csvData,
          v => v.length,
          d => d.loan
        ).map(([loan, count]) => ({
          loan,
          count,
          proportion: (count / totalCount) * 100
        }));
        setLoanData(loanCount);
      } catch (error) {
        console.error('Error fetching or processing data:', error);
      }
    };

    fetchData();
  }, []);


  useEffect(() => {
    if (isEmpty(genderData)) return;
    d3.select('#donut-svg').selectAll('*').remove(); // Clear previous chart
    initDonutChart_1(); // Initialize the gender donut chart
    // initDonutChart_2(); // Initialize the education donut chart
    initDonutChart_3(); // Initialize the loan donut chart
  }, [genderData, eduData, loanData, size]);

  // Gender Donut Chart (Outer)
  function initDonutChart_1() {
    const svg = d3
      .select('#donut-svg')
      .attr('viewBox', `0 0 ${size.width} ${size.height}`)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .append('g')
      .attr('transform', `translate(${size.width / 2},${size.height / 2})`);

    const outerRadius = Math.min(size.width, size.height) / 1.5 - margin.top;
    const customColors = ['#5dade2', '#ec7063', '#f9e79f'];
    const color = d3.scaleOrdinal(customColors);

    const pie = d3.pie<GenderData>()
      .value(d => d.count)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<GenderData>>()
      .innerRadius(outerRadius / 1.3)
      .outerRadius(outerRadius);

    const arcs = svg
      .selectAll('g.arc')
      .data(pie(genderData))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.gender));

    arcs
      .append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('dy', '0.1em')
      .style('text-anchor', d => (d.startAngle + d.endAngle) / 2 < Math.PI ? 'start' : 'end')
      .style('font-family', 'Arial')
      .text(d => `${d.data.gender} (${d.data.count})`);

    svg
      .append('text')
      .attr('x', 0)
      .attr('y', 0 - (size.height / 2) + margin.top - 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('font-family', 'Arial')
      .text('Financial Purpose Proportion Data');
  }

  // Education Donut Chart (Middle)
  function initDonutChart_2() {
    const svg = d3.select('#donut-svg g'); // Reuse the same svg as above (inside the outer donut chart)

    const innerRadius = Math.min(size.width, size.height) / 4; // Adjust the radius for middle chart

    const color = d3.scaleOrdinal(d3.schemeSet3);

    const pie = d3.pie<EducationData>()
      .value(d => d.count)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<EducationData>>()
      .innerRadius(innerRadius / 1.5)
      .outerRadius(innerRadius);

    const arcs = svg
      .selectAll('g.inner-arc')
      .data(pie(eduData))
      .enter()
      .append('g')
      .attr('class', 'inner-arc');

    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.education));

    arcs
      .append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .style('font-family', 'Arial')
      .text(d => `${d.data.education} (${d.data.count})`);
  }

  // Loan Purpose Donut Chart (Inner)
  function initDonutChart_3() {
    const svg = d3.select('#donut-svg g'); // Reuse the same svg again

    const innerRadius = Math.min(size.width, size.height) / 4; // Adjust the inner radius
    const outerRadius = Math.min(size.width, size.height) / 6; // Adjust the outer radius

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const pie = d3.pie<LoanData>()
      .value(d => d.count)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<LoanData>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const arcs = svg
      .selectAll('g.inner-arc')
      .data(pie(loanData))
      .enter()
      .append('g')
      .attr('class', 'inner-arc');

    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.loan));

    arcs
      .append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .style('font-family', 'Arial')
      .text(d => `${d.data.loan} (${d.data.count})`);
  }

  return (
    <div ref={chartRef} className='chart-container' style={{ width: '100%' }}>
      <svg id='donut-svg' style={{ width: '100%', height: '100%' }}></svg>
    </div>
  );
}
