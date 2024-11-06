import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { ComponentSize, Margin } from '../types';

export default function LineChart() {
  const [cleanData, setCleanData] = useState<any[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 600, height: 400 });
  const margin: Margin = { top: 40, right: 20, bottom: 45, left: 60 };
  
  // Debounce resizing to improve performance
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);
  
  // Container to track
  useResizeObserver({ ref: chartRef, onResize });

  // Null value removal
  function removeNullValues(dataset: any[]) {
    return dataset.filter(row => !Object.values(row).some(value => value === null || value === undefined || value === ''));
  }

  // Pre-processing data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await d3.csv('../../data/Student Mental Health.csv', d3.autoType);
        let cleanedData = removeNullValues(data);

        cleanedData = cleanedData.map(d => {
          d["Your current year of Study"] = d["Your current year of Study"].trim().toLowerCase();
          d["What is your CGPA?"] = d["What is your CGPA?"].trim();
          return d;
        });

        setCleanData(cleanedData);
      } catch (error) {
        console.error('Error loading or cleaning CSV:', error);
      }
    };

    loadData();
  }, []);

  // Redraw chart
  useEffect(() => {
    if (cleanData.length === 0 || size.width === 0 || size.height === 0) return;

    // Clear previous chart
    d3.select('#line-svg').selectAll('*').remove();

    // Chart create
    initChart();
  }, [cleanData, size]);

  // Chart initialization and Line chart logic
  function initChart() {
    const svg = d3.select('#line-svg')
      .attr('viewBox', `0 0 ${size.width + 10} ${size.height}`)
      .style('background-color', '#f0f0f0');

    const chartGroup = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const uniqueCGPAs = Array.from(new Set(cleanData.map(d => d["What is your CGPA?"]).sort()));

    // Frequency calculation function for each category where value is "Yes"
    const calculateFrequencies = (data: any[], conditionField: string) => {
      const frequencyMap = d3.rollups(
        data.filter(d => d[conditionField] === 'Yes'),
        v => v.length,
        d => d["What is your CGPA?"]
      );

      const frequencyObj = Object.fromEntries(frequencyMap);
      
      return uniqueCGPAs.map(cgpa => ({
        cgpa,
        count: frequencyObj[cgpa] || 0
      }));
    };

    const depressionFrequencies = calculateFrequencies(cleanData, "Do you have Depression?");
    const anxietyFrequencies = calculateFrequencies(cleanData, "Do you have Anxiety?");
    const panicAttackFrequencies = calculateFrequencies(cleanData, "Do you have Panic attack?");

    const conditions = [
      { data: depressionFrequencies, label: "Depression" },
      { data: anxietyFrequencies, label: "Anxiety" },
      { data: panicAttackFrequencies, label: "Panic Attack" }
    ];

    const xScale = d3.scaleBand()
      .domain(uniqueCGPAs)
      .range([0, size.width - margin.left - margin.right])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(conditions.flatMap(cond => cond.data), d => d.count)!])
      .range([size.height - margin.top - margin.bottom, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain(["Depression", "Anxiety", "Panic Attack"])
      .range(["#ff5733", "#33c1ff", "#33ff57"]);

    // Draw lines 
    conditions.forEach(condition => {
      const line = d3.line<any>()
        .x(d => xScale(d.cgpa)! + xScale.bandwidth() / 2)
        .y(d => yScale(d.count))
        .curve(d3.curveLinear);

      const strokeColor = colorScale(condition.label) as string;

      chartGroup.append('path')
        .datum(condition.data)
        .attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-width', 2)
        .attr('d', line);

      // Draw points
      chartGroup.selectAll(`.dot-${condition.label}`)
        .data(condition.data)
        .enter()
        .append('circle')
        .attr('class', `dot-${condition.label}`)
        .attr('cx', d => xScale(d.cgpa)! + xScale.bandwidth() / 2)
        .attr('cy', d => yScale(d.count))
        .attr('r', 4)
        .attr('fill', 'black');
    });

    // Axes
    chartGroup.append('g')
      .attr('transform', `translate(0, ${size.height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    chartGroup.append('g')
      .call(d3.axisLeft(yScale));

    // Title
    chartGroup.append("text")
      .attr("x", (size.width - margin.left - margin.right) / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("Mental Health Conditions vs CGPA");

    // X axis label
    chartGroup.append("text")
      .attr("x", (size.width - margin.left - margin.right) / 2)
      .attr("y", size.height - margin.bottom )
      .attr("text-anchor", "middle")
      .text("CGPA");

    // Y axis label
    chartGroup.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 10 - margin.left)
      .attr("x", 0 - (size.height - margin.top - margin.bottom) / 2)
      .attr("dy", "1em")
      .attr("text-anchor", "middle")
      .text("Frequency");

    // Legend
    const legend = chartGroup.append("g")
      .attr("transform", `translate(${margin.left - 40}, 0)`);

    conditions.forEach((condition, i) => {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", colorScale(condition.label));

      legend.append("text")
        .attr("x", 25)
        .attr("y", i * 20 + 15)
        .text(condition.label);
    });
  }

  return (
    <div ref={chartRef} style={{ width: '100%', maxWidth: '600px', height: '400px', overflow: 'hidden' }}>
      <svg id="line-svg" width="100%" height="100%" />
    </div>
  );
}
