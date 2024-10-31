import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface ScatterPlotProps {
  data: { [key: string]: number | string }[];
  xKey: string;
  yKey: string;
  colorKey: string;
  title: string;
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({ data, xKey, yKey, colorKey, title }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const jitterAmount = 20; // Control the jitter amount here

  useEffect(() => {
    const margin = { top: 50, right: 100, bottom: 50, left: 50 },
      width = 500 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

    // Clear any previous chart before rendering a new one
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set x and y scales
    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[xKey] as number) || 0])
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[yKey] as number) || 0])
      .range([height, 0]);

    // Explicitly map colors for "Male" and "Female"
    const color = d3.scaleOrdinal()
      .domain(["M", "F"])
      .range(["steelblue", "orange"]);

    // Add x-axis
    svg
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x));
    
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Workday Alcohol Consumption (Dalc)");

    // Add y-axis
    svg.append("g").call(d3.axisLeft(y));
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 15)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Final Grade (G3)");

    // Add chart title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(title);

    // Add legend
    const legend = svg
      .append("g")
      .attr("transform", `translate(${width + 20}, ${10})`);

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", 0)
      .style("font-size", "14px")
      .attr("font-weight", "bold")
      .text("Gender");

    const categories = ["M", "F"];
    categories.forEach((category, i) => {
      legend
        .append("rect")
        .attr("x", 0)
        .attr("y", i * 20 + 20)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", color(category));

      legend
        .append("text")
        .attr("x", 20)
        .attr("y", i * 20 + 30)
        .attr("text-anchor", "start")
        .style("font-size", "12px")
        .text(category === "M" ? "Male" : "Female");
    });

    // Pre-compute jittered coordinates for each data point
    const jitteredData = data.map((d) => ({
      ...d,
      jitterX: (Math.random() - 0.5) * jitterAmount,
      jitterY: (Math.random() - 0.5) * jitterAmount,
    }));

    // Function to plot circles with jitter
    const plotCircles = (filteredData: typeof data) => {
      const update = svg
        .selectAll("circle")
        .data(filteredData, (_, i) => i.toString());

      // Remove circles not in filtered data
      update
        .exit()
        .transition()
        .duration(500)
        .attr("r", 0)
        .style("opacity", 0)
        .remove();

      // Update existing circles with jitter
      update
        .transition()
        .duration(500)
        .attr("cx", (d) => x(d[xKey] as number) + (d as any).jitterX)
        .attr("cy", (d) => y(d[yKey] as number) + (d as any).jitterY)
        .attr("fill", (d) => color(d[colorKey] as string));

      // Add new circles with jitter
      update
        .enter()
        .append("circle")
        .attr("cx", (d) => x(d[xKey] as number) + (d as any).jitterX)
        .attr("cy", (d) => y(d[yKey] as number) + (d as any).jitterY)
        .attr("r", 0) // Start with radius 0 for animation
        .attr("fill", (d) => color(d[colorKey] as string))
        .style("opacity", 0)
        .transition()
        .duration(500)
        .attr("r", 5)
        .style("opacity", 1);
    };

    // Filter and plot data based on selected gender
    const filterData = (gender: string) => {
      const filteredData =
        gender === "All"
          ? jitteredData
          : jitteredData.filter((d) => d[colorKey] === gender);
      plotCircles(filteredData);
    };

    // Initial render with all data
    filterData("All");

    // Attach D3-based filtering buttons with .on
    d3.select("#allBtn").on("click", () => filterData("All"));
    d3.select("#maleBtn").on("click", () => filterData("M"));
    d3.select("#femaleBtn").on("click", () => filterData("F"));
  }, [data, xKey, yKey, colorKey, title]);

  return (
    <div>
      {/* Buttons for filtering */}
      <div style={{ marginBottom: "10px", marginLeft: "20px" }}>
        <button style={{ marginLeft: "5px" }} id="allBtn">All</button>
        <button style={{ marginLeft: "5px" }} id="maleBtn">Male</button>
        <button style={{ marginLeft: "5px" }} id="femaleBtn">Female</button>
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default ScatterPlot;
