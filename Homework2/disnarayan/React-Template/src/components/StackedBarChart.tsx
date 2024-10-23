import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { csv } from 'd3-fetch'; // Import csv fetching functionality from D3

interface DataPoint {
  category: string;
  value: string;
  count: number;
}

// Define a functional React component for the stacked bar chart
const StackedBarChart: React.FC = () => {
  const [data, setData] = useState<DataPoint[]>([]); // State to store the processed data
  const svgRef = useRef<SVGSVGElement>(null); // Reference to the SVG element for rendering the chart

  useEffect(() => {
    // Fetch the CSV file and preprocess the data when the component mounts
    csv('/data/StudentMentalhealth.csv').then((csvData) => {
      const stackedData: DataPoint[] = []; // Initialize an array to hold the processed data points

      // Define the categories we want to visualize along with their corresponding CSV columns
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

      // Helper function to normalize the "Year of Study" values
      const normalizeYearOfStudy = (year: string): string => {
        const normalized = year.toLowerCase().replace(/\s+/g, '');
        return normalized.startsWith('year') ? normalized.replace('year', 'Year ') : year;
      };

      // Helper function to normalize the "CGPA" values
      const normalizeCGPA = (cgpa: string): string => {
        return cgpa.trim().replace(/\s+/g, ' ');
      };

      // Loop through each category, extracting unique values and counting occurrences
      categories.forEach((category) => {
        let uniqueValues: string[];        
        if (category.name === 'Year of Study') {
          uniqueValues = Array.from(new Set(csvData.map((d) => normalizeYearOfStudy(d[category.column]))));
        } else if (category.name === 'CGPA') {
          uniqueValues = Array.from(new Set(csvData.map((d) => normalizeCGPA(d[category.column]))));
        } else {
          uniqueValues = Array.from(new Set(csvData.map((d) => d[category.column])));
        }

        // Count the occurrences of each value within the category
        uniqueValues.forEach((value) => {
          let count: number;
          if (category.name === 'Year of Study') {
            count = csvData.filter((d) => normalizeYearOfStudy(d[category.column]) === value).length;
          } else if (category.name === 'CGPA') {
            count = csvData.filter((d) => normalizeCGPA(d[category.column]) === value).length;
          } else {
            count = csvData.filter((d) => d[category.column] === value).length;
          }

          // Store the result in the stackedData array
          stackedData.push({
            category: category.name,
            value: value,
            count: count,
          });
        });
      });

      // Update the component's state with the processed data
      setData(stackedData);
    });
  }, []); // The effect runs only once when the component is first rendered

  useEffect(() => {
    if (data.length === 0 || !svgRef.current) return; // Return early if data is not yet loaded or SVG reference is not ready

    const margin = { top: 70, right: 100, bottom: 80, left: 80 }; // Increased top margin for title
    const width = 800 - margin.left - margin.right; // Reduced width to fit the screen better
    const height = 500 - margin.top - margin.bottom;

    // Clear previous SVG content before re-rendering the chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Create an SVG element with the specified dimensions
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add chart title
    svg.append('text')
      .attr('x', width / 2) // Center the title horizontally
      .attr('y', -30) // Position the title above the chart
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .text('Student Mental Health Overview');

    // Define x0 scale (for the main categories on the x-axis)
    const categories = Array.from(new Set(data.map(d => d.category)));
    const x0 = d3.scaleBand()
      .domain(categories)
      .range([0, width])
      .padding(0.2); // Increased padding between bars to prevent horizontal scrolling

    // Define x1 scale (for the subcategories within each main category)
    const x1 = d3.scaleBand()
      .domain(Array.from(new Set(data.map(d => d.value))))
      .range([0, x0.bandwidth()])
      .padding(0.1); // Increased padding between subcategories

    // Define y scale (for the vertical position based on count)
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 0])
      .range([height, 0]);

    // Define a color scale using d3.schemeTableau10 or another D3 color scheme
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10)
      .domain(Array.from(new Set(data.map(d => d.value))));

    // Group the data by category for the stacked bar chart
    const nestedData = d3.group(data, d => d.category);

    // Draw the bars
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
      .attr('fill', d => colorScale(d.value)) // Use the ordinal color scale
      .on('mouseover', (event, d) => {
        // Display tooltip on mouseover
        const tooltip = d3.select('#tooltip');
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip.html(`${d.category}<br/>${d.value}: ${d.count}`)
          .style('left', `${event.pageX}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        // Hide tooltip on mouseout
        d3.select('#tooltip').transition().duration(500).style('opacity', 0);
      });

    // Add x-axis
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

    // Add y-axis
    svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y));

    // X-axis label
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 5)
      .attr('text-anchor', 'middle')
      .text('Categories');

    // Y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Number of Students');

    // Add a legend for the values with space between categories
    const legend = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'start')
      .selectAll('g')
      .data(Array.from(new Set(data.map(d => d.value))))
      .join('g')
      .attr('transform', (d, i) => `translate(${width + 20},${i * 25})`); // Adjust the spacing here

    legend.append('rect')
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', d => colorScale(d)); // Match legend color to bars

    legend.append('text')
      .attr('x', 24)
      .attr('y', 9.5)
      .attr('dy', '0.32em')
      .text(d => d);

  }, [data]); // This effect runs whenever the data changes

  return (
    <div className="chart-container">
      <svg ref={svgRef}></svg> {/* SVG element where the chart will be rendered */}
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
      }}></div> {/* Tooltip element for displaying information on hover */}
    </div>
  );
};

export default StackedBarChart;
