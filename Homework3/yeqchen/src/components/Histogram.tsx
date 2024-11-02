import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';

const Histogram = ({ selectedGender }) => {
  const [data, setData] = useState([]);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth * 0.4, height: window.innerHeight * 0.4 });
  const svgRef = useRef();

  // Update dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth * 0.4, height: window.innerHeight * 0.4 });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load and filter data based on selected gender
  useEffect(() => {
    d3.csv('data/archive/medallists.csv').then((rawData) => {
      filterDataByDiscipline(rawData, selectedGender);
    });
  }, [selectedGender]);

  const filterDataByDiscipline = (rawData, gender) => {
    const genderSelect = (gender === "Women") ? "Female" : "Male";
    const filteredData = rawData.filter(d => d.discipline === "Swimming" && d.gender === genderSelect);

    const medalCounts = d3.rollup(
      filteredData,
      v => ({
        gold: v.filter(d => d.medal_type === 'Gold Medal').length,
        silver: v.filter(d => d.medal_type === 'Silver Medal').length,
        bronze: v.filter(d => d.medal_type === 'Bronze Medal').length
      }),
      d => d.country
    );

    const processedData = Array.from(medalCounts, ([country, medals]) => ({
      country,
      ...medals,
      total: medals.gold + medals.silver + medals.bronze 
    })).sort((a, b) => b.total - a.total);

    setData(processedData);
  };

  const drawStackedBarChart = (data, ref) => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove(); 

    const margin = { top: 80, right: 80, bottom: 75, left: 80 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const x = d3.scaleBand()
      .domain(data.map(d => d.country))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total)])
      .nice()
      .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain(['gold', 'silver', 'bronze'])
      .range(['#FFD700', '#C0C0C0', '#CD7F32']); 

    const stack = d3.stack().keys(['gold', 'silver', 'bronze']);
    const stackedData = stack(data);

    const svgGroup = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    svgGroup.selectAll('g.layer')
      .data(stackedData)
      .enter()
      .append('g')
      .attr('class', 'layer')
      .attr('fill', d => colorScale(d.key))
      .selectAll('rect')
      .data(d => d)
      .enter()
      .append('rect')
      .attr('x', d => x(d.data.country))
      .attr('y', d => y(d[1]))
      .attr('height', d => y(d[0]) - y(d[1]))
      .attr('width', x.bandwidth());

    svgGroup.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end');

    svgGroup.append('g')
      .call(d3.axisLeft(y));

    svgGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', height + 60)
      .text('Country');

    svgGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -40)
      .text("Total Medals' Count");

    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', (width + margin.left + margin.right) / 2)
      .attr('y', margin.top / 2)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text(`Medals by Country in Swimming (${selectedGender})`);

    const legend = svg.append('g')
      .attr('transform', `translate(${width + margin.left + 20}, ${margin.top})`);

    const legendItems = ['gold', 'silver', 'bronze'];
    legend.selectAll('rect')
      .data(legendItems)
      .enter()
      .append('rect')
      .attr('x', -40)
      .attr('y', (d, i) => i * 20)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', d => colorScale(d));

    legend.selectAll('text')
      .data(legendItems)
      .enter()
      .append('text')
      .attr('x', -20)
      .attr('y', (d, i) => i * 20 + 12)
      .text(d => d.charAt(0).toUpperCase() + d.slice(1));
  };

  useEffect(() => {
    if (data.length) {
      drawStackedBarChart(data, svgRef);
    }
  }, [data, dimensions]);

  return (
    <div>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
    </div>
  );
};

export default Histogram;
