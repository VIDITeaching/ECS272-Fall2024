import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { isEmpty, update } from "lodash";
import { useResizeObserver, useDebounceCallback } from "usehooks-ts";

import { Bar, ComponentSize, Margin } from "../types";

// A "Bar" extends an interface containing course and condition counts
interface GroupedBar extends Bar {
  category: string;
  condition: string;
  count: number;
}

type CategoryKey = "age" | "gpa" | "gender" | "marriage" | "course" | "year";

const normalizeCourseName = (course: string) => {
  const STEM = [
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
    "mathematics",
    "marine science",
    "radiography",
  ];

  const Science = [
    "nursing",
    "psychology",
    "biomedical science",
    "mhsc",
    "kop",
    "diploma nursing",
  ];

  const Business = [
    "kenms",
    "accounting",
    "enm",
    "banking studies",
    "business administration",
    "econs",
  ];

  const Humanities = [
    "islamic education",
    "laws",
    "pendidikan islam",
    "human resources",
    "irkhs",
    "law",
    "kirkhs",
    "usuluddin",
    "benl",
    "human sciences",
    "communication",
    "fiqh fatwa",
    "fiqh",
  ];

  let normalized = course.trim().toLowerCase();

  if (STEM.some((stemCourse) => normalized.includes(stemCourse))) {
    return "STEM";
  } else if (
    Science.some((scienceCourse) => normalized.includes(scienceCourse))
  ) {
    return "Medical";
  } else if (
    Business.some((businessCourse) => normalized.includes(businessCourse))
  ) {
    return "Business";
  } else if (
    Humanities.some((humanityCourse) => normalized.includes(humanityCourse))
  ) {
    return "Humanities";
  } else {
    return "Others";
  }
};

const ageRanges = [
  { range: "18 - 19", min: 18, max: 19 },
  { range: "20 - 21", min: 20, max: 21 },
  { range: "22 - 23", min: 22, max: 23 },
  { range: "24+", min: 24, max: Infinity },
];

const getAgeRange = (age: string) => {
  const cur = parseFloat(age.split(" - ")[0]) || 0;
  const yValue = ageRanges.find(
    (range) => cur >= range.min && cur <= range.max
  )?.range;

  return yValue || "Unknown";
};

const gpaRanges = [
  { range: "0.00 - 1.99", min: 0, max: 1.99 },
  { range: "2.00 - 2.49", min: 2.0, max: 2.49 },
  { range: "2.50 - 2.99", min: 2.5, max: 2.99 },
  { range: "3.00 - 3.49", min: 3.0, max: 3.49 },
  { range: "3.50 - 4.00", min: 3.5, max: 4.0 },
];

const getGpaRange = (gpa: string) => {
  const cur = parseFloat(gpa.split(" - ")[0]) || 0;
  const yValue = gpaRanges.find(
    (range) => cur >= range.min && cur <= range.max
  )?.range;

  return yValue || "Unknown";
};

const categoryGroups: Record<CategoryKey, string[]> = {
  age: ageRanges.map((d) => d.range),
  gpa: gpaRanges.map((d) => d.range),
  gender: ["Female", "Male"],
  marriage: ["Married", "Not Married"],
  course: ["STEM", "Humanities", "Business", "Medical", "Others"],
  year: ["year 1", "year 2", "year 3", "year 4"],
};

interface GroupedBarChartProps {
  selectedNode: CategoryKey;
}

