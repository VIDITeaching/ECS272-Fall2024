import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { csv } from 'd3-fetch';

interface DataPoint {
  category: string;
  value: string;
  count: number;
}

const StackedBarChart: React.FC = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Fetch and process the CSV data
    csv('/data/StudentMentalhealth.csv').then((csvData) => {
      const stackedData: DataPoint[] = [];

      const categories = [
        { name: 'Gender', column: 'Choose your gender' },
        { name: 'Year of Study', column: 'Your current year of Study' },
        { name: 'CGPA', column: 'What is your CGPA?' },
        { name: 'Depression', column: 'Do you have Depression?' },
        { name: 'Anxiety', column: 'Do you have Anxiety?' },
        { name: 'Panic attack', column: 'Do you have Panic attack?' },
        { name: 'Marital status', column: 'Marital status' },
        { name: 'Treatment', column: 'Did you seek any specialist for a treatment?' }
      ];

      const normalizeYearOfStudy = (year: string): string => {
        const normalized = year.toLowerCase().replace(/\s+/g, '');
        return normalized.startsWith('year') ? normalized.replace('year', 'Year ') : year;
      };

      const normalizeCGPA = (cgpa: string): string => {
        return cgpa.trim().replace(/\s+/g, ' ');
      };

      categories.forEach((category) => {
        let uniqueValues: string[];
        
        if (category.name === 'Year of Study') {
          uniqueValues = Array.from(new Set(csvData.map((d) => normalizeYearOfStudy(d[category.column]))));
        } else if (category.name === 'CGPA') {
          uniqueValues = Array.from(new Set(csvData.map((d) => normalizeCGPA(d[category.column]))));
        } else {
          uniqueValues = Array.from(new Set(csvData.map((d) => d[category.column])));
        }

        uniqueValues.forEach((value) => {
          let count: number;
          if (category.name === 'Year of Study') {
            count = csvData.filter((d) => normalizeYearOfStudy(d[category.column]) === value).length;
          } else if (category.name === 'CGPA') {
            count = csvData.filter((d) => normalizeCGPA(d[category.column]) === value).length;
          } else {
            count = csvData.filter((d) => d[category.column] === value).length;
          }

          stackedData.push({
            category: category.name,
            value: value,
            count: count,
          });
        });
      });

      setData(stackedData);
    });
  }, []);

  useEffect(() => {
    if (data.length === 0 || !svgRef.current) return;

    const margin = { top: 70, right: 100, bottom: 80, left: 80 };
    const width = 950 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const customColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
      '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#27AE60',
      '#F1948A', '#76D7C4', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ] as const;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -30)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .text('Student Mental Health Overview');

    const categories = Array.from(new Set(data.map(d => d.category)));
    const x0 = d3.scaleBand()
      .domain(categories)
      .range([0, width])
      .padding(0.1);

    const x1 = d3.scaleBand()
      .domain(Array.from(new Set(data.map(d => d.value))))
      .range([0, x0.bandwidth()])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 0])
      .range([height, 0]);

    // Fixed type definition for color scale
    const colorScale = d3.scaleOrdinal<string, string>()
      .domain(Array.from(new Set(data.map(d => d.value))))
      .range(customColors);

    const nestedData = d3.group(data, d => d.category);

    svg.selectAll('g.category')
      .data(nestedData)
      .join('g')
      .attr('class', 'category')
      .attr('transform', d => `translate(${x0(d[0]) || 0},0)`)
      .selectAll('rect')
      .data(d => d[1])
      .join('rect')
      .attr('x', d => x1(d.value) || 0)
      .attr('y', d => y(d.count))
      .attr('width', x1.bandwidth())
      .attr('height', d => height - y(d.count))
      .attr('fill', d => colorScale(d.value))
      .on('mouseover', (event, d) => {
        const tooltip = d3.select('#tooltip');
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip.html(`${d.category}<br/>${d.value}: ${d.count}`)
          .style('left', `${event.pageX}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        d3.select('#tooltip').transition().duration(500).style('opacity', 0);
      });

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x0))
      .selectAll('text')
      .attr('y', 10)
      .attr('x', -5)
      .attr('dy', '.35em')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y));

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 5)
      .attr('text-anchor', 'middle')
      .text('Categories');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Number of Students');

    const legend = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'start')
      .selectAll('g')
      .data(Array.from(new Set(data.map(d => d.value))))
      .join('g')
      .attr('transform', (d, i) => `translate(${width + 20},${i * 25})`);

    legend.append('rect')
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', d => colorScale(d));

    legend.append('text')
      .attr('x', 24)
      .attr('y', 9.5)
      .attr('dy', '0.32em')
      .text(d => d);

  }, [data]);

  return (
    <div className="chart-container">
      <svg ref={svgRef}></svg>
      <div id="tooltip" style={{
        position: 'absolute',
        textAlign: 'center',
        padding: '8px',
        font: '12px sans-serif',
        background: 'lightsteelblue',
        border: '0px',
        borderRadius: '8px',
        pointerEvents: 'none',
        opacity: 0,
      }}></div>
    </div>
  );
};

export default StackedBarChart;