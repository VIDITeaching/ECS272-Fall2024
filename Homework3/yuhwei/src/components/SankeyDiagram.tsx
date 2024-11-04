import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import { useResizeObserver, useDebounceCallback } from "usehooks-ts";
import { ComponentSize, Margin } from "../types";

export default function SankeyDiagram() {
  const [data, setData] = useState([]);
  const [educationLevel, setEducationLevel] = useState("all"); // 控制显示的教育水平
  const chartRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 25, right: 100, bottom: 10, left: 60 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);

  useResizeObserver({ ref: chartRef, onResize });

  useEffect(() => {
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv("../../data/student-por.csv", (d) => ({
          totalEdu: +d.Medu + +d.Fedu,
          romantic: d.romantic === "yes" ? "yes" : "no",
          freetime: +d.freetime,
          goout: +d.goout,
          totalAlcohol: +d.Dalc + +d.Walc,
        }));

        const alcoholMedian = d3.median(csvData, (d) => d.totalAlcohol);
        const freetimeMedian = d3.median(csvData, (d) => d.freetime);
        const gooutMedian = d3.median(csvData, (d) => d.goout);

        const categorizedData = csvData.map((d) => ({
          ...d,
          alcoholLevel: d.totalAlcohol >= alcoholMedian ? "high" : "low",
          freetimeLevel: d.freetime >= freetimeMedian ? "high" : "low",
          gooutLevel: d.goout >= gooutMedian ? "high" : "low",
        }));

        setData(categorizedData);
      } catch (error) {
        console.error("Error loading CSV:", error);
      }
    };
    dataFromCSV();
  }, []);

  useEffect(() => {
    if (data.length === 0 || size.width === 0 || size.height === 0) return;

    d3.select("#sankey-svg").selectAll("*").remove();

    initChart();
  }, [data, size, educationLevel]);

  function initChart() {
    const svg = d3.select("#sankey-svg");

    const sankeyData = generateSankeyData(data, educationLevel);

    const sankeyGenerator = sankey()
      .nodeWidth(20)
      .nodePadding(20)
      .extent([
        [margin.left, margin.top],
        [size.width - margin.right, size.height - margin.bottom],
      ]);

    const { nodes, links } = sankeyGenerator({
      nodes: sankeyData.nodes.map((d) => ({ ...d })),
      links: sankeyData.links.map((d) => ({ ...d })),
    });

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Render nodes with transitions
    const nodeGroup = svg.append("g")
      .selectAll("rect")
      .data(nodes)
      .enter()
      .append("rect")
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("width", (d) => d.x1 - d.x0)
      .attr("fill", (d) => colorScale(d.name))
      .append("title")
      .text((d) => `${d.name}\n${d.value}`);

    // Render links with transition effects
    const linkGroup = svg.append("g")
      .selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("fill", "none")
      .attr("stroke", (d) => d3.interpolateBlues(d.value / 3))
      .attr("stroke-width", 0) // Set initial width to 0 for transition
      .attr("opacity", 0.7)
      .attr("stroke-width", (d) => Math.max(1, d.width)); // Set to actual width at end of transition
      
    // Render node labels with conditions for education level
    const textGroup = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("x", (d) => (d.x0 < size.width / 2 ? d.x1 + 6 : d.x0 - 6))
      .attr("y", (d) => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.x0 < size.width / 2 ? "start" : "end"))
      .attr("fill", "black")
      .text((d) => {
        if (["Low Education (Fedu + Medu < 3)", "Medium Education (2 < Fedu + Medu < 6)", "High Education (Fedu + Medu > 5)"].includes(d.name)) {
          if (
            (educationLevel === "low" && d.name === "Low Education (Fedu + Medu < 3)") ||
            (educationLevel === "medium" && d.name === "Medium Education (2 < Fedu + Medu < 6)") ||
            (educationLevel === "high" && d.name === "High Education (Fedu + Medu > 5)") ||
            educationLevel === "all"
          ) {
            return d.name;
          }
          return ""; // Return an empty string for non-matching conditions
        }
        return d.name;
      });

    // Use a Set to ensure each label is displayed only once
    const displayedLabels = new Set();
    textGroup.each(function(d) {
      const label = d3.select(this);
      if (displayedLabels.has(d.name)) {
        label.remove(); // Remove label if already displayed
      } else {
        displayedLabels.add(d.name); // Mark label as displayed
      }
    });
  }

  function generateSankeyData(data, educationLevel) {
    const nodes = [
      { name: "Low Education (Fedu + Medu < 3)" },
      { name: "Medium Education (2 < Fedu + Medu < 6)" },
      { name: "High Education (Fedu + Medu > 5)" },
      { name: "High Alcohol Consumption" },
      { name: "Low Alcohol Consumption" },
      { name: "Goout: Low" },
      { name: "Goout: High" },
      { name: "Freetime: Low" },
      { name: "Freetime: High" },
      { name: "Romantic: No" },
      { name: "Romantic: Yes" },
    ];

    const links = [];

    data.forEach((d) => {
      const educationIndex = d.totalEdu <= 2 ? 0 : d.totalEdu <= 4 ? 1 : 2;
      const alcoholIndex = d.alcoholLevel === "high" ? 3 : 4;
      const gooutIndex = d.gooutLevel === "high" ? 6 : 5;
      const freetimeIndex = d.freetimeLevel === "high" ? 8 : 7;
      const romanticIndex = d.romantic === "yes" ? 10 : 9;

      // 根据教育水平过滤链接
      if (
        (educationLevel === "low" && educationIndex === 0) ||
        (educationLevel === "medium" && educationIndex === 1) ||
        (educationLevel === "high" && educationIndex === 2) ||
        educationLevel === "all"
      ) {
        links.push({ source: educationIndex, target: alcoholIndex, value: 1 });
        links.push({ source: alcoholIndex, target: gooutIndex, value: 1 });
        links.push({ source: gooutIndex, target: freetimeIndex, value: 1 });
        links.push({ source: freetimeIndex, target: romanticIndex, value: 1 });
      }
    });
    
    return { nodes, links };
  }

  return (
    <div ref={chartRef} className="chart-container">
      <div>
        <button onClick={() => setEducationLevel("all")}>Show All</button>
        <button onClick={() => setEducationLevel("low")}>Low Education Background</button>
        <button onClick={() => setEducationLevel("medium")}>Medium Education Background</button>
        <button onClick={() => setEducationLevel("high")}>High Education Background</button>
      </div>
      <svg id="sankey-svg" width="100%" height="500"></svg>
    </div>
  );
}
