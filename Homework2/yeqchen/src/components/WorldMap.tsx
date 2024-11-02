import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const WorldMap = () => {
  const svgRef = useRef();

  useEffect(() => {
    const width = 800;
    const height = 600;

    // Set up the projection and path generator
    const projection = d3.geoMercator()
      .scale(120)
      .translate([width / 2, height / 1.5]);

    const pathGenerator = d3.geoPath().projection(projection);

    // Set up the SVG canvas
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Load the GeoJSON data (update path to the actual location of the GeoJSON)
    d3.json('/data/countries/countries2.geo.json').then((geoData) => {
      // Load the athlete data and filter for swimming only
      d3.csv('/data/archive/athletes.csv').then((athleteData) => {
        
        // Filter the data where discipline contains "Swimming"
        const swimmingData = athleteData.filter(d => d.disciplines.includes('Swimming'));
        // console.log(swimmingData);

        // Create a dictionary to map country IDs to athlete count
        const athleteCountByCountry = {};
        swimmingData.forEach(d => {
          athleteCountByCountry[d.country_code] = (athleteCountByCountry[d.country_code]||0)+1;
        });
        // console.log(athleteCountByCountry);

        // Set up a color scale (Purple shades)
        const colorScale = d3.scaleSequential(d3.interpolatePurples)
          .domain([0, d3.max(Object.values(athleteCountByCountry))]);
          
        
        
        // Draw the countries and color them according to athlete count
        svg.selectAll('path')
          .data(geoData.features)
          .join('path')
          .attr('d', pathGenerator)
          .attr('fill', d => {
            const athleteCount = athleteCountByCountry[d.properties.ISO_A3] || 0; // Default to 0 if no data
            return colorScale(athleteCount);
          })
          .attr('stroke', 'black')
          .attr('stroke-width', 0.5);

        // Add a title
        svg.append('text')
          .attr('x', width / 2)
          .attr('y', 45)
          .attr('text-anchor', 'middle')
          .attr('font-size', '20px')
          .attr('font-weight', 'bold')
          .text('Global Representation of Swimming Athletes at the Paris 2024 Olympics');

        // Add a color legend
        const legendHeight = 10;
        const legendWidth = 300;
        const legendSvg = svg.append('g')
          .attr('transform', `translate(${width / 2 - legendWidth / 2}, ${height - 40})`);

        // Gradient for the legend
        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient")
          .attr("id", "legend-gradient");

        const gradientSteps = 10;  // Number of gradient steps
        const gradientValues = d3.range(0, 1, 1 / (gradientSteps - 1));  // Generate values from 0 to 1
        
        linearGradient.selectAll("stop")
          .data(gradientValues.map((t, i) => ({
            offset: `${100 * t}%`,
            color: colorScale(colorScale.domain()[0] + t * (colorScale.domain()[1] - colorScale.domain()[0]))
          })))
          .enter().append("stop")
          .attr("offset", d => d.offset)
          .attr("stop-color", d => d.color);

        legendSvg.append("text")
          .attr("x", legendWidth / 2)  // Center the text in the middle of the legend
          .attr("y", legendHeight-20)  // Position it below the rectangle
          .attr("text-anchor", "middle")  // Center the text horizontally
          .style("font-size", "12px")  // Adjust font size as needed
          .text("Number of Swimming Athletes");

        
        // Draw the legend
        legendSvg.append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", legendWidth)
          .attr("height", legendHeight)
          .style("fill", "url(#legend-gradient)");

        
        // Add legend axis
        const legendScale = d3.scaleLinear()
          .domain(colorScale.domain())
          .range([0, legendWidth]);

        legendSvg.append("g")
          .attr("transform", `translate(0, ${legendHeight})`)
          .call(d3.axisBottom(legendScale)
            .ticks(5)
            .tickSize(legendHeight)
            .tickFormat(d3.format("d")))
          .select(".domain").remove();

      }).catch(error => console.error('Error loading CSV:', error));
    }).catch(error => console.error('Error loading GeoJSON:', error));

  }, []);

  return <svg ref={svgRef}></svg>;
};

export default WorldMap;
