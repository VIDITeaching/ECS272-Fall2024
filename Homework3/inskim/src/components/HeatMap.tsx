import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { isEmpty } from "lodash";
import { ComponentSize, Margin } from "../types";
import { useResizeObserver, useDebounceCallback } from "usehooks-ts";

// Visualize what data is gathered
interface StudentData {
  gender: string;
  age: number;
  course: string;
  currentYear: string;
  gpa: string;
  maritalStatus: string;
  depression: string;
  anxiety: string;
  panicAttack: string;
}

type CategoryKey = "age" | "gpa" | "gender" | "marriage" | "course";

interface ProcessedData {
  year: string;
  yValue: string;
  mentalIssues: number;
}

const categorizeCourseName = (course: string) => {
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

const gpaRanges = [
  { range: "0.00 - 1.99", min: 0, max: 1.99 },
  { range: "2.00 - 2.49", min: 2.0, max: 2.49 },
  { range: "2.50 - 2.99", min: 2.5, max: 2.99 },
  { range: "3.00 - 3.49", min: 3.0, max: 3.49 },
  { range: "3.50 - 4.00", min: 3.5, max: 4.0 },
];

// add groups here for various choices
const categoryGroups: Record<CategoryKey, string[]> = {
  age: ageRanges.map((d) => d.range),
  gpa: gpaRanges.map((d) => d.range),
  gender: ["Female", "Male"],
  marriage: ["Married", "Not Married"],
  course: ["STEM", "Humanities", "Business", "Medical", "Others"],
};

const yAxisLabels = {
  age: "Student's Age Range",
  gpa: "Student's GPA Range",
  gender: "Student's Gender",
  course: "Course taking",
  marriage: "Marital Status",
};

export default function HeatMap() {
  const [data, setData] = useState<ProcessedData[]>([]);
  // default heat map would be exploring age vs. year
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("age");
  const chartRef = useRef<SVGSVGElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 30, right: 60, bottom: 190, left: 120 };

  const onResize = useDebounceCallback(
    (size: ComponentSize) => setSize(size),
    200
  );

  useResizeObserver({ ref: chartContainerRef, onResize });

  useEffect(() => {
    const processData = async () => {
      const rawData = await d3.csv("../../data/StudentMentalHealth.csv");

      const allYears = [
        ...new Set(
          rawData.map((d: any) => d["Your current year of Study"].toLowerCase())
        ),
      ];

      const categoryCountMap = new Map<string, Map<string, number>>();
      allYears.forEach((year) => {
        const yMap = new Map<string, number>();
        categoryGroups[selectedCategory].forEach((yValue) => {
          yMap.set(yValue, 0);
        });
        categoryCountMap.set(year, yMap);
      });

      rawData.forEach((student: any) => {
        const year = student["Your current year of Study"].toLowerCase();
        const hasMentalIssues =
          student["Do you have Depression?"] === "Yes" ||
          student["Do you have Anxiety?"] === "Yes" ||
          student["Do you have Panic Attack"] === "Yes";

        let yValue;
        if (selectedCategory == "age") {
          const age = parseFloat(student["Age"].split(" - ")[0]) || 0;
          yValue = ageRanges.find(
            (range) => age >= range.min && age <= range.max
          )?.range;
        } else if (selectedCategory === "gpa") {
          const gpa =
            parseFloat(student["What is your CGPA?"].split(" - ")[0]) || 0;
          yValue = gpaRanges.find(
            (range) => gpa >= range.min && gpa <= range.max
          )?.range;
        } else if (selectedCategory === "gender") {
          yValue = student["Choose your gender"];
        } else if (selectedCategory === "marriage") {
          const status = student["Marital status"];
          if (status === "Yes") yValue = "Married";
          else yValue = "Not Married";
        } else {
          yValue = categorizeCourseName(student["What is your course?"]);
        }

        if (yValue && hasMentalIssues) {
          categoryCountMap
            .get(year)!
            .set(yValue, categoryCountMap.get(year)!.get(yValue)! + 1);
        }
      });

      const finalData: ProcessedData[] = [];
      categoryCountMap.forEach((yMap, year) => {
        yMap.forEach((mentalIssues, yValue) => {
          finalData.push({
            year,
            yValue,
            mentalIssues,
          });
        });
      });

      console.log(finalData);
      setData(finalData);
    };

    processData();
  }, [selectedCategory]);

  useEffect(() => {
    if (isEmpty(data)) return;
    if (size.width === 0 || size.height === 0) return;
    drawHeatMap();
  }, [data, size]);

  function drawHeatMap() {
    const width = 960;
    const height = 405;

    const svg = d3
      .select(chartRef.current)
      .attr("width", width)
      .attr("height", height);

    const xScale = d3
      .scalePoint()
      .domain(data.map((d: ProcessedData) => d.year))
      .range([margin.left, size.width - margin.right])
      .padding(0.5);

    const yScale = d3
      .scaleBand()
      .domain(data.map((d) => d.yValue))
      .range([size.height - margin.bottom, margin.top])
      .padding(0.1);

    const colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(data, (d: ProcessedData) => d.mentalIssues) || 10]);

    svg.selectAll("*").remove();

    // X-axis
    svg
      .append("g")
      .attr("transform", `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));

    svg
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr(
        "x",
        (d: ProcessedData) => xScale(d.year)! - (xScale.step() - 10) / 2
      )
      .attr("y", (d: ProcessedData) => yScale(d.yValue)!)
      .attr("width", xScale.step() - 10)
      .attr("height", yScale.bandwidth())
      .attr("fill", (d: ProcessedData) => colorScale(d.mentalIssues))
      .attr("stroke", "black");

    svg
      .selectAll("text.numbers")
      .data(data)
      .join("text")
      .attr("class", "numbers")
      .attr("x", (d: ProcessedData) => xScale(d.year)!)
      .attr(
        "y",
        (d: ProcessedData) => yScale(d.yValue)! + yScale.bandwidth() / 2
      )
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text((d: ProcessedData) => (d.mentalIssues > 0 ? d.mentalIssues : "0"));

    svg
      .append("text")
      .attr("class", "x-axis-label")
      .attr("x", size.width / 2 + 30)
      .attr("y", size.height - margin.bottom / 2 - 65)
      .attr("text-anchor", "middle")
      .text("Year of Study")
      .style("font-size", "14px");

    svg
      .append("text")
      .attr("class", "y-axis-label")
      .attr("x", -(size.height - margin.top - margin.bottom) / 2 - 35)
      .attr("y", margin.right - 10)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text(yAxisLabels[selectedCategory])
      .style("font-size", "14px");

    svg
      .append("text")
      .attr("x", (size.width - margin.left - margin.right) / 2 + 130)
      .attr("y", margin.top - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Students with at least one mental health issues");

    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${size.width - margin.right + 10}, ${margin.top})`
      );

    const legendGradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "legendGradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    legendGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", d3.interpolateBlues(0));

    legendGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", d3.interpolateBlues(1));

    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 20)
      .attr("height", 100)
      .style("fill", "url(#legendGradient)");

    const legendScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d: ProcessedData) => d.mentalIssues) || 10])
      .range([100, 0]);

    legend
      .append("g")
      .attr("transform", `translate(20, 0)`)
      .call(d3.axisRight(legendScale));
  }

  return (
    <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }}>
      <select
        onChange={(e) => setSelectedCategory(e.target.value as CategoryKey)}
        value={selectedCategory}
      >
        <option value="age">Age</option>
        <option value="gpa">GPA</option>
        <option value="gender">Gender</option>
        <option value="marriage">Martial Status</option>
        <option value="course">Current Course</option>
      </select>
      <svg ref={chartRef} width={size.width} height={size.height}></svg>
    </div>
  );
}
