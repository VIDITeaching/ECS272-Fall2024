import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface HeatmapProps {
  data: number[][];
  labels: string[];
}

const Heatmap: React.FC<HeatmapProps> = ({ data, labels }) => {
  // Define dimensions and margins
  const width = 500;
  const height = 500;
  const margin = { top: 100, right: 100, bottom: 100, left: 100 }; // Increased right margin for color bar

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data.length || !labels.length) return;

    const svg = d3.select(svgRef.current);
    const gridSize = Math.floor(width / labels.length);

    // Clear previous content
    svg.selectAll("*").remove();

    // Set up color scale
    const colorScale = d3.scaleSequential(d3.interpolateRdYlBu).domain([1, -1]);

    // Draw heatmap cells
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.selectAll("rect")
      .data(data.flatMap((row, i) => row.map((value, j) => ({ value, row: i, col: j }))))
      .enter()
      .append("rect")
      .attr("x", d => d.col * gridSize)
      .attr("y", d => d.row * gridSize)
      .attr("width", gridSize)
      .attr("height", gridSize)
      .attr("fill", d => colorScale(d.value))
      .attr("stroke", "white");

    // Add cell labels (correlation values)
    g.selectAll("text")
      .data(data.flatMap((row, i) => row.map((value, j) => ({ value, row: i, col: j }))))
      .enter()
      .append("text")
      .attr("x", d => d.col * gridSize + gridSize / 2)
      .attr("y", d => d.row * gridSize + gridSize / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .attr("font-size", "10px")
      .text(d => d.value.toFixed(2)); // Display rounded correlation value

    // Add row labels
    g.selectAll(".row-label")
      .data(labels)
      .enter()
      .append("text")
      .attr("x", -6)
      .attr("y", (d, i) => i * gridSize + gridSize / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("font-size", "12px")
      .attr("fill", "black")
      .text(d => d);

    // Add 90-degree rotated column labels centered above each grid cell
    svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top - 20})`) // Position above grid
      .selectAll(".col-label")
      .data(labels)
      .enter()
      .append("text")
      .attr("x", (d, i) => i * gridSize + gridSize / 2) // Centered above each grid cell
      .attr("y", -30) // Shifted up for spacing
      .attr("transform", (d, i) => `rotate(-90, ${i * gridSize + gridSize / 2}, -35)`) // Rotate 90 degrees around label center
      .attr("text-anchor", "end") // Align with rotation
      .attr("font-size", "12px")
      .attr("fill", "black")
      .text(d => d);

    // Color Legend (Color Bar) on the right, outside the heatmap area
    const legendHeight = 200;
    const legendWidth = 10;
    const legendY = d3.scaleLinear().domain([-1, 1]).range([legendHeight, 0]);

    const legend = svg.append("g")
      .attr("transform", `translate(${width + margin.left + 20}, ${margin.top + 100})`);  // Positioned to the right of heatmap

    // Define color gradient
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", d3.interpolateRdYlBu(1));
    gradient.append("stop").attr("offset", "50%").attr("stop-color", d3.interpolateRdYlBu(0.5));
    gradient.append("stop").attr("offset", "100%").attr("stop-color", d3.interpolateRdYlBu(0));

    // Draw the color bar
    legend.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");

    // Add axis and labels for the color bar
    const legendAxis = d3.axisRight(legendY).ticks(5).tickFormat(d3.format(".1f"));

    legend.append("g")
      .attr("transform", `translate(${legendWidth}, 0)`)
      .call(legendAxis);

  }, [data, labels]);

  // Use the constants for svg width and height
  return <svg ref={svgRef} width={width + margin.left + margin.right + 100} height={height + margin.top + margin.bottom} />;
};

export default Heatmap;
