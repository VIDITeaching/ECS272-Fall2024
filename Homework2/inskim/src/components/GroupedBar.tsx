import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { isEmpty, update } from "lodash";
import { useResizeObserver, useDebounceCallback } from "usehooks-ts";

import { Bar, ComponentSize, Margin } from "../types";

// A "Bar" extends an interface containing course and condition counts
interface GroupedBar extends Bar {
  course: string;
  condition: string;
  count: number;
}

const normalizeCourseName = (course: string) => {
  const engineeringCourses = [
    "engin",
    "engine",
    "koe",
    "bit",
    "bcs",
    "enm",
    "it",
    "engineering",
    "information technology",
    "computer science",
    "engineering management",
    "cts",
    "biotechnology",
  ];

  let normalized = course.trim().toLowerCase();
  //console.log(normalized);

  if (engineeringCourses.some((engCourse) => normalized.includes(engCourse))) {
    return "Engineering";
  } else {
    return "non-Engineering";
  }
};

export default function GroupedBarChart() {
  const [bars, setBars] = useState<GroupedBar[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 30, right: 85, bottom: 200, left: 40 };

  const onResize = useDebounceCallback(
    (size: ComponentSize) => setSize(size),
    200
  );

  useResizeObserver({ ref: barRef, onResize });

  useEffect(() => {
    const processData = async () => {
      const rawData = await d3.csv("../../data/StudentMentalHealth.csv");

      //console.log("Dataset length:", rawData.length);

      // Aggregate the data based on mental health and normalized course
      const processedData = rawData.reduce((acc: any, student) => {
        const course = student["What is your course?"];
        const normalizedCourse = normalizeCourseName(course.trim());

        const findOrCreateEntry = (condition: string) => {
          let entry = acc.find(
            (bar: any) =>
              bar.condition === condition && bar.course === normalizedCourse
          );

          if (!entry) {
            entry = {
              course: normalizedCourse,
              condition,
              count: 0,
            };
            acc.push(entry);
          }

          return entry;
        };

        const conditions = [
          student["Do you have Depression?"] === "Yes",
          student["Do you have Anxiety?"] === "Yes",
          student["Do you have Panic attack?"] === "Yes",
        ];

        const numConditions = conditions.filter(Boolean).length;
        if (numConditions === 1) {
          if (student["Do you have Depression?"] === "Yes") {
            const entry = findOrCreateEntry("Depression");
            entry.count++;
          }
          if (student["Do you have Anxiety?"] === "Yes") {
            const entry = findOrCreateEntry("Anxiety");
            entry.count++;
          }
          if (student["Do you have Panic attack?"] === "Yes") {
            const entry = findOrCreateEntry("Panic Attack");
            entry.count++;
          }
        } else if (numConditions > 1) {
          const entry = findOrCreateEntry("Multiple Conditions");
          entry.count++;
        } else {
          const entry = findOrCreateEntry("None");
          entry.count++;
        }

        return acc;
      }, []);
      console.log(processedData);
      setBars(processedData);
    };

    processData();
  }, []);

  useEffect(() => {
    if (isEmpty(bars)) return;
    if (size.width === 0 || size.height === 0) return;
    d3.select("#grouped-bar-svg").selectAll("*").remove();
    initChart();
  }, [bars, size]);

  function initChart() {
    let svg = d3.select("#grouped-bar-svg");

    const x0 = d3
      .scaleBand()
      .domain([
        "Depression",
        "Anxiety",
        "Panic Attack",
        "Multiple Conditions",
        "None",
      ])
      .range([margin.left, size.width - margin.right])
      .padding(0.2);

    const x1 = d3
      .scaleBand()
      .domain(["Engineering", "non-Engineering"])
      .range([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(bars, (d) => d.count) || 0])
      .range([size.height - margin.bottom, margin.top]);

    const color = d3
      .scaleOrdinal()
      .domain(["Engineering", "non-Engineering"])
      .range(["steelblue", "orange"]);

    const groupedData = d3.group(bars, (d) => d.condition);

    svg
      .append("g")
      .attr("transform", `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(x0));

    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y));

    // Draw the bars
    svg
      .append("g")
      .selectAll("g")
      .data(groupedData)
      .join("g")
      .attr("transform", (d) => `translate(${x0(d[0])}, 0)`)
      .selectAll("rect")
      .data((d) => d[1])
      .join("rect")
      .attr("x", (d) => x1(d.course)!)
      .attr("y", (d) => y(d.count))
      .attr("width", x1.bandwidth())
      .attr("height", (d) => size.height - margin.bottom - y(d.count))
      .attr("fill", (d) => color(d.course) as string);

    // Add the x-axis label
    svg
      .append("text")
      .attr("class", "x-axis-label")
      .attr("x", (size.width - margin.left - margin.right) / 2 + margin.left)
      .attr("y", size.height - margin.bottom + 35)
      .attr("text-anchor", "middle")
      .text("Mental Health Condition")
      .style("font-size", "14px");

    // Add the y-axis label
    svg
      .append("text")
      .attr("class", "y-axis-label")
      .attr("x", -(size.height - margin.top - margin.bottom) / 2 - margin.top)
      .attr("y", 13)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("Number of Students")
      .style("font-size", "14px");

    // Title of the Visualization
    svg
      .append("text")
      .attr("x", (size.width - margin.left - margin.right) / 2 + margin.left)
      .attr("y", margin.top / 1.5)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Mental Health Conditions by Course Category");

    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${size.width - margin.right + 5}, ${margin.top})`
      );

    ["Engineering", "non-Engineering"].forEach((label, i) => {
      legend
        .append("rect")
        .attr("x", -20)
        .attr("y", i * 15)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", color(label) as string)
        .attr("stroke", "black")
        .attr("stroke-width", 0.5);
      legend
        .append("text")
        .attr("x", -5)
        .attr("y", i * 15 + 9)
        .text(label)
        .style("font-size", "11px");
    });
  }
  return (
    <div ref={barRef} className="chart-container">
      <svg id="grouped-bar-svg" width="100%" height="100%"></svg>
    </div>
  );
}
