import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { isEmpty } from "lodash";
import { ComponentSize, Margin } from "../types";

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
  gpa: number;
  total: number; // Total number of students
  mentalIssues: number; // Total number of students with at least one mental issues
}

export default function BalloonPlot() {
  const [data, setData] = useState<any>(null);
  const chartRef = useRef<SVGSVGElement>(null);
  const [Hsize, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 40, right: 20, bottom: 80, left: 60 };

  useEffect(() => {
    const processData = async () => {
      const rawData = await d3.csv("../../data/StudentMentalHealth.csv");

      // Process data to group by year of study and GPA
      const groupedData = d3.group(
        rawData,
        (d: any) => d["Your current year of Study"].toLowerCase(),
        (d: any) => d["What is your CGPA?"].trim()
      );

      const processedData = Array.from(groupedData, ([year, gpaGroup]) => {
        return Array.from(gpaGroup, ([gpa, students]) => {
          const totalStudents = students.length;
          const totalStudentsWithMentalIssues = students.filter(
            (student: any) =>
              student["Do you have Depression?"] === "Yes" ||
              student["Do you have Anxiety?"] === "Yes" ||
              student["Do you have Panic Attack"] === "Yes"
          ).length;

          const gpaLowerLimit = parseFloat(gpa.split(" - ")[0]) || 0;

          return {
            year: year,
            gpa: gpaLowerLimit,
            total: totalStudents,
            mentalIssues: totalStudentsWithMentalIssues,
          };
        });
      }).flat();

      console.log(processedData);
      setData(processedData);
    };

    processData();
  }, []);

  useEffect(() => {
    if (isEmpty(data)) return;
    drawBalloonPlot();
  }, [data]);

  function drawBalloonPlot() {
    const width = 960;
    const height = 470;

    const svg = d3
      .select(chartRef.current)
      .attr("width", width)
      .attr("height", height);

    // Create scales (x and y)
    const xScale = d3
      .scalePoint()
      .domain(data.map((d: any) => d.year))
      .range([50, width - 200])
      .padding(0.5);

    const yScale = d3
      .scaleLinear()
      .domain([0, 4]) // GPA scale
      .range([height - 50, 50]);

    const radiusScaleTotal = d3
      .scaleSqrt<number>()
      .domain([0, 23])
      .range([0, 40]);

    const radiusScaleMentalIssues = d3
      .scaleSqrt<number>()
      .domain([0, 11])
      .range([0, 30]);

    // X-axis
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - 50})`)
      .call(d3.axisBottom(xScale));

    // Y-axis
    svg
      .append("g")
      .attr("transform", `translate(50, 0)`)
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format(".1f")));

    // Draw outer circles (total number of students)
    svg
      .selectAll("outer-circle")
      .data(data)
      .join("circle")
      .attr("cx", (d: ProcessedData) => xScale(d.year)!)
      .attr("cy", (d: ProcessedData) => yScale(d.gpa)!)
      .attr("r", (d: ProcessedData) => radiusScaleTotal(d.total)!)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 0.7);

    svg
      .selectAll("inner-circle")
      .data(data)
      .join("circle")
      .attr("cx", (d: ProcessedData) => xScale(d.year)!)
      .attr("cy", (d: ProcessedData) => yScale(d.gpa)!)
      .attr("r", (d: ProcessedData) => radiusScaleMentalIssues(d.mentalIssues)!)
      .attr("fill", "steelblue")
      .attr("opacity", 0.7);

    // Add the x-axis label
    svg
      .append("text")
      .attr("class", "x-axis-label")
      .attr("x", (width - margin.left - margin.right) / 2 - 40)
      .attr("y", Hsize.height + 480)
      .attr("text-anchor", "middle")
      .text("Year of Study")
      .style("font-size", "14px");

    // y-axis label
    svg
      .append("text")
      .attr("class", "y-axis-label")
      .attr("x", -(Hsize.height - margin.top - margin.bottom) / 2 - 310)
      .attr("y", 20)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("Student's GPA (Lower Boundary)")
      .style("font-size", "14px");

    //Title
    svg
      .append("text")
      .attr("x", (Hsize.width - margin.left - margin.right) / 2 + 450)
      .attr("y", margin.top / 1)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Mentally Ill Students for corresponding GPA and year of study");

    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - 220}, ${margin.top})`);

    // Legend box
    legend
      .append("rect")
      .attr("x", -20)
      .attr("y", -20)
      .attr("width", 180)
      .attr("height", 100)
      .attr("fill", "none")
      .attr("stroke", "black");

    legend
      .append("text")
      .attr("x", -10)
      .attr("y", 0)
      .text("Legend:")
      .style("font-size", "14px")
      .style("font-weight", "bold");

    // Legend for outer & inner circles
    legend
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 20)
      .attr("r", 10)
      .attr("fill", "none")
      .attr("stroke", "black");

    legend
      .append("text")
      .attr("x", 18)
      .attr("y", 21)
      .text(": Total Students")
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");

    legend
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 50)
      .attr("r", 10)
      .attr("fill", "steelblue")
      .attr("opacity", 0.7);

    legend
      .append("text")
      .attr("x", 18)
      .attr("y", 54)
      .text(": Students w/ at least one")
      .style("font-size", "12px");
    legend
      .append("text")
      .attr("x", 38)
      .attr("y", 68)
      .text("mental health issues")
      .style("font-size", "12px");

    const circleSizeLegend = svg
      .append("g")
      .attr("transform", "translate(750, 150)");

    const sizes = [5, 10, 15, 20];
    sizes.forEach((size, i) => {
      circleSizeLegend
        .append("circle")
        .attr("cx", 30)
        .attr("cy", i * 40 + 10)
        .attr("r", size)
        .attr("fill", "none")
        .attr("stroke", "black");

      circleSizeLegend
        .append("text")
        .attr("x", 55)
        .attr("y", i * 40 + 10)
        .text(`: ${size} Students`)
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
    });

    circleSizeLegend
      .append("text")
      .attr("x", -30)
      .attr("y", -10)
      .text("Circle Size Scale:")
      .style("font-size", "14px")
      .style("font-weight", "bold");
  }

  return <svg ref={chartRef}></svg>;
}