const GroupedBarChart: React.FC<GroupedBarChartProps> = ({ selectedNode }) => {
  const [bars, setBars] = useState<GroupedBar[]>([]);
  //const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("age");

  const barRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 30, right: 85, bottom: 45, left: 40 };

  const onResize = useDebounceCallback(
    (size: ComponentSize) => setSize(size),
    200
  );

  useResizeObserver({ ref: barRef, onResize });

  useEffect(() => {
    const processData = async () => {
      const rawData = await d3.csv("../../data/StudentMentalHealth.csv");

      const processedData = rawData.reduce((acc: any, student) => {
        let yValue: any;

        if (selectedNode === "course") {
          yValue = normalizeCourseName(student["What is your course?"]);
        } else if (selectedNode === "age") {
          yValue = getAgeRange(student["Age"]);
        } else if (selectedNode === "gpa") {
          yValue = getGpaRange(student["What is your CGPA?"]);
        } else if (selectedNode === "year") {
          yValue = student["Your current year of Study"].toLowerCase().trim();
        } else if (selectedNode === "gender") {
          yValue = student["Choose your gender"].trim();
        } else if (selectedNode === "marriage") {
          const status = student["Marital status"];
          if (status === "Yes") yValue = "Married";
          else yValue = "Not Married";
        }

        const findOrCreateEntry = (condition: string) => {
          let entry = acc.find(
            (bar: any) =>
              bar.condition === condition && bar.categoryGroup === yValue
          );
          if (!entry) {
            entry = { categoryGroup: yValue, condition, count: 0 };
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
            findOrCreateEntry("Depression").count++;
          }
          if (student["Do you have Anxiety?"] === "Yes") {
            findOrCreateEntry("Anxiety").count++;
          }
          if (student["Do you have Panic attack?"] === "Yes") {
            findOrCreateEntry("Panic Attack").count++;
          }
        } else if (numConditions > 1) {
          findOrCreateEntry("Multiple Conditions").count++;
        } else {
          findOrCreateEntry("None").count++;
        }
        return acc;
      }, []);

      setBars(processedData);
    };

    processData();
  }, [selectedNode]);

  useEffect(() => {
    if (isEmpty(bars)) return;
    if (size.width === 0 || size.height === 0) return;
    d3.select("#grouped-bar-svg").selectAll("*").remove();
    initChart();
  }, [bars, size]);

  function initChart() {
    const svgHeight = 295;
    const svgWidth = size.width + margin.left + margin.right;
    const svg = d3
      .select("#grouped-bar-svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight);

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
      .domain(categoryGroups[selectedNode])
      .range([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(bars, (d) => d.count) || 0])
      .range([size.height - margin.bottom, margin.top]);

    const colorScales = {
      gpa: d3
        .scaleSequential(d3.interpolateGreens)
        .domain([0, categoryGroups["gpa"].length - 1]),
      age: d3
        .scaleSequential(d3.interpolatePurples)
        .domain([0, categoryGroups["age"].length - 1]),
      year: d3
        .scaleSequential(d3.interpolateReds)
        .domain([0, categoryGroups["year"].length - 1]),
      default: d3
        .scaleOrdinal()
        .domain(categoryGroups[selectedNode])
        .range(
          d3.schemeCategory10.filter(
            (color) => color !== "#1f77b4" && color !== "#ff7f0e"
          )
        ),
    };

    const color = (d: any) => {
      const group = categoryGroups[selectedNode];
      const index = group.indexOf(d);
      if (
        selectedNode === "gpa" ||
        selectedNode === "age" ||
        selectedNode === "year"
      ) {
        // Use sequential scales for ordinal attributes
        return colorScales[selectedNode](index);
      } else {
        // Use ordinal color scale for other attributes
        return colorScales.default(d);
      }
    };

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
      .attr("x", (d: any) => x1(d.categoryGroup)!)
      .attr("y", size.height - margin.bottom)
      .attr("width", x1.bandwidth())
      .attr("height", 0)
      .attr("stroke", "black")
      .attr("stroke-width", 0.2)
      .attr("fill", (d: any) => color(d.categoryGroup) as string)
      .transition()
      .duration(1000) //in milliseconds
      .delay((_, i) => i * 100)
      .attr("y", (d) => y(d.count))
      .attr("height", (d) => size.height - margin.bottom - y(d.count));

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
      .attr("x", -(size.height / 2))
      .attr("y", margin.left - 30)
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
      .text(`Mental Health Conditions by ${selectedNode}`);

    const legend = svg
      .append("g")
      .attr("pointer-events", "none")
      .attr(
        "transform",
        `translate(${size.width - margin.right + 5}, ${margin.top})`
      );

    categoryGroups[selectedNode].forEach((label, i) => {
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

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(0,0,0,0.7)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("box-shadow", "0px 4px 8px rgba(0,0,0,0.2)");

    svg
      .selectAll("rect")
      .on("mouseover", (event, d: any) => {
        tooltip
          .html(`Count: ${d.count}`)
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`)
          .style("visibility", "visible");
      })
      .on("mouseout", () => tooltip.style("visibility", "hidden"));
  }
  return (
    <div ref={barRef}>
      <svg id="grouped-bar-svg" />
    </div>
  );
};

export default GroupedBarChart;
