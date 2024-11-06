import React from 'react';
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

export default function Heatmap() {
    const [depressionData, setDepressionData] = useState([]);
    const [anxietyData, setAnxietyData] = useState([]);
    const [panicData, setPanicData] = useState([]);
    const [selectedCondition, setSelectedCondition] = useState(null);
    const scatterRef = useRef(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    const margin = { top: 80, right: 250, bottom: 100, left: 150 };
    const onResize = useDebounceCallback((size) => setSize(size), 200);

    useResizeObserver({ ref: scatterRef, onResize });

    useEffect(() => {
        const dataFromCSV = async () => {
            try {
                const csvData = await d3.csv('/Student Mental health.csv', (d) => {
                    return {
                        age: +d['Age'],
                        gpa: d['What is your CGPA?'],
                        depression: d['Do you have Depression?'] === 'Yes' ? 1 : 0,
                        anxiety: d['Do you have Anxiety?'] === 'Yes' ? 1 : 0,
                        panicAttack: d['Do you have Panic attack?'] === 'Yes' ? 1 : 0,
                    };
                });

                // Aggregating data for each condition
                const depressionAgg = aggregateData(csvData.filter(d => d.depression === 1));
                const anxietyAgg = aggregateData(csvData.filter(d => d.anxiety === 1));
                const panicAgg = aggregateData(csvData.filter(d => d.panicAttack === 1));

                setDepressionData(depressionAgg);
                setAnxietyData(anxietyAgg);
                setPanicData(panicAgg);
            } catch (error) {
                console.error('Error loading CSV:', error);
            }
        };
        dataFromCSV();
    }, []);

    useEffect(() => {
        if (size.width === 0 || size.height === 0) return;

        // Clear the existing chart elements
        d3.select('#scatter-svg').selectAll('*').remove();

        if (selectedCondition === null) {
            // Draw all conditions if no specific condition is selected
            drawChart(depressionData, 'Depression', 'blue');
            drawChart(anxietyData, 'Anxiety', 'red');
            drawChart(panicData, 'Panic Attack', 'teal');
        } else {
            // Draw only the selected condition
            if (selectedCondition === 'Depression') {
                drawChart(depressionData, 'Depression', 'blue');
            }
            if (selectedCondition === 'Anxiety') {
                drawChart(anxietyData, 'Anxiety', 'red');
            }
            if (selectedCondition === 'Panic Attack') {
                drawChart(panicData, 'Panic Attack', 'teal');
            }
        }
        drawLegend();
        drawSizeLegend();
    }, [depressionData, anxietyData, panicData, size, selectedCondition]);


    function categorizeGPA(gpa) {
        const validRanges = [
            '3.50 - 4.00',
            '3.00 - 3.49',
            '2.50 - 2.99',
            '2.00 - 2.49',
            '0 - 1.99'
        ];
        gpa = gpa.trim();
        if (validRanges.includes(gpa)) {
            return gpa;
        } else {
            console.warn(`Unexpected GPA value found: ${gpa}`);
            return 'Unknown';
        }
    }

    function aggregateData(filteredData) {
        const groupedData = d3.rollups(
            filteredData,
            v => v.length,
            d => d.age,
            d => categorizeGPA(d.gpa)
        );
        return groupedData.flatMap(([age, gpaData]) =>
            gpaData.map(([gpaRange, count]) => ({ age, gpaRange, count }))
        );
    }

    function drawChart(data, conditionName, color) {
        const chartContainer = d3.select('#scatter-svg')
            .append('g')
            .attr('class', conditionName);

        const yCategories = [
            '0 - 1.99',
            '2.00 - 2.49',
            '2.50 - 2.99',
            '3.00 - 3.49',
            '3.50 - 4.00'
        ];

        const xScale = d3.scaleLinear()
            .domain([18, 25])
            .range([margin.left, size.width - margin.right])
            .nice();

        const tickValues = d3.range(18, 25);
        const gridWidth = (xScale(19) - xScale(18)) / 2;

        const yScale = d3.scaleBand()
            .domain(yCategories)
            .rangeRound([size.height - margin.bottom, margin.top])
            .padding(0.1);

        const rScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count)])
            .range([1, 18]); // Point size range

        // X Axis
        const xAxis = chartContainer.append('g')
            .attr('transform', `translate(0, ${size.height - margin.bottom})`)
            .call(d3.axisBottom(xScale).tickValues(tickValues).tickFormat(d => `${d}`));

        xAxis.selectAll('text')
            .style('font-size', '12px')
            .attr('y', 10)
            .attr('fill', 'black')
            .attr('x', gridWidth);

        xAxis.selectAll('.tick line')
            .attr('stroke', 'black');
        xAxis.select('.domain')
            .attr('stroke', 'black'); // X-axis main line

        chartContainer.append('text')
            .attr('x', (size.width) / 2)
            .attr('y', size.height - margin.bottom / 3)
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .style('font-size', '1rem')
            .text('Age of Students');

        // Y Axis
        const yAxis = chartContainer.append('g')
            .attr('transform', `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(yScale));

        yAxis.selectAll('text')
            .attr('fill', 'black');

        // Set Y-axis tick lines and main line (domain) color
        yAxis.selectAll('.tick line')
            .attr('stroke', 'black');
        yAxis.select('.domain')
            .attr('stroke', 'black');

        chartContainer.append('text')
            .attr('transform', `translate(${margin.left / 2}, ${size.height / 2}) rotate(-90)`)
            .attr('text-anchor', 'middle')
            .style('font-size', '1rem')
            .text('GPA Range of Students');

        const points = chartContainer.selectAll(`.${conditionName}-points`)
            .data(data)
            .enter()
            .append('circle')  // Using circle for all categories
            .attr('class', `${conditionName}-points`)
            .attr('stroke', color)  // Set color of the outline using stroke
            .attr('fill', 'none')  // No fill to keep only the outline
            .attr('opacity', 0.7)
            .on('mouseover', function (event, d) {
                d3.select(this).style('opacity', 0.9);
                chartContainer.append('text')
                    .attr('class', 'tooltip')
                    .attr('x', xScale(d.age) + gridWidth - 150)
                    .attr('y', yScale(d.gpaRange) - 10)
                    .style('font-size', '12px')
                    .style('fill', 'black')
                    .text(`${conditionName}, Number of students: ${d.count}`);
            })
            .on('mouseout', function () {
                d3.select(this).style('opacity', 0.7);
                chartContainer.selectAll('.tooltip').remove();
            });

        points.attr('cx', d => xScale(d.age) + gridWidth)
            .attr('cy', d => yScale(d.gpaRange) + yScale.bandwidth() / 2)
            .attr('r', d => rScale(d.count));

        // Chart title
        chartContainer.append('text')
            .attr('x', size.width / 2)
            .attr('y', margin.top / 2 - 10)
            .attr('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .style('font-size', '1.4rem')
            .text('Relationship Between Age, GPA in Different Mental Health Conditions');
    }

    function drawLegend() {
        const legendData = [
            { name: 'Depression', color: 'blue' },
            { name: 'Anxiety', color: 'red' },
            { name: 'Panic Attack', color: 'teal' }
        ];

        const legend = d3.select('#scatter-svg')
        .append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${size.width - margin.right + 30}, ${margin.top + 30})`);
      
      legend.selectAll('legend-item')
        .data(legendData)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 30})`)
        .each(function (d) {
          const legendItem = d3.select(this);
      
          // Draw legend color box 
          legendItem.append('circle')
            .attr('cx', 0)  
            .attr('cy', 5)
            .attr('r', 5)
            .attr('fill', 'none')
            .attr('stroke', d.color)
            .on('click', () => setSelectedCondition(selectedCondition === d.name ? null : d.name));
      
         
          legendItem.append('text')
            .attr('x', 20)  
            .attr('y', 10)
            .text(d.name)
            .style('font-size', '14px')
            .attr('alignment-baseline', 'middle');
            //.on('click', () => setSelectedCondition(selectedCondition === d.name ? null : d.name));
        });
      
    }

    function drawSizeLegend() {
        
        const maxCountDepression = d3.max(depressionData, d => d.count);
        console.log('depressionData:', depressionData);
        console.log('Max count in Depression:', maxCountDepression);
        const maxCountAnxiety = d3.max(anxietyData, d => d.count);
        console.log('anxietyData:', anxietyData);
        console.log('Max count in anxiety:', maxCountAnxiety);
        const maxCountPanic = d3.max(panicData, d => d.count);
        console.log('panicData:', anxietyData);
        console.log('Max count in panic:', maxCountPanic);
    
       
        const maxCount = d3.max([maxCountDepression, maxCountAnxiety, maxCountPanic]);
    
       
        const rScale = d3.scaleLinear()
            .domain([0, maxCount])  
            .range([1, 18]); 
            
    
       
        const sizeLegendData = [1, Math.floor(maxCount / 2), maxCount];
    
        const legend = d3.select('#scatter-svg')
            .append('g')
            .attr('class', 'size-legend')
            .attr('transform', `translate(${size.width - margin.right + 30}, ${margin.top + 150})`);
    

        legend.selectAll('.size-legend-item')
            .data(sizeLegendData)
            .enter()
            .append('g')
            .attr('class', 'size-legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 50})`)
            .each(function (d) {
                d3.select(this)
                    .append('circle')
                    .attr('r', rScale(d))  
                    .attr('fill', 'none')
                    .attr('stroke', 'black');
    
      
                d3.select(this)
                    .append('text')
                    .attr('x', 25)
                    .attr('y', 5)
                    .text(`${d} (number of students)`)
                    .style('font-size', '14px')
                    .attr('alignment-baseline', 'middle');
            });
    }
    
    return (
        <>
            <div style={{ marginBottom: '10px' }}>
                <label htmlFor="condition-select" style={{ color: "black" }}>Select Mental Condition: </label>
                <select
                    id="condition-select"
                    value={selectedCondition || ''}
                    onChange={(e) => setSelectedCondition(e.target.value || null)}
                >
                    <option value="">All</option>
                    <option value="Depression">Depression</option>
                    <option value="Anxiety">Anxiety</option>
                    <option value="Panic Attack">Panic Attack</option>
                </select>
            </div>
            <div ref={scatterRef} className='chart-container' style={{ height: '175%' }}>
                <svg id='scatter-svg' width='100%' height='100%'></svg>
            </div>
            {/* {selectedCondition && (
                <button
                    onClick={() => setSelectedCondition(null)}
                    style={{
                        marginTop: '-300px',
                        padding: '10px 20px',
                        fontSize: '16px',
                        cursor: 'pointer'
                    }}
                >
                    Restore Original View
                </button>
            )} */}
        </>
    );
}
