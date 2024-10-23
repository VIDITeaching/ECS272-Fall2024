import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import { useResizeObserver, useDebounceCallback } from "usehooks-ts";
import { ComponentSize, Margin } from "../types";

export default function SankeyDiagram() {
  const [data, setData] = useState([]);
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
  }, [data, size]);

  function initChart() {
    const svg = d3.select("#sankey-svg");

    const sankeyData = generateSankeyData(data);

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

    const nodeGroup = svg
      .append("g")
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

    svg
      .append("g")
      .selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("fill", "none")
      .attr("stroke", (d) => d3.interpolateBlues(d.value / 3))
      .attr("stroke-width", (d) => Math.max(1, d.width))
      .attr("opacity", 0.7)
      .append("title")
      .text((d) => `${d.source.name} → ${d.target.name}\n${d.value}`);

    svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("x", (d) => (d.x0 < size.width / 2 ? d.x1 + 6 : d.x0 - 6))
      .attr("y", (d) => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.x0 < size.width / 2 ? "start" : "end"))
      .attr("fill", "black")
      .text((d) => d.name);
  }

  function generateSankeyData(data) {
    const nodes = [
      { name: "Low Education" },
      { name: "Medium Education" },
      { name: "High Education" },
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

      links.push({ source: educationIndex, target: alcoholIndex, value: 1 });
      links.push({ source: alcoholIndex, target: gooutIndex, value: 1 });
      links.push({ source: gooutIndex, target: freetimeIndex, value: 1 });
      links.push({ source: freetimeIndex, target: romanticIndex, value: 1 });
    });

    return { nodes, links };
  }

  return (
    <div ref={chartRef} className="chart-container">
      <svg id="sankey-svg" width="100%" height="500"></svg>
    </div>
  );
}
