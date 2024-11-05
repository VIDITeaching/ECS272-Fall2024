import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useResizeObserver, useDebounceCallback } from "usehooks-ts";

interface NodeData {
  name: string;
  color?: string;
  size?: number;
  children?: NodeData[];
}

type ChartProps = {
  data: NodeData;
};

export default function SunburstChart({ data }: ChartProps) {
  const chartRef = useRef<SVGSVGElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 600, height: 600 });
  const [currentData, setCurrentData] = useState<NodeData>(data);
  const [history, setHistory] = useState<NodeData[]>([]);
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };

  const onResize = useDebounceCallback((newSize: { width: number; height: number }) => {
    setSize(newSize);
  }, 200);

  useResizeObserver({ ref: chartRef, onResize });

  useEffect(() => {
    if (chartRef.current && size.width > 0 && size.height > 0) {
      d3.select(chartRef.current).selectAll("*").remove();

      const width = size.width - 100;
      const radius = Math.min(width, size.height) / 2;

      const partition = d3.partition<NodeData>().size([2 * Math.PI, radius - 20]);

      const root = d3
        .hierarchy(currentData)
        .sum((d) => d.size || 0)
        .sort((a, b) => (b.value || 0) - (a.value || 0));

      partition(root);

      // Color scales
      const genderColor = d3.scaleOrdinal()
        .domain(["Female", "Male"])
        .range(["#e6b8b7", "#b1c9e9"]); 

      const yearColor = d3.scaleOrdinal()
        .domain(["Year 1", "Year 2", "Year 3", "Year 4"])
        .range(["#f7c797", "#fff3b1", "#f5a89d", "#b98c6e"]); // Deeper orange, warm yellow, coral, and soft brown

      const cgpaColor = d3.scaleOrdinal()
        .domain(["0 - 1.99", "2.00 - 2.49", "2.50 - 2.99", "3.00 - 3.49", "3.50 - 4.00"])
        .range(["#cfe2d4", "#a8d5a0", "#82c687", "#5bae5a", "#3e7f3b"]); // Light to dark green

      const arc = d3
        .arc<d3.HierarchyRectangularNode<NodeData>>()
        .startAngle((d) => d.x0)
        .endAngle((d) => d.x1)
        .innerRadius((d) => d.y0)
        .outerRadius((d) => d.y1);

      const svg = d3
        .select(chartRef.current)
        .attr("viewBox", `0 0 ${width} ${size.height}`)
        .style("font", "12px monospace");

      // Title
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", margin.top)
        .attr("text-anchor", "middle")
        .style("font-family", "monospace")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Sunburst Chart of Student Distribution");

      const g = svg
        .append("g")
        .attr("transform", `translate(${width / 2},${size.height / 2 + 20})`);

      // Tooltip setup
      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("padding", "8px")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "white")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("visibility", "hidden");

      g.selectAll("path")
        .data(root.descendants().slice(1))
        .join("path")
        .attr("d", arc as any)
        .style("fill", (d) => {
          if (d.depth === 1) return genderColor(d.data.name); // Gender level
          if (d.depth === 2) return yearColor(d.data.name); // Year level
          if (d.depth === 3) return cgpaColor(d.data.name); // CGPA level
          return "#ccc";
        })
        .style("stroke", "#fff")
        .on("mouseover", (event, d) => {
          d3.select(event.currentTarget).style("opacity", 0.7);
          tooltip
            .style("visibility", "visible")
            .html(`<strong>${d.data.name}</strong><br>Value: ${d.value}`)
            .style("top", `${event.pageY}px`)
            .style("left", `${event.pageX + 10}px`);
        })
        .on("mousemove", (event) => {
          tooltip
            .style("top", `${event.pageY}px`)
            .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", (event) => {
          d3.select(event.currentTarget).style("opacity", 1);
          tooltip.style("visibility", "hidden");
        })
        .on("click", (event, d) => {
          tooltip.style("visibility", "hidden");
          if (d.children) {
            setHistory((prev) => [...prev, currentData]);
            setCurrentData(d.data);
          }
        });

      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", size.height / 2 + 20)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-family", "monospace")
        .style("font-weight", "bold")
        .style("cursor", "pointer")
        .text(currentData.name || "Root")
        .on("click", () => {
          if (history.length > 0) {
            const newHistory = [...history];
            const previousData = newHistory.pop();
            setHistory(newHistory);
            setCurrentData(previousData!);
          }
        });
    }
  }, [currentData, size, history]);

  return <svg ref={chartRef} width="100%" height="100%" style={{ maxWidth: '35vw', maxHeight: '35vh' }}></svg>;
}
