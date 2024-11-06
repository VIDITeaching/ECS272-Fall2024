import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { CSSProperties } from 'react'

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

interface ParallelCoordinatesProps {
  onDataFiltered: (filteredData: StudentData[]) => void
}

export default function ParallelCoordinates({ onDataFiltered }: ParallelCoordinatesProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<StudentData[]>([]);

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

    const margin = { top: 30, right: 10, bottom: 10, left: 40 };
    const width = window.innerWidth * 0.95 - margin.left - margin.right;
    const height = window.innerHeight * 0.4 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const dimensions = ['famrel', 'health', 'goout', 'freetime', 'traveltime', 'studytime', 'failures', 'G1', 'G2', 'G3', 'Dalc', 'Walc'];
    
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

    // Create a group for the paths
    const pathGroup = svg.append('g').attr('class', 'path-group');

    // Draw the lines
    pathGroup.selectAll('path')
      .data(data)
      .enter()
      .append('path')
      .attr('d', (d: any) => {
        return line(dimensions.map(p => {
          const value = d[p as keyof typeof d];
          return [
            x(p) as number,
            y[p](value === 'yes' || value === 'no' ? value : +value)
          ];
        }));
      })
      .style('fill', 'none') 
      .style('stroke', (d: any) => d3.interpolateRdYlBu(1 - (d.Dalc / 5)))
      .style('opacity', 0.99);

    const dimensionTitles: { [key: string]: string } = {
      famrel: 'Quality of family\nrelationships',
      health: 'Current health\nstatus',
      goout: 'Going out\nwith friends',
      freetime: 'Free time\nafter school',
      traveltime: 'Home to school\ntravel time',
      studytime: 'Weekly\nstudy time',
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
        let axis = d3.axisLeft(y[d])
        
        if (d === 'G1' || d === 'G2') {
          const domain = y[d].domain()
          const ticks = d3.range(Math.floor(domain[0]), Math.ceil(domain[1]) + 1)
          axis = axis.tickValues(ticks)
        }
        
        d3.select(this).call(axis)
    
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
    
    const resetVisualization = () => {
      pathGroup.selectAll('path')
        .style('stroke', (d: any) => d3.interpolateRdYlBu(1 - (d.Dalc / 5)))
        .style('opacity', 0.99);
    
      svg.selectAll('circle')
        .attr('fill', '#FFFFF0')
        .attr('r', 4);

      onDataFiltered(data) // Reset to all data when not hovering
    };
    
    // Add click interaction to axes
    svg.selectAll('.tick')
      .append('circle')
      .attr('r', 4)
      .attr('fill', '#FFFFF0')
      .attr('stroke', '#000')
      .attr('stroke-width', 1)
      .attr('cy', 0)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        const dimension = this.parentNode.parentNode.__data__;
        const value = d;

        // Reset all paths to grey
        pathGroup.selectAll('path')
          .style('stroke', '#ddd')
          .style('opacity', 0.3);

        const filteredData = data.filter((pathData: any) => {
          const pathValue = pathData[dimension as keyof typeof pathData]
          return Math.abs(y[dimension](pathValue) - y[dimension](value)) < 1
        })

        const hasLines = filteredData.length > 0

        // Highlight paths that pass through the clicked point
        pathGroup.selectAll('path')
          .filter((pathData: any) => {
            const pathValue = pathData[dimension as keyof typeof pathData];
            return Math.abs(y[dimension](pathValue) - y[dimension](value)) < 1;
          })
          .style('stroke', (d: any) => d3.interpolateRdYlBu(1 - (d.Dalc / 5)))
          .style('opacity', 0.99);
          
        // Highlight the clicked circle
        d3.select(this)
        .attr('fill', hasLines ? '#FFD700' : 'red')
        .attr('r', 6);

        // Reset other circles
        svg.selectAll('circle')
          .filter((_, i, nodes) => nodes[i] !== this)
          .attr('fill', '#FFFFF0')
          .attr('r', 4);
          
        onDataFiltered(filteredData)
      })
      .on('mouseout', resetVisualization);

    // Add legend
    const legendWidth = window.innerWidth *0.02
    const legendHeight = window.innerHeight*0.3
    const legendMargin = { top: 0, right: 10, bottom: 0, left: 0 }

    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width + margin.right - legendWidth - legendMargin.right}, ${margin.top})`)

    const legendScale = d3.scaleLinear()
      .domain([1, 5])
      .range([legendHeight - legendMargin.bottom, legendMargin.top])

    const legendAxis = d3.axisRight(legendScale)
      .ticks(5)
      .tickFormat(d => d.toString())

    legend.append('g')
      .attr('transform', `translate(${legendWidth - legendMargin.right}, 0)`)
      .call(legendAxis)

    const gradientId = 'legend-gradient'
    const gradient = legend.append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '0%')
      .attr('y2', '100%')

    gradient.selectAll('stop')
      .data([5, 4, 3, 2, 1])
      .enter()
      .append('stop')
      .attr('offset', (d, i) => `${i * 25}%`)
      .attr('stop-color', d => d3.interpolateRdYlBu(1 - (d / 5)))

    legend.append('rect')
      .attr('x', legendMargin.left)
      .attr('y', legendMargin.top)
      .attr('width', legendWidth - legendMargin.left - legendMargin.right)
      .attr('height', legendHeight - legendMargin.top - legendMargin.bottom)
      .style('fill', `url(#${gradientId})`)

    legend.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -legendHeight / 2)
      .attr('y', -legendWidth + 5)
      .attr('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .style('font-size', '12px')
      .text('Workday Alcohol Consumption')
    
    
      // Cleanup SVG when the data or component changes
    return () => {
      d3.select(svgRef.current).selectAll('*').remove();
    };

  },[data, onDataFiltered]); // Re-run when `data` changes

  const styles: { [key: string]: CSSProperties } = {
    title: {
      textAlign: 'center', 
      width: window.innerWidth,
    },
  }

  return (
    <div>
      <h2 style={styles.title}>Factors Related to Student Alcohol Consumption</h2>
      <svg ref={svgRef}></svg>
    </div>
  );
}
