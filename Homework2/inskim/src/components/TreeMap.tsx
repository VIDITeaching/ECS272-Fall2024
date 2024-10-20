import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { isEmpty } from "lodash";

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

interface TreemapNode extends d3.HierarchyRectangularNode<any> {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export default function TreeMap() {
  const [data, setData] = useState<any>(null);
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const processData = async () => {
      const rawData = await d3.csv("../../data/StudentMentalHealth.csv");

      // Process the data to group by year of study and GPA, and mental health conditions
      const nestedData = d3.group(
        rawData,
        (d: any) => d["Your current year of Study"].toLowerCase(),
        (d: any) => d["What is your CGPA?"].trim()
      );

      const hierarchyData = {
        name: "Students",
        children: Array.from(nestedData, ([year, gpaGroup]) => ({
          name: year,
          children: Array.from(gpaGroup, ([gpa, students]) => ({
            name: gpa,
            children: students.reduce((acc: any[], student: any) => {
              const conditions = [
                student["Do you have Depression?"] === "Yes"
                  ? "Depression"
                  : null,
                student["Do you have Anxiety?"] === "Yes" ? "Anxiety" : null,
                student["Do you have Panic attack?"] === "Yes"
                  ? "Panic Attack"
                  : null,
              ].filter(Boolean);

              // Create a unique name for the mental health condition
              const conditionName =
                conditions.length > 1
                  ? "Multiple Conditions"
                  : conditions[0] || "None";

              // Increment the value for each condition type
              const existingCondition = acc.find(
                (item) => item.name === conditionName
              );
              if (existingCondition) {
                existingCondition.value += 1; // Increment count
              } else {
                acc.push({ name: conditionName, value: 1 }); // Add new condition
              }

              return acc;
            }, []),
          })),
        })),
      };
      //console.log(hierarchyData);
      setData(hierarchyData);
    };

    processData();
  }, []);

  useEffect(() => {
    if (isEmpty(data)) return;
    d3.select("#treemap-svg").selectAll("*").remove();
    drawTreeMap();
  }, [data]);

  function drawTreeMap() {
    const width = 960;
    const height = 500;

    const root = d3
      .hierarchy<any>(data)
      .sum((d: any) => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    d3.treemap<any>().size([width, height]).padding(0).round(true)(root);

    const svg = d3
      .select(chartRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("font", "10px sans-serif");

    // Define color scale
    const colorScale = d3
      .scaleOrdinal()
      .domain([
        "Depression",
        "Anxiety",
        "Panic Attack",
        "Multiple Conditions",
        "None",
      ])
      .range(["#ff9999", "#66b3ff", "#99ff99", "#ffcc99", "#cccccc"]);

    const leaf = svg
      .selectAll("g")
      .data(root.leaves() as TreemapNode[])
      .join("g")
      .attr("transform", (d) => `translate(${d.x0}, ${d.y0})`);

    leaf
      .append("rect")
      .attr("id", (d) => d.data.name)
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d: TreemapNode) => colorScale(d.data.name) as string)
      .attr("fill-opacity", 0.6);
    /*.on("mouseover", function (event, d) {
        const tooltip = d3.select("#tooltip");
        tooltip
          .style("opacity", 1)
          .html(
            `Year: ${
              d.parent.parent.data.name.split(" ")[1] || "None"
            }<br>GPA: ${
              d.parent.data.name.split(" ")[0] || "None"
            }<br>Condition: ${d.data.name.split(" ")[0] || "None"}`
          )
          .style("left", `${event.pageX + 5}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", function () {
        d3.select("#tooltip").style("opacity", 0);
      });*/

    leaf
      .append("text")
      .attr("clip-path", (d) => `url(#clip-${d.data.name})`)
      .selectAll("tspan")
      .data((d) => [d.data.name, d.value])
      .join("tspan")
      .attr("x", 3)
      .attr("y", (d, i) => 13 + i * 10)
      .text((d) => d);

    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - 150}, 20)`);

    legend.append("text").text("Legend").attr("font-weight", "bold");

    const years = Array.from(
      new Set(root.children?.map((child) => child.name))
    );
    const gpas = Array.from(
      new Set(
        root.children?.flatMap((child) =>
          child.children?.map((gpaChild) => gpaChild.name)
        )
      )
    );

    years.forEach((year, i) => {
      legend
        .append("rect")
        .attr("x", 0)
        .attr("y", (i + 1) * 20)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", d3.scaleOrdinal(d3.schemeCategory10)(year));
      legend
        .append("text")
        .attr("x", 15)
        .attr("y", (i + 1) * 20 + 10)
        .text(year);
    });

    // Future possible interaction method
    /*d3.select("body")
      .append("div")
      .attr("id", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "5px")
      .style("border-radius", "5px")
      .style("pointer-events", "none");*/
  }

  return <svg ref={chartRef} width={960} height={500}></svg>;
}
