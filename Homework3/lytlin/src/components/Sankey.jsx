import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import * as d3Sankey from 'd3-sankey';
import Barchart from './Barchart';
import Heatmap from './Heatmap';

export default function Sankey() {
  const [data, setData] = useState([]);
  const chartRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [selectedCondition, setSelectedCondition] = useState('Depression');
  const margin = { top: 60, right: 250, bottom: 100, left: 80 };
  const onResize = useDebounceCallback((size) => setSize(size), 200);

  useResizeObserver({ ref: chartRef, onResize });

  useEffect(() => {
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('/Student Mental health.csv', (d) => ({
          gender: d['Choose your gender'],
          age: d['Age'] ? `${+d['Age']} years old` : null,
          studyYear: d['Your current year of Study'].toLowerCase().trim(),
          gpa: `GPA: ${d['What is your CGPA?'].trim()}`,
          marital: d['Marital status'] === 'Yes' ? 'Married' : 'Unmarried',
          treatment: d['Did you seek any specialist for a treatment?'] === 'Yes' ? 'Treatment' : 'No Treatment',
          depression: d['Do you have Depression?'].toLowerCase() === 'yes' ? 'Depression' : 'No Depression',
          anxiety: d['Do you have Anxiety?'].toLowerCase() === 'yes' ? 'Anxiety' : 'No Anxiety',
          panicattack: d['Do you have Panic attack?'].toLowerCase() === 'yes' ? 'PanicAttack' : 'No PanicAttack',
        })).then(data => data.filter(d => d.age !== null));

        

        const aggregatedData = d3.rollups(
          csvData,
          v => v.length,
          d => d[selectedCondition.toLowerCase()],
          d => d.gender,
          d => d.age,
          d => d.studyYear,
          d => d.gpa,
          d => d.marital,
          d => d.treatment
        ).map(([condition, genders]) => {
          return genders.flatMap(([gender, ages]) => {
            return ages.flatMap(([age, years]) => {
              return years.flatMap(([year, gpas]) => {
                return gpas.flatMap(([gpa, maritals]) => {
                  return maritals.flatMap(([marital, treatments]) => {
                    return treatments.map(([treatment, value]) => {
                      return {
                        condition,
                        gender,
                        age,
                        studyYear: year,
                        gpa,
                        marital,
                        treatment,
                        value
                      };
                    });
                  });
                });
              });
            });
          });
        }).flat();
        //console.log('data ', aggregatedData);
        setData(aggregatedData);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };
    dataFromCSV();
  }, [selectedCondition]);


  useEffect(() => {
    if (size.width === 0 || size.height === 0) return;
    d3.select('#parallel-svg').selectAll('*').remove();
    drawChart(data);
    drawLegend();
  }, [data, size, selectedCondition]);
  

  function drawChart(data) {
    const width = size.width - margin.left - margin.right;
    const height = size.height - margin.top - margin.bottom;

    const sankey = d3Sankey.sankey()
    .nodeSort(null)
    .linkSort(null)
      .nodeWidth(15)
      .nodePadding(20)
      .extent([[0, 0], [width, height]]);

    const svg = d3.select('svg')
      .attr('width', size.width)
      .attr('height', size.height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Define nodes and links from data
    const attributes = ['condition', 'gender', 'age', 'studyYear', 'gpa', 'marital', 'treatment'];
    let index = -1;
    const nodes = [];
    const nodeByKey = new d3.InternMap([], JSON.stringify);
    const indexByKey = new d3.InternMap([], JSON.stringify);
    const links = [];

    const keys = data.columns;
    //console.log('keys ', keys);

    for (const k of attributes) {
      for (const d of data) {
        const key = [k, d[k]];
        if (nodeByKey.has(key)) continue;
        const node = { name: d[k] };
        nodes.push(node);
        nodeByKey.set(key, node);
        indexByKey.set(key, ++index);
      }
    }

    for (let i = 1; i < attributes.length; ++i) {
      const a = attributes[i - 1];
      const b = attributes[i];
      const prefix = attributes.slice(0, i + 1);
      const linkByKey = new d3.InternMap([], JSON.stringify);
      for (const d of data) {
        const names = prefix.map(k => d[k]);
        const value = d.value || 1;
        let link = linkByKey.get(names);
        if (link) {
          link.value += value;
          continue;
        }
        link = {
          source: indexByKey.get([a, d[a]]),
          target: indexByKey.get([b, d[b]]),
          names,
          value
        };
        links.push(link);
        linkByKey.set(names, link);
      }
    }

    const { nodes: sankeyNodes, links: sankeyLinks } = sankey({
      nodes: nodes.map(d => Object.assign({}, d)),
      links: links.map(d => Object.assign({}, d))
    });

    //console.log('nodes ', nodes);
    //console.log('links ', links);


    //const color = d3.scaleOrdinal([selectedCondition], ["#da4f81"]).unknown("#ccc");
    const color = d3.scaleOrdinal()
      .domain(['Depression', 'Anxiety', 'PanicAttack', 'No Depression', 'No Anxiety', 'No PanicAttack'])
      .range([
        selectedCondition === 'Depression' ? 'blue' : '#ccc',
        selectedCondition === 'Anxiety' ? 'red' : '#ccc',
        selectedCondition === 'PanicAttack' ? 'teal' : '#ccc',
        '#ccc', '#ccc', '#ccc'
      ]);


    svg.append("g")
      .selectAll("rect")
      .data(sankeyNodes)
      .join("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("height", d => d.y1 - d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("fill", "#424141")
      .append("title")
      .text(d => `${d.name}\n${d.value}`);

    svg.append("g")
      .attr("fill", "none")
      .selectAll("g")
      .data(sankeyLinks)
      .join("path")
      .attr("d", d3Sankey.sankeyLinkHorizontal())
      .attr("stroke", d => {
        //console.log(d.names[0]);
        return color(d.names[0]);
      })
      .attr("stroke-width", d => Math.max(2, d.width))
      .attr("stroke-opacity", 1)
      .style("mix-blend-mode", "multiply")
      .append("title");
      //.text(d => `${d.source.name} : ${d.target.name}\n${d.value}`);

    svg.append("g")
      .style("font", "10px sans-serif")
      .selectAll("text")
      .data(sankeyNodes)
      .join("text")
      .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr("y", d => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .style("font-weight", "bold")
      .text(d =>`${d.name} : `)
      .append("tspan")
      //.attr("fill-opacity", 0.7)
      .style("font-weight", "bold")  
      .text(d => `${d.value}`);
  }
  function drawLegend() {
    const legendData = selectedCondition === 'Depression' ? 
      [{ name: 'Depression', color: 'blue' }, { name: 'No Depression', color: '#ccc' }] :
      selectedCondition === 'Anxiety' ? 
      [{ name: 'Anxiety', color: 'red' }, { name: 'No Anxiety', color: '#ccc' }] :
      [{ name: 'Panic Attack', color: 'teal' }, { name: 'No Panic Attack', color: '#ccc' }];
  
    const legend = d3.select('#parallel-svg')
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${size.width - margin.right + 20}, ${margin.top})`);
    
    legend.selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 30})`)
      .each(function (d) {
        const legendItem = d3.select(this);
    
        legendItem.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', d.color);
  
        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 10)
          .text(d.name)
          .style('font-size', '14px')
          .attr('alignment-baseline', 'middle');
      });
  }
  

  return (
    <div ref={chartRef} className='chart-container' style={{ height: '50%', width: '100%', position: 'relative' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '-30px', color: 'black' }}>
                Data Overview for Different Mental Health Conditions
        </h2>
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="condition-select" style={{ color: "black" }}>Select Mental Condition: </label>
        <select
          id="condition-select"
          value={selectedCondition}
          onChange={(e) => setSelectedCondition(e.target.value)}
        >
          <option value="Depression">Depression</option>
          <option value="Anxiety">Anxiety</option>
          <option value="PanicAttack">Panic Attack</option>
        </select>
      </div>

      <svg id='parallel-svg' width='100%' height='100%'  preserveAspectRatio="xMidYMid meet"></svg>

        <div style={{
        display: 'flex',
        flexDirection: 'row', // Arrange Barchart and Heatmap in a row
        justifyContent: 'space-between', // Ensure even spacing
        width: '100%', // Full width for this container
        marginTop: '-100px',
        zIndex: 2,
        position: 'relative',
        }}>
        {/* Barchart Section */}
        <div style={{
            width: '50%', // Take half of the available width
            padding: '10px', // Optional padding for spacing
            boxSizing: 'border-box', // Ensure padding is included in width
        }}>
            <Barchart selectedCondition={selectedCondition.toLowerCase()} />
        </div>

        {/* Heatmap Section */}
        <div style={{
            width: '50%', // Take half of the available width
            padding: '10px', // Optional padding for spacing
            boxSizing: 'border-box', // Ensure padding is included in width
        }}>
            <Heatmap />
        </div>
        </div>


    </div>
       );}
    
