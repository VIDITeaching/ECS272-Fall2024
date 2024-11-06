import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { ComponentSize, Margin } from '../types';

export default function BarChart() {
  const [cleanData, setCleanData] = useState<any[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 600, height: 400 });
  const margin: Margin = { top: 40, right: 20, bottom: 35, left: 60 };

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

  // Chart initialization and Bar chart logic
  function initChart() {
    const svg = d3.select('#bar-svg')
      .attr('viewBox', `0 0 ${size.width + 10} ${size.height}`)
      .style('background-color', '#f0f0f0');

    const chartGroup = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const mentalHealthFeatures = ["Depression", "Anxiety", "Panic Attack"];
    const maritalStatus = ["Yes", "No"]; // Yes for married, No for unmarried

    // Frequency calculation function for each category where value is "Yes"
      const frequencyData = maritalStatus.map(status => {
      const depressionYes = cleanData.filter(d => d["Marital status"] === status && d["Do you have Depression?"] === "Yes").length;
      const anxietyYes = cleanData.filter(d => d["Marital status"] === status && d["Do you have Anxiety?"] === "Yes").length;
      const panicAttackYes = cleanData.filter(d => d["Marital status"] === status && d["Do you have Panic attack?"] === "Yes").length;

      return {
        status,
        frequencies: [
          { feature: "Depression", count: depressionYes },
          { feature: "Anxiety", count: anxietyYes },
          { feature: "Panic Attack", count: panicAttackYes }
        ]
      };
    });

    // Flat array of datapoints
    const flatData = [];
    frequencyData.forEach(({ status, frequencies }) => {
      frequencies.forEach(f => {
        flatData.push({ status, feature: f.feature, count: f.count });
      });
    });

    const x0 = d3.scaleBand()
      .domain(maritalStatus)
      .range([0, size.width - margin.left - margin.right])
      .padding(0.2); 

    const x1 = d3.scaleBand()
      .domain(mentalHealthFeatures)
      .range([0, x0.bandwidth()]) 
      .padding(0.1); 

    const y = d3.scaleLinear()
      .domain([0, d3.max(flatData, d => d.count)!])
      .nice()
      .range([size.height - margin.top - margin.bottom, 0]);

    const color = d3.scaleOrdinal()
      .domain(mentalHealthFeatures)
      .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

    // Add bars for the data
    chartGroup.selectAll(".bar-group")
      .data(frequencyData)
      .enter()
      .append("g")
      .attr("class", "bar-group")
      .attr("transform", d => `translate(${x0(d.status)}, 0)`)  
      .selectAll("rect")
      .data(d => d.frequencies)
      .enter()
      .append("rect")
      .attr("x", d => x1(d.feature))  
      .attr("y", d => y(d.count))
      .attr("width", x1.bandwidth())  // Ensure bars take appropriate width
      .attr("height", d => y(0) - y(d.count))
      .attr("fill", d => color(d.feature));

    // Tooltip on top of bar
    chartGroup.selectAll(".bar-group")
      .selectAll(".bar-text")
      .data(d => d.frequencies)
      .enter()
      .append("text")
      .attr("x", d => x1(d.feature) + x1.bandwidth() / 2)
      .attr("y", d => y(d.count) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text(d => d.count);

    // Axes
    chartGroup.append("g")
      .attr("transform", `translate(0, ${size.height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .style("text-anchor", "middle")
      .style("font-size", "12px");

    chartGroup.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", "12px");

    // Title
    chartGroup.append("text")
      .attr("x", (size.width - margin.left - margin.right) / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("Relationship between Marital Status and Mental Conditions");

    // X axis label
    chartGroup.append("text")
      .attr("x", (size.width - margin.left - margin.right) / 2)
      .attr("y", size.height - margin.top - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Marital Status");

    // Y axis label
    chartGroup.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(size.height - margin.top - margin.bottom) / 2)
      .attr("y", 10-margin.left + 10)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Frequency");

    // Legend
    const legend = chartGroup.append("g")
      .attr("transform", `translate(${size.width - margin.right - 520}, ${50-margin.top})`);

    mentalHealthFeatures.forEach((feature, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendRow.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color(feature));

      legendRow.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .style("font-size", "12px")
        .text(feature);
    });
  }

  return (
    <div ref={barRef} style={{ width: '100%', maxWidth: '600px', height: '400px', overflow: 'hidden' }}>
      <svg id="bar-svg" width="100%" height="100%" />
    </div>
  );
}
