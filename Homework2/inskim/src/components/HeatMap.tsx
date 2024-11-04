import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { isEmpty } from "lodash";
import { ComponentSize, Margin } from "../types";

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

interface ProcessedData {
  year: string;
  gpaRange: string;
  mentalIssues: number;
}

export default function HeatMap() {
  const [data, setData] = useState<ProcessedData[]>([]);
  const chartRef = useRef<SVGSVGElement>(null);
  const margin: Margin = { top: 30, right: 60, bottom: 180, left: 120 };

  useEffect(() => {
    const processData = async () => {
      const rawData = await d3.csv("../../data/StudentMentalHealth.csv");

      const gpaRanges = [
        { range: "0.00 - 1.99", min: 0, max: 1.99 },
        { range: "2.00 - 2.49", min: 2.0, max: 2.49 },
        { range: "2.50 - 2.99", min: 2.5, max: 2.99 },
        { range: "3.00 - 3.49", min: 3.0, max: 3.49 },
        { range: "3.50 - 4.00", min: 3.5, max: 4.0 },
      ];

      const allYears = [
        ...new Set(
          rawData.map((d: any) => d["Your current year of Study"].toLowerCase())
        ),
      ];
      const categoryCountMap = new Map<string, Map<string, number>>();

      allYears.forEach((year) => {
        const gpaMap = new Map<string, number>();
        gpaRanges.forEach((gpaRange) => {
          gpaMap.set(gpaRange.range, 0);
        });
        categoryCountMap.set(year, gpaMap);
      });

      rawData.forEach((student: any) => {
        const gpa =
          parseFloat(student["What is your CGPA?"].split(" - ")[0]) || 0;
        const year = student["Your current year of Study"].toLowerCase();
        const hasMentalIssues =
          student["Do you have Depression?"] === "Yes" ||
          student["Do you have Anxiety?"] === "Yes" ||
          student["Do you have Panic Attack"] === "Yes";

        const gpaRange = gpaRanges.find(
          (range) => gpa >= range.min && gpa <= range.max
        )?.range;

        if (gpaRange && hasMentalIssues) {
          categoryCountMap
            .get(year)!
            .set(gpaRange, categoryCountMap.get(year)!.get(gpaRange)! + 1);
        }
      });

      const finalData: ProcessedData[] = [];
      categoryCountMap.forEach((gpaMap, year) => {
        gpaMap.forEach((mentalIssues, gpaRange) => {
          finalData.push({
            year,
            gpaRange,
            mentalIssues,
          });
        });
      });

      console.log(finalData);
      setData(finalData);
    };

    processData();
  }, []);

  useEffect(() => {
    if (isEmpty(data)) return;
    drawHeatMap();
  }, [data]);

  function drawHeatMap() {
    const width = 780;
    const height = 470;

    const svg = d3
      .select(chartRef.current)
      .attr("width", width)
      .attr("height", height);

    const xScale = d3
      .scalePoint()
      .domain(data.map((d: ProcessedData) => d.year))
      .range([margin.left, width - margin.right])
      .padding(0.5);

    const yScale = d3
      .scaleBand()
      .domain([
        "0.00 - 1.99",
        "2.00 - 2.49",
        "2.50 - 2.99",
        "3.00 - 3.49",
        "3.50 - 4.00",
      ])
      .range([height - margin.bottom, margin.top])
      .padding(0.1);

    const colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(data, (d: ProcessedData) => d.mentalIssues) || 10]);

    svg.selectAll("*").remove();

    // X-axis
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
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
      .attr("y", (d: ProcessedData) => yScale(d.gpaRange)!)
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
        (d: ProcessedData) => yScale(d.gpaRange)! + yScale.bandwidth() / 2
      )
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text((d: ProcessedData) => (d.mentalIssues > 0 ? d.mentalIssues : "0"));

    svg
      .append("text")
      .attr("class", "x-axis-label")
      .attr("x", width - 350)
      .attr("y", height - margin.bottom / 2 - 55)
      .attr("text-anchor", "middle")
      .text("Year of Study")
      .style("font-size", "14px");

    svg
      .append("text")
      .attr("class", "y-axis-label")
      .attr("x", -(height - margin.top - margin.bottom) / 2 - 35)
      .attr("y", margin.right - 10)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("Student's GPA Range")
      .style("font-size", "14px");

    svg
      .append("text")
      .attr("x", (width - margin.left - margin.right) / 2 + 130)
      .attr("y", margin.top - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Students with at least one mental health issues");

    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${width - margin.right + 10}, ${margin.top})`
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

  return <svg ref={chartRef}></svg>;
}
