import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';

type HeatMapProps = {
  selectedRegion: string | null;
};

export default function HeatMap({ selectedRegion }: HeatMapProps) {
  const [cleanData, setCleanData] = useState<any[]>([]);
  const heatMapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 500, height: 300 });
  const margin = { top: 40, right: 90, bottom: 60, left: 110 };

  useEffect(() => {
    const handleResize = () => {
      if (heatMapRef.current) {
        setSize({
          width: heatMapRef.current.offsetWidth,
          height: heatMapRef.current.offsetHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await d3.csv('/data/Cleaned_Student_Mental_Health.csv', d3.autoType);
        setCleanData(data);
      } catch (error) {
        console.error('Error loading cleaned CSV:', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (cleanData.length === 0 || size.width === 0 || size.height === 0) return;

    d3.select('#heatmap-svg').selectAll('*').remove();

    initChart();
  }, [cleanData, size, selectedRegion]);

  // Function to get chart title based on selectedRegion
  function getTitleForRegion(regionCode: string | null): string {
    if (!regionCode) {
      return 'All students academic performance';
    }
    const mapping: { [key: string]: string } = {
      '100': 'Depression students academic performance',
      '010': 'Anxiety students academic performance',
      '001': 'Panic Attack students academic performance',
      '110': 'Depression & Anxiety students academic performance',
      '101': 'Depression & Panic Attack students academic performance',
      '011': 'Anxiety & Panic Attack students academic performance',
      '111': 'All three conditions students academic performance',
    };
    return mapping[regionCode] || 'Selected students academic performance';
  }

  // Chart initialization and heat map logic
  function initChart() {
    const svg = d3.select('#heatmap-svg')
      .attr('viewBox', `0 0 ${size.width} ${size.height}`)
      .attr('width', size.width)
      .attr('height', size.height)
      .style('background-color', '#f0f0f0');

    const chartGroup = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // CGPA ranges
    const cgpaRanges = ["0 - 1.99", "2.00 - 2.49", "2.50 - 2.99", "3.00 - 3.49", "3.50 - 4.00"];
    const yearsOfStudy = ["year 1", "year 2", "year 3", "year 4"];

    let filteredData = cleanData;
    if (selectedRegion) {
      filteredData = cleanData.filter(d => {
        const regionKey = `${d["Do you have Depression?"]?.toLowerCase() === 'yes' ? 1 : 0}${
          d["Do you have Anxiety?"]?.toLowerCase() === 'yes' ? 1 : 0
        }${d["Do you have Panic attack?"]?.toLowerCase() === 'yes' ? 1 : 0}`;
        return regionKey === selectedRegion;
      });
    }

    // Process data to get frequencies
    const frequencyData = [];
    cgpaRanges.forEach(cgpa => {
      yearsOfStudy.forEach(year => {
        const count = filteredData.filter(d => d["What is your CGPA?"] === cgpa && d["Your current year of Study"] === year).length;
        frequencyData.push({ cgpa, year, count });
      });
    });

    // Scales
    const xScale = d3.scaleBand()
      .domain(yearsOfStudy)
      .range([0, size.width - margin.left - margin.right])
      .padding(0.05);

    const yScale = d3.scaleBand()
      .domain(cgpaRanges)
      .range([size.height - margin.top - margin.bottom, 0])
      .padding(0.05);

    const maxCount = d3.max(frequencyData, d => d.count) || 0;

    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateBlues)
      .domain([0, maxCount || 1]); // Avoid division by zero

    // Tooltip div
    const tooltip = d3.select(heatMapRef.current)
      .append('div')
      .attr('id', 'tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(255, 255, 255, 0.8)')
      .style('padding', '8px')
      .style('border', '1px solid #ccc')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('font-size', '14px')
      .style('color', '#333')
      .style('box-shadow', '0px 2px 6px rgba(0,0,0,0.2)');

    const cells = chartGroup.selectAll('rect')
      .data(frequencyData, d => `${d.cgpa}:${d.year}`);

    cells.exit().remove();

    cells.transition()
      .duration(500)
      .style('fill', d => d.count > 0 ? colorScale(d.count) : '#e0e0e0');

    cells.enter()
      .append('rect')
      .attr('x', d => xScale(d.year)!)
      .attr('y', d => yScale(d.cgpa)!)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .style('fill', d => d.count > 0 ? colorScale(d.count) : '#e0e0e0') 
      .style('stroke', '#ffffff')
      .style('opacity', 0)
      .on('mouseover', function (event, d) {
        tooltip
          .style('visibility', 'visible')
          .html(`CGPA: ${d.cgpa}<br/>${d.year}`);
      })
      .on('mousemove', function (event) {
        const [x, y] = d3.pointer(event, heatMapRef.current);
        tooltip
          .style('top', `${y - 10}px`)
          .style('left', `${x + 10}px`);
      })
      .on('mouseout', function () {
        tooltip.style('visibility', 'hidden');
      })
      .transition()
      .duration(500)
      .style('opacity', 1);

    // Add text labels for counts
    const texts = chartGroup.selectAll('.count-text')
      .data(frequencyData, d => `${d.cgpa}:${d.year}`);

    texts.exit().remove();

    texts.transition()
      .duration(500)
      .text(d => d.count);

    texts.enter()
      .append('text')
      .attr('class', 'count-text')
      .attr('x', d => xScale(d.year)! + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.cgpa)! + yScale.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('fill', d => d.count > maxCount / 2 ? 'white' : 'black')
      .style('font-size', '12px')
      .style('opacity', 0)
      .text(d => d.count)
      .transition()
      .duration(500)
      .style('opacity', 1);

    // X-axis
    chartGroup.append('g')
      .attr('transform', `translate(0, ${size.height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '12px')
      .attr('transform', 'translate(0, 0)');

    // Y-axis
    chartGroup.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '12px');

    // Get the chart title based on selectedRegion
    const chartTitle = getTitleForRegion(selectedRegion);

    // Title
    svg.append('text')
      .attr('x', (size.width) / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(chartTitle);

    // X-axis 
    svg.append('text')
      .attr('x', (size.width) / 2)
      .attr('y', size.height - margin.bottom / 4)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Year of Study');

    // Y-axis 
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', - (size.height) / 2 - 30)
      .attr('y', margin.left / 2 - 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('CGPA Range');

    // Color legend
    const legendHeight = size.height - margin.top - margin.bottom;
    const legendWidth = 20;

    const legendGroup = svg.append('g')
      .attr('transform', `translate(${size.width - margin.right + 10}, ${margin.top})`);

    // Gradient for the legend
    const legendGradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'legend-gradient')
    .attr('x1', '0%')
    .attr('y1', '100%')
    .attr('x2', '0%')
    .attr('y2', '0%');

    // Color stops
    legendGradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#d3d3d3'); // light grey

    legendGradient.append('stop')
    .attr('offset', '33%')
    .attr('stop-color', '#add8e6'); // light blue

    legendGradient.append('stop')
    .attr('offset', '66%')
    .attr('stop-color', '#4682b4'); // blue

    legendGradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#00008b'); // dark blue

    legendGroup.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)')
      .style('stroke', 'black')
      .style('stroke-width', '1px');

    // Legend scale
    const legendScale = d3.scaleLinear()
      .domain([0, maxCount])
      .range([legendHeight, 0]);

    // Legend axis
    const legendAxis = d3.axisRight(legendScale)
      .ticks(5);

    legendGroup.append('g')
      .attr('transform', `translate(${legendWidth}, 0)`)
      .call(legendAxis)
      .selectAll('text')
      .style('font-size', '12px');
  }

  return (
    <div ref={heatMapRef} style={{ width: `${size.width}px`, height: `${size.height}px`, position: 'relative' }}>
      <svg id="heatmap-svg" width={size.width} height={size.height} />
    </div>
  );
}
