import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const ParallelCoordinatesPlot = () => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 }); // Initial dimensions

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    // Load the CSV data
    d3.csv('data/archive/results/Swimming.csv').then(data => {
      // Process the data to fit the parallel coordinates plot
    const stages = ['heats', 'semifinals', 'finals'];
    const filteredData = data.filter(d => d.event_name === "Women's 200m Butterfly");

    const groupedData = d3.group(filteredData, d => d.participant_name);
    // console.log(groupedData);

// Convert the Map to an array and process the data
    const formattedData = Array.from(groupedData, ([swimmer, swimmerData]) => {
        let swimmerRanks = {
            heats: null,
            semifinals: null,
            finals: null,
            swimmer: swimmer  // Optionally, keep track of swimmer ID/name
        };

        swimmerData.forEach(d => {
            if (d.stage.startsWith('Heat')) {
            swimmerRanks.heats = +d.rank;
            } else if (d.stage.startsWith('Semifinal')) {
            swimmerRanks.semifinals = +d.rank;
            } else if (d.stage.startsWith('Final')) {
            swimmerRanks.finals = +d.rank;
            }
        });

        return swimmerRanks;
    });
    // console.log(formattedData);

    // Set up SVG dimensions
    const { width, height } = dimensions;
    const margin = { top: 50, right: 50, bottom: 30, left: 40 };

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('overflow', 'visible')
      .style('margin-top', '50px');

    svg.selectAll('*').remove();

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 5-10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .selectAll('tspan')
      .data(["Women's 200m Butterfly Changes in Ranks", "from Heats, Semifinals, to Final"])
      .enter()
      .append('tspan')
      .attr('x', width / 2)
      .attr('dy', (d, i) => i === 0 ? 0 : 25)  // Adjust the vertical position for the second line
      .text(d => d);
    
    // Set up scales for each axis
    const yScales = {
      heats: d3.scaleLinear().domain([1, d3.max(formattedData, d => d.heats)]).range([height - margin.bottom, margin.top]),
      semifinals: d3.scaleLinear().domain([1, d3.max(formattedData, d => d.semifinals)]).range([height - margin.bottom, margin.top]),
      finals: d3.scaleLinear().domain([1, d3.max(formattedData, d => d.finals)]).range([height - margin.bottom, margin.top]),
    };
    // console.log(yScales['heats']);

    const xScale = d3.scalePoint()
      .domain(stages)
      .range([margin.left, width - margin.right]);

    const colorScale = d3.scaleOrdinal()
      .domain(['Top Rank (1-3 in final)', 'Middle Rank (4-8 in final)', 'Low Rank (not in final)'])  // Group swimmers into performance categories
      .range(['#9B1B30', '#DD90D2', '#CDCAD8']);  // Assign different colors to groups
    
    
    // Assign each swimmer to a performance group (e.g., top 5, middle 5, lower 5)
    const performanceGroup = d => {
        if (d.finals == null) return 'Low Rank (not in final)';
        if (d.finals > 3) return 'Middle Rank (4-8 in final)';
        return 'Top Rank (1-3 in final)';
    };


    // Add axes to the SVG
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
      .attr('stroke', d => colorScale(performanceGroup(d)))  // Color by performance group
      .attr('stroke-width', 3)
      .attr('stroke-opacity', 0.6);

    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 100}, ${0})`);  // Adjust legend position
    
    // Legend rectangles
    legend.selectAll("rect")
      .data(colorScale.domain())
      .enter()
      .append("rect")
      .attr("x", 60)
      .attr("y", (d, i) => i * 20+13)  // Position the rectangles vertically
      .attr("width", 13)
      .attr("height", 13)
      .attr("fill", d => colorScale(d));
    
    // Legend labels
    legend.selectAll("text")
      .data(colorScale.domain())
      .enter()
      .append("text")
      .attr("x", 84)  // Position the text to the right of the rectangles
      .attr("y", (d, i) => i * 20+20)  // Vertically align the text with the rectangles
      .attr("dy", "0.35em")
      .text(d => d);  // Use the domain value as the label text


    });
}, [dimensions]);
return (
  <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
    <svg ref={svgRef}></svg>
  </div>
);

 
};

export default ParallelCoordinatesPlot;