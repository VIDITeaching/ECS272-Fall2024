import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';

interface StudentData {
  school: string;
  sex: string;
  age: number;
  address: string;
  famsize: string;
  Pstatus: string;
  Medu: number;
  Fedu: number;
  Mjob: string;
  Fjob: string;
  reason: string;
  guardian: string;
  traveltime: number;
  studytime: number;
  failures: number;
  schoolsup: string;
  famsup: string;
  paid: string;
  activities: string;
  nursery: string;
  higher: string;
  internet: string;
  romantic: string;
  famrel: number;
  freetime: number;
  goout: number;
  Dalc: number;
  Walc: number;
  health: number;
  absences: number;
  G1: number;
  G2: number;
  G3: number;
}

export default function ParallelCoordinates() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<StudentData[]>([]); // Specify StudentData[] as the type

  useEffect(() => {
    // Function to read the CSV file and process data
    const dataFromCSV = async () => {
      try {
        const csvData: StudentData[] = await d3.csv('../../data/student-mat.csv', d => ({  
          Medu: +d.Medu,
          Fedu: +d.Fedu,          
          traveltime: +d.traveltime,
          studytime: +d.studytime,
          failures: +d.failures,
          famrel: +d.famrel,
          freetime: +d.freetime,
          goout: +d.goout,
          health: +d.health,
          absences: +d.absences,
          G1: +d.G1,
          G2: +d.G2,
          G3: +d.G3,
          Dalc: +d.Dalc,
          Walc: +d.Walc
        }));

        // Set the processed data to state
        setData(csvData);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };
    
    dataFromCSV();
  }, []); // Load data on initial mount

  useEffect(() => {
    if (isEmpty(data) || !svgRef.current) return; // Ensure the data is loaded and SVG is available

    const margin = { top: 30, right: 10, bottom: 10, left: 0 };
    const width = window.innerWidth * 0.8 - margin.left - margin.right; // 80% of page width
    const height = window.innerHeight * 0.6 - margin.top - margin.bottom; // 60% of page height


    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const dimensions = ['famrel', 'health', 'goout', 'freetime', 'traveltime', 'studytime', 'absences', 'failures', 'G1', 'G2', 'G3', 'Dalc', 'Walc'];
    
    const y: { [key: string]: d3.ScaleLinear<number, number> } = {};
    for (const dimension of dimensions) {
      y[dimension] = d3.scaleLinear()
        .domain(d3.extent(data, d => d[dimension as keyof typeof d] as number) as [number, number])
        .range(dimension === 'famrel' || dimension === 'health' || dimension === 'goout'|| dimension === 'freetime' ? [0, height] : [height, 0]); // Reverse scale for Dalc and Walc
    }
    

    const x = d3.scalePoint()
      .range([0, width])
      .padding(1)
      .domain(dimensions);

    const line = d3.line()
      .defined((d: any) => !isNaN(d[1]));

    svg.selectAll('myPath')
    .data(data)
    .enter()
    .append('path')
    .attr('d', (d: any) => {
      return line(dimensions.map(p => {
        const value = d[p as keyof typeof d];
        return [
          x(p) as number,
          y[p](value === 'yes' || value === 'no' ? value : +value) // Handle both binary ('yes', 'no') and numeric values
        ];
      }));
    })
    .style('fill', 'none') 
    .style('stroke', (d: any) => d3.interpolateRdYlBu(1 - (d.Dalc / 5)))
    .style('opacity', 0.99); // Adjust opacity for better visualization

    const dimensionTitles: { [key: string]: string } = {
      famrel: 'Quality of family\nrelationships',
      health: 'Current health\nstatus',
      goout: 'Going out\nwith friends',
      freetime: 'Free time\nafter school',
      traveltime: 'Home to school\ntravel time',
      studytime: 'Weekly\nstudy time',
      absences: 'Number of\nschool absences',
      failures: 'Number of past\nclass failures',
      G1: 'First period\ngrade',
      G2: 'Second period\ngrade',
      G3: 'Final\ngrade',
      Dalc: 'Workday alcohol\nconsumption',
      Walc: 'Weekend alcohol\nconsumption',
    };
    
    // Update the axis titles in D3
    svg.selectAll('myAxis')
      .data(dimensions)
      .enter()
      .append('g')
      .attr('transform', d => `translate(${x(d)})`)
      .each(function(d) {
        d3.select(this).call(d3.axisLeft(y[d]));
    
        // Append a text element
        const text = d3.select(this).append('text')
          .style('text-anchor', 'middle')
          .attr('y', -22)
          .style('fill', 'black');
    
        // Bind the title to two tspans
        const titleLines = dimensionTitles[d].split('\n');
    
        text.selectAll('tspan')
          .data(titleLines)
          .enter()
          .append('tspan') // Create a tspan for each line
          .attr('x', 0) // Align to the x position of the axis
          .attr('dy', (d, i) => `${i === 0 ? 0 : 1.2}em`) // Space lines
          .text(d => d); // Set the text for each tspan
      });
    
    
    // Cleanup SVG when the data or component changes
    return () => {
      d3.select(svgRef.current).selectAll('*').remove();
    };

  }, [data]); // Re-run when `data` changes

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Factors Related to Student Alcohol Consumption</h2>
      <svg ref={svgRef}></svg>
    </div>
  );
}
