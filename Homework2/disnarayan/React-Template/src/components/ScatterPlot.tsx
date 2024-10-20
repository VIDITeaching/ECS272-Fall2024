import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { csv } from 'd3-fetch';

interface DataPoint {
  age: number;
  cgpa: number;
  gender: string;
  depression: boolean;
  course: string;
}

const ScatterPlot: React.FC = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    csv('/data/StudentMentalhealth.csv').then((csvData) => {
      const scatterData = csvData.map(row => ({
        age: +row['Age'],
        cgpa: parseCGPA(row['What is your CGPA?']),
        gender: row['Choose your gender'],
        depression: row['Do you have Depression?'] === 'Yes',
        course: row['What is your course?']
      }));
      setData(scatterData);
    });
  }, []);

  const parseCGPA = (cgpaRange: string): number => {
    const [min, max] = cgpaRange.split(' - ').map(Number);
    return (min + max) / 2;
  };

  useEffect(() => {
    if (data.length === 0 || !svgRef.current) return;

    const margin = { top: 50, right: 200, bottom: 60, left: 80 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([d3.min(data, d => d.age) || 0, d3.max(data, d => d.age) || 0])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([d3.min(data, d => d.cgpa) || 0, d3.max(data, d => d.cgpa) || 0])
      .range([height, 0]);

    const courses = Array.from(new Set(data.map(d => d.course)));
    const color = d3.scaleOrdinal<string>()
      .domain(courses)
      .range(d3.schemeCategory10);

    const getSymbol = (gender: string): d3.SymbolType => {
      return gender === 'Male' ? d3.symbolSquare : d3.symbolCircle;
    };

    const getOpacity = (depression: boolean): number => {
      return depression ? 1 : 0.5;
    };

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append('g')
      .call(d3.axisLeft(y));

    svg.selectAll('.point')
      .data(data)
      .enter()
      .append('path')
      .attr('class', 'point')
      .attr('d', d => d3.symbol().type(getSymbol(d.gender)).size(100)() || '')
      .attr('transform', d => `translate(${x(d.age)},${y(d.cgpa)})`)
      .style('fill', d => color(d.course))
      .style('opacity', d => getOpacity(d.depression))
      .on('mouseover', (event, d) => {
        const tooltip = d3.select('#tooltip');
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip.html(`Age: ${d.age}<br/>CGPA: ${d.cgpa.toFixed(2)}<br/>Gender: ${d.gender}<br/>Course: ${d.course}<br/>Depression: ${d.depression ? 'Yes' : 'No'}`)
          .style('left', `${event.pageX}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        d3.select('#tooltip').transition().duration(500).style('opacity', 0);
      });

    // X-axis label
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .text('Age');

    // Y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('CGPA');

    // Chart title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 0 - (margin.top / 2))
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('text-decoration', 'underline')
      .text('Age vs CGPA Scatter Plot (Grouped by Course)');

    // Legend
    const legend = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'start')
      .selectAll('g')
      .data([...courses, 'Male', 'Female', 'Depression', 'No Depression'])
      .join('g')
      .attr('transform', (d, i) => `translate(${width + 20},${i * 20})`);

    legend.append('rect')
      .attr('x', 0)
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', d => {
        if (courses.includes(d)) return color(d);
        return 'white';
      })
      .attr('stroke', 'black');

    legend.append('text')
      .attr('x', 24)
      .attr('y', 9.5)
      .attr('dy', '0.32em')
      .text(d => d);

    // Add symbols for gender and depression
    legend.filter(d => d === 'Male' || d === 'Female')
      .append('path')
      .attr('d', d => d3.symbol().type(getSymbol(d)).size(100)() || '')
      .attr('transform', 'translate(9.5, 9.5)')
      .style('fill', 'black');

    legend.filter(d => d === 'Depression' || d === 'No Depression')
      .append('circle')
      .attr('cx', 9.5)
      .attr('cy', 9.5)
      .attr('r', 6)
      .style('fill', 'black')
      .style('opacity', d => d === 'Depression' ? 1 : 0.5);

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

export default ScatterPlot;