import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import debounce from 'lodash/debounce';

const WorldMap = ({ style }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth * 0.45, height: window.innerHeight * 0.65 });

  // Debounced resize handler
  useEffect(() => {
    const handleResize = debounce(() => {
      setDimensions({ width: window.innerWidth * 0.45, height: window.innerHeight * 0.65 });
    }, 200);

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      handleResize.cancel(); // Cancel pending debounce calls on cleanup
    };
  }, []);

  useEffect(() => {
    const width = dimensions.width;
    const height = dimensions.height;

    const projection = d3.geoMercator().scale(width / 6.5).translate([width / 1.8, height / 1.5]);
    const pathGenerator = d3.geoPath().projection(projection);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();  // Clear existing elements on resize

    svg.attr("width", width)
      .attr("height", height)
      .style("overflow", "visible");

    const tooltip = d3.select(tooltipRef.current)
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    d3.json('/data/countries/countries2.geo.json').then((geoData) => {
      d3.csv('/data/archive/athletes.csv').then((athleteData) => {
        const filteredData = athleteData.filter(d => d.disciplines.includes("Swimming"));

        const athleteCountByCountry = {};
        filteredData.forEach(d => {
          athleteCountByCountry[d.country_code] = (athleteCountByCountry[d.country_code] || 0) + 1;
        });

        const maxCount = d3.max(Object.values(athleteCountByCountry)) || 1;
        const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxCount]);

        svg.selectAll('.country-path')
          .data(geoData.features)
          .join('path')
          .attr('class', 'country-path')
          .attr('d', pathGenerator)
          .attr('fill', d => {
            const athleteCount = athleteCountByCountry[d.properties.ISO_A3] || 0;
            return colorScale(athleteCount);
          })
          .attr('stroke', 'black')
          .attr('stroke-width', 0.5)
          .on('mouseover', (event, d) => {
            const athleteCount = athleteCountByCountry[d.properties.ISO_A3] || 0;
            tooltip
              .style("opacity", 1)
              .html(`<strong>${d.properties["ADMIN"]}</strong><br/>Athletes: ${athleteCount}`);
          })
          .on('mousemove', (event) => {
            tooltip
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 20) + "px");
          })
          .on('mouseout', () => {
            tooltip.style("opacity", 0);
          });

        svg.append('text')
          .attr('class', 'map-title')
          .attr('x', width / 2)
          .attr('y', 25)
          .attr('text-anchor', 'middle')
          .attr('font-size', '20px')
          .attr('font-weight', 'bold')
          .text(`Swimming Athletes at the Paris 2024 Olympics`);

        const legendHeight = 10;
        const legendWidth = 300;
        const legendSvg = svg.append('g')
          .attr('class', 'color-legend')
          .attr('transform', `translate(${width / 2 - legendWidth / 2}, ${height - 40})`);

        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient").attr("id", "legend-gradient");

        const gradientSteps = 10;
        const gradientValues = d3.range(0, 1, 1 / (gradientSteps - 1));
        linearGradient.selectAll("stop")
          .data(gradientValues.map((t, i) => ({
            offset: `${100 * t}%`,
            color: colorScale(colorScale.domain()[0] + t * (colorScale.domain()[1] - colorScale.domain()[0]))
          })))
          .enter().append("stop")
          .attr("offset", d => d.offset)
          .attr("stop-color", d => d.color);

        legendSvg.append("text")
          .attr("class", "legend-title")
          .attr("x", legendWidth / 2)
          .attr("y", legendHeight - 20)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .text(`Number of Swimming Athletes`);

        legendSvg.append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", legendWidth)
          .attr("height", legendHeight)
          .style("fill", "url(#legend-gradient)");

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

  }, [dimensions]);

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} style={style}></svg>
      <div ref={tooltipRef} style={{ opacity: 0 }}></div>
    </div>
  );
};

export default WorldMap;
