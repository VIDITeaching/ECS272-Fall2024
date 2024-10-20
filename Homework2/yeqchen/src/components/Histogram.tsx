import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';

const Histogram = () => {
  const [data, setData] = useState([]);
  const svgRef = useRef();


  useEffect(() => {
    // Load and filter the data
    d3.csv('data/archive/medallists.csv').then((rawData) => {
      // Filter by discipline 'Swimming'
      const swimmingMedals = rawData.filter(d => d.discipline === 'Swimming');
      console.log(swimmingMedals);

      // Count medals by country
      const countryMedalCount = d3.rollup(
        swimmingMedals,
        v => v.length,
        d => d.country
      );
      console.log(countryMedalCount);

      // Convert the rollup map to an array of objects for easier use
      const processedData = Array.from(countryMedalCount, ([country, count]) => ({ country, count }));
      setData(processedData);
    });
  }, []);

    useEffect(() => {
        if (data.length) {
        drawHistogram(data, svgRef);
        }
    }, [data]);

    const drawHistogram = (data, ref) => {
        const svg = d3.select(ref.current);
        svg.selectAll('*').remove(); // Clear previous content
      
        const margin = { top: 80, right: 50, bottom: 70, left: 40 };
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
      
        const x = d3.scaleBand()
          .domain(data.map(d => d.country))
          .range([0, width])
          .padding(0.1);
      
        const y = d3.scaleLinear()
          .domain([0, d3.max(data, d => d.count)])
          .nice()
          .range([height, 0]);
      
        const svgGroup = svg.append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);
      
        // X axis
        svgGroup.append('g')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(x))
          .selectAll('text')
          .attr('transform', 'translate(-10,0)rotate(-45)')
          .style('text-anchor', 'end');
      
        // Y axis
        svgGroup.append('g')
          .call(d3.axisLeft(y));
      
        // Bars
        svgGroup.selectAll('.bar')
          .data(data)
          .enter()
          .append('rect')
          .attr('class', 'bar')
          .attr('x', d => x(d.country))
          .attr('y', d => y(d.count))
          .attr('width', x.bandwidth())
          .attr('height', d => height - y(d.count))
          .attr('fill', '#FF9900');
      
        // X axis label
        svgGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('x', width+18)
          .attr('y', height+20)
          .text('Country');
      
        // Y axis label
        svgGroup.append('text')
          .attr('text-anchor', 'top')
          .attr('x', -20)
          .attr('y', -10)
          .text('Medals\' Count');
      
        // Title
        svg.append('text')
          .attr('text-anchor', 'middle')
          .attr('x', (width + margin.left + margin.right) / 2)
          .attr('y', margin.top / 2+10)
          .attr('font-size', '16px')
          .attr('font-weight', 'bold')
          .text('Number of Medals by Country in Swimming');
      };
      
  return (
    <div>
      <svg ref={svgRef} width={600} height={400}></svg>
    </div>
  );
};

export default Histogram;
