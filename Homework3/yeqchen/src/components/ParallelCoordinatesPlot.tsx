import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { filter } from 'lodash';

const ParallelCoordinatesPlot = () => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 });
  const [selectedEvent, setSelectedEvent] = useState("Women's 200m Butterfly"); // Default event
  const [eventOptions, setEventOptions] = useState([]); // Store unique event names

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    // Load the CSV data
    d3.csv('data/archive/results/Swimming.csv').then(data => {

      const filteredEvents = data
        .filter(d => d.participant_type === "Person")
        .reduce((events, row) => {
          const event = row.event_name;
          const stage = row.stage.toLowerCase();

          // Initialize if not existing
          if (!events[event]) events[event] = new Set();

          // Add stages for this event, using a regex to identify any variation of 'semifinal'
          if (stage.includes('heat')) {
            events[event].add('heats');
          } else if (stage.includes('semifinal')) {
            events[event].add('semifinals');
          } else if (stage === 'final') {
            events[event].add('finals');
          }
          // console.log(events);
          return events;
        }, {});

      const validEvents = Object.entries(filteredEvents)
        .filter(([event, stagesSet]) => stagesSet.size === 3)
        .map(([event]) => event); 
      
      setEventOptions(validEvents);  // Set dropdown options
      console.log(validEvents);

      const filteredData = data.filter(d => d.event_name=== selectedEvent);
      // Process the data to fit the parallel coordinates plot
      const stages = ['heats', 'semifinals', 'finals'];
      const groupedData = d3.group(filteredData, d => d.participant_name);

      const formattedData = Array.from(groupedData, ([swimmer, swimmerData]) => {
        let swimmerRanks = {
          heats: null,
          semifinals: null,
          finals: null,
          swimmer: swimmer
        };

        swimmerData.forEach(d => {
          if (d.stage.startsWith('Heat')) swimmerRanks.heats = +d.rank||null;
          else if (d.stage.startsWith('Semifinal')) swimmerRanks.semifinals = +d.rank||null;
          else if (d.stage.startsWith('Final')) swimmerRanks.finals = +d.rank||null;
        
        });

        return swimmerRanks;
      });

      // Set up SVG dimensions
      const { width, height } = dimensions;
      const margin = { top: 50, right: 50, bottom: 30, left: 40 };

      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height)
        .style('overflow', 'visible')
        .style('margin-top', '20px');

      svg.selectAll('*').remove();

      // Add title
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', margin.top / 5+20)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text(`Ranks for ${selectedEvent}`);

      // Set up scales for each axis
      const yScales = {
        heats: d3.scaleLinear().domain([d3.max(formattedData, d => d.heats), 1]).range([height - margin.bottom, margin.top]),
        semifinals: d3.scaleLinear().domain([d3.max(formattedData, d => d.semifinals), 1]).range([height - margin.bottom, margin.top]),
        finals: d3.scaleLinear().domain([d3.max(formattedData, d => d.finals), 1]).range([height - margin.bottom, margin.top]),
      };

      const xScale = d3.scalePoint()
        .domain(stages)
        .range([margin.left, width - margin.right]);

      const colorScale = d3.scaleOrdinal()
        .domain(['Top Rank (1-3 in final)', 'Middle Rank (4-8 in final)', 'Low Rank (not in final)'])
        .range(['#9B1B30', '#DD90D2', '#CDCAD8']);

      const performanceGroup = d => {
        if (!isNaN(d.finals)) {
          if (d.finals == null) return 'Low Rank (not in final)';
          if (d.finals > 3) return 'Middle Rank (4-8 in final)';
          return 'Top Rank (1-3 in final)';
        }
        console.log(d.finals);
        return null;
      };

      // Draw the axes
      svg.selectAll('g.axis')
        .data(stages)
        .enter()
        .append('g')
        .attr('class', 'axis')
        .attr('transform', d => `translate(${xScale(d)}, 0)`)
        .each(function (d) {
          d3.select(this).call(d3.axisLeft(yScales[d]).ticks(7).tickFormat(d3.format("d")));
        });

      // Y-axis label
    svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', margin.left)
    .attr('x', -(height / 2))
    .attr('dy', '-2em')
    .style('text-anchor', 'middle')
    .text('Rank');

    // X-axis label
    svg.append('text')
      .attr('x', margin.left)
      .attr('y', height - margin.bottom / 4)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Heats\' Rank');

    svg.append('text')
      .attr('x', width/2)
      .attr('y', height - margin.bottom / 4)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Semifinals\' Rank');

    svg.append('text')
      .attr('x', width-margin.left)
      .attr('y', height - margin.bottom / 4)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Final\' Rank');


      // Draw the lines for each swimmer
      svg.selectAll('path.line')
        .data(formattedData)
        .enter()
        .append('path')
        .attr('class', 'line')
        .attr('d', d => d3.line()(stages.map(stage => [xScale(stage), yScales[stage](d[stage])])))
        .attr('fill', 'none')
        .attr('stroke', d => colorScale(performanceGroup(d)))
        .attr('stroke-width', 3)
        .attr('stroke-opacity', 0.6);

      // Legend for performance groups
      const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 100}, ${0})`);

      legend.selectAll("rect")
        .data(colorScale.domain())
        .enter()
        .append("rect")
        .attr("x", 60)
        .attr("y", (d, i) => i * 20 + 13)
        .attr("width", 13)
        .attr("height", 13)
        .attr("fill", d => colorScale(d));

      legend.selectAll("text")
        .data(colorScale.domain())
        .enter()
        .append("text")
        .attr("x", 84)
        .attr("y", (d, i) => i * 20 + 20)
        .attr("dy", "0.35em")
        .text(d => d);
    });
  }, [dimensions, selectedEvent]); // Re-render when dimensions or selected event changes

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <label>Swimming Event Select:</label>
      <select
        value={selectedEvent}
        onChange={e => setSelectedEvent(e.target.value)}
        style={{ position: 'absolute', top: 25, left: 0, zIndex: 10 }}
      >
        {eventOptions.map(event => (
          <option key={event} value={event}>{event}</option>
        ))}
      </select>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default ParallelCoordinatesPlot;
