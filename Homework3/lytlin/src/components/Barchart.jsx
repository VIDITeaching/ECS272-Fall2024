import React from 'react';
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

export default function Barchart(props) {
  const [bars, setBars] = useState([]);
  const [selectedAttribute, setSelectedAttribute] = useState('gender');
  //const [selectedCondition, setselectedCondition] = useState('depression');
  const barRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const margin = { top: 40, right: 100, bottom: 120, left: 60 };
  const onResize = useDebounceCallback((size) => setSize(size), 200);

  useResizeObserver({ ref: barRef, onResize });

  console.log("Barchart props: ", props)

  useEffect(() => {
    const dataFromCSV = async () => {
        try {
            let csvData = await d3.csv('/Student Mental health.csv', d => {
                return {
                    gender: d['Choose your gender'],
                    age: d['Age'] ? parseInt(d['Age'], 10) : null, 
                    studyYear: d['Your current year of Study'].toLowerCase().trim(),
                    gpa: d['What is your CGPA?'].trim(),
                    marital: d['Marital status'] === 'Yes' ? 'Married' : 'Unmarried',
                    treatment: d['Did you seek any specialist for a treatment?'] === 'Yes' ? 'Treatment' : 'No Treatment',
                    depression: d['Do you have Depression?'] === 'Yes' ? 'Depression' : 'No Depression',
                    anxiety: d['Do you have Anxiety?'] === 'Yes' ? 'Anxiety' : 'No Anxiety',
                    panicattack: d['Do you have Panic attack?'] === 'Yes' ? 'PanicAttack' : 'No PanicAttack',
                };
            });

          csvData = csvData.filter(d => d.age !== null); 

            // 对数据进行排序
            if (selectedAttribute === 'age') {
                csvData = csvData.sort((a, b) => a.age - b.age);
            } else if (selectedAttribute === 'studyYear') {
                const yearOrder = ['year 1', 'year 2', 'year 3', 'year 4'];
                csvData = csvData.sort((a, b) => yearOrder.indexOf(a.studyYear) - yearOrder.indexOf(b.studyYear));
            } else if (selectedAttribute === 'gpa') {
                const gpaOrder = ['0 - 1.99', '2.00 - 2.49', '2.50 - 2.99', '3.00 - 3.49', '3.50 - 4.00'];
                csvData = csvData.sort((a, b) => gpaOrder.indexOf(a.gpa) - gpaOrder.indexOf(b.gpa));
            }

            // Filter data based on selected mental condition
            let filteredData = csvData;
            if (selectedAttribute === 'age') {
                filteredData = csvData.filter(d => d.age !== null);
            }

            const conditions = props.selectedCondition === 'depression' ? ['Depression', 'No Depression'] :
                props.selectedCondition === 'anxiety' ? ['Anxiety', 'No Anxiety'] :
                    ['PanicAttack', 'No PanicAttack'];

            const attributes = [...new Set(filteredData.map(d => d[selectedAttribute]))];
            const aggregatedData = conditions.flatMap(condition =>
                attributes.map(attribute => ({
                    condition,
                    attribute,
                    count: d3.sum(filteredData.filter(d => d[selectedAttribute] === attribute && d[props.selectedCondition] === condition), () => 1),
                }))
            );

            setBars(aggregatedData);
        } catch (error) {
            console.error('Error loading CSV:', error);
        }
    };
    dataFromCSV();
}, [selectedAttribute, props.selectedCondition]);

  useEffect(() => {
    if (bars.length === 0) return;
    if (size.width === 0 || size.height === 0) return;
    d3.select('#bar-svg').selectAll('*').remove();
    initChart();
  }, [bars, size]);

  function initChart() {
    const chartContainer = d3.select('#bar-svg');

    const yMax = d3.max(bars, d => d.count);
    const conditions = props.selectedCondition === 'depression' ? ['Depression', 'No Depression'] :
      props.selectedCondition === 'anxiety' ? ['Anxiety', 'No Anxiety'] :
        ['PanicAttack', 'No PanicAttack'];

    const x0Scale = d3.scaleBand()
      .rangeRound([margin.left, size.width - margin.right])
      .domain(bars.map(d => `${d.condition}-${d.attribute}`))
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .range([size.height - margin.bottom, margin.top])
      .domain([0, yMax]);

      const colorScale = d3.scaleOrdinal()
      .domain(conditions)
      .range([
        props.selectedCondition === 'depression' ? 'blue' : 
        props.selectedCondition === 'anxiety' ? 'red' : 
        props.selectedCondition === 'panicattack' ? 'teal' : '#ccc',
        '#ccc'
      ]);

    // Draw X axis
    const xAxis = chartContainer.append('g')
      .attr('transform', `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(x0Scale));

    // Set X-axis tick labels color
    xAxis.selectAll('text')
      .attr('transform', 'rotate(-45)')
      .attr('fill', 'black')
      .style('text-anchor', 'end');

    // Set X-axis tick lines and main line (domain) color
    xAxis.selectAll('.tick line')
      .attr('stroke', 'black');
    xAxis.select('.domain')
      .attr('stroke', 'black'); // X-axis main line

    // Draw Y axis
    const yAxis = chartContainer.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));

    // Set Y-axis tick labels color
    yAxis.selectAll('text')
      .attr('fill', 'black');

    // Set Y-axis tick lines and main line (domain) color
    yAxis.selectAll('.tick line')
      .attr('stroke', 'black');
    yAxis.select('.domain')
      .attr('stroke', 'black'); // Y-axis main line


    // Draw bars
    chartContainer.append('g')
      .selectAll('rect')
      .data(bars)
      .join('rect')
      .attr('x', d => x0Scale(`${d.condition}-${d.attribute}`))
      .attr('y', d => yScale(d.count))
      .attr('width', x0Scale.bandwidth())
      .attr('height', d => yScale(0) - yScale(d.count))
      .attr('fill', d => colorScale(d.condition));

    // Add labels to bars
    chartContainer.append('g')
      .selectAll('.bar-label')
      .data(bars)
      .join('text')
      .attr('class', 'bar-label')
      .attr('x', d => x0Scale(`${d.condition}-${d.attribute}`) + x0Scale.bandwidth() / 2)
      .attr('y', d => yScale(d.count) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', 'black')
      .text(d => d.count);

    chartContainer.append('text')
      .attr('x', size.width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .style('font-size', '1.4rem')
      .text(' Distribution of Attributes within Each Category of Mental Health Condition');  

    chartContainer.append('text')
      .attr('transform', `translate(${margin.left / 2}, ${size.height / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .style('font-size', '1rem')
      .text('Number of Students');

    chartContainer.append('text')
      .attr('x', size.width / 3)
      .attr('y', size.height - margin.bottom / 12)
      .attr('text-anchor', 'middle')
      .style('font-size', '1rem')
      .text('Attribute Groups');


    // Draw Legend 
    const legendData = conditions.map((condition, index) => ({
      condition, 
      color: index === 0 
        ? (props.selectedCondition === 'depression' ? 'blue' : 
           props.selectedCondition === 'anxiety' ? 'red' : 'teal') 
        : '#ccc'
    }));

    const legend = chartContainer.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${size.width - margin.right - 17}, ${margin.top})`);

    legend.selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`)
      .each(function (d) {
        const legendItem = d3.select(this);

        // Draw legend color box
        legendItem.append('rect')
          .attr('x', 5)
          .attr('y', 5)
          .attr('width', 10)
          .attr('height', 10)
          .attr('fill', d.color);

        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 10)
          .text(d.condition)
          .style('font-size', '14px')
          .attr('alignment-baseline', 'middle');
      });
  }

  return (
    <>
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="mental-condition-display" style={{ color: "black" }}>Mental Condition: </label>
        <div
          id="mental-condition-display"
          style={{
            border: '1px solid black',
            padding: '5px 10px',
            display: 'inline-block',
            backgroundColor: 'lightgray', // Optional: give it a background to differentiate it from other elements
            color: 'black',
            fontSize: '14px'
          }}
        >
          {props.selectedCondition === 'depression' && 'Depression'}
          {props.selectedCondition === 'anxiety' && 'Anxiety'}
          {props.selectedCondition === 'panicattack' && 'Panic Attack'}
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="attribute-select" style={{ color: "black" }}>Select Attribute: </label>
        <select
          id="attribute-select"
          value={selectedAttribute}
          onChange={(e) => {
            setSelectedAttribute(e.target.value);
            console.log("Barchart Selected Attribute:", e.target.value); // This will log the selected value to the browser console
          }}
        >
          <option value="gender">Gender</option>
          <option value="age">Age</option>
          <option value="studyYear">Study Year</option>
          <option value="gpa">GPA</option>
          <option value="marital">Marital Status</option>
          <option value="treatment">Treatment</option>
        </select>
      </div>
      <div ref={barRef} className='chart-container' style={{ height: '170%' }}>
        <svg id='bar-svg' width='100%' height='100%' ></svg>
      </div>


    </>
  );
}
