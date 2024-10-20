import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as d3Sankey from "d3-sankey";

interface StudentData {
  age: string;
  maritalStatus: string;
  currentYear: string;
  gpa: string;
  depression: string;
  anxiety: string;
  panicAttack: string;
  seenSpecialist: string;
}

interface Node {
  name: string;
  value?: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
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

export default function SankeyDiagram() {
  const [data, setData] = useState<{ nodes: Node[]; links: Link[] } | null>(
    null
  );
  const charRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const processData = async () => {
      const rawData = await d3.csv("../../data/StudentMentalHealth.csv");

      const nodes: any[] = [
        { name: "Male" },
        { name: "Female" },
        { name: "Married" },
        { name: "Not Married" },
        { name: "year 1" },
        { name: "year 2" },
        { name: "year 3" },
        { name: "year 4" },
        { name: "STEM" },
        { name: "Medical" },
        { name: "Business" },
        { name: "Humanities" },
        { name: "Others" },
        { name: "GPA: 0 - 1.99" },
        { name: "GPA: 2.00 - 2.49" },
        { name: "GPA: 2.50 - 2.99" },
        { name: "GPA: 3.00 - 3.49" },
        { name: "GPA: 3.50 - 4.00" },
        { name: "Depression" },
        { name: "Anxiety" },
        { name: "Panic Attack" },
        { name: "Multiple Conditions" },
        { name: "None" },
        { name: "Specialist Treatment" },
        { name: "No Specialist" },
      ];

      const linksMap: { [key: string]: Link } = {};

      rawData.forEach((student) => {
        const mentalHealth: string[] = [];
        if (student["Do you have Depression?"] === "Yes")
          mentalHealth.push("Depression");
        if (student["Do you have Anxiety?"] === "Yes")
          mentalHealth.push("Anxiety");
        if (student["Do you have Panic attack?"] === "Yes")
          mentalHealth.push("Panic Attack");

        const mentalHealthNode =
          mentalHealth.length > 1
            ? "Multiple Conditions"
            : mentalHealth[0] || "None";

        const gpaRange = student["What is your CGPA?"].trim();
        const gpaNode =
          gpaRange === "0 - 1.99"
            ? "GPA: 0 - 1.99"
            : gpaRange === "2.00 - 2.49"
            ? "GPA: 2.00 - 2.49"
            : gpaRange === "2.50 - 2.99"
            ? "GPA: 2.50 - 2.99"
            : gpaRange === "3.00 - 3.49"
            ? "GPA: 3.00 - 3.49"
            : gpaRange === "3.50 - 4.00"
            ? "GPA: 3.50 - 4.00"
            : "None";

        const gender = student["Choose your gender"].trim();
        const currentYear = student["Your current year of Study"].toLowerCase();
        const course = categorizeCourseName(student["What is your course?"]);

        const createLinkKey = (source: string, target: string) =>
          `${source}->${target}`;

        const genderNode = gender === "Male" ? "Male" : "Female";
        const maritalStatusNode =
          student["Marital status"] === "Yes" ? "Married" : "Not Married";

        const incrementLinkValue = (source: string, target: string) => {
          const key = createLinkKey(source, target);
          if (linksMap[key]) {
            linksMap[key].value += 1;
          } else {
            linksMap[key] = { source, target, value: 1 };
          }
        };

        incrementLinkValue(genderNode, maritalStatusNode);
        incrementLinkValue(maritalStatusNode, currentYear);
        incrementLinkValue(currentYear, course);
        incrementLinkValue(course, gpaNode);
        incrementLinkValue(gpaNode, mentalHealthNode);
        incrementLinkValue(
          mentalHealthNode,
          student["Did you seek any specialist for a treatment?"] === "Yes"
            ? "Specialist Treatment"
            : "No Specialist"
        );
      });

      //console.log("Links Map: ", linksMap);
      const links: Link[] = Object.values(linksMap);
      // const sankeyData: SankeyGraph<Node, Link> = { nodes, links };
      setData({ nodes, links });
    };

    processData();
  }, []);

  useEffect(() => {
    if (!data || data.nodes.length === 0) return;

    const width = 1100;
    const height = 400;

    const svg = d3
      .select(charRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 13px sans-serif;");

    const sankey = d3Sankey
      .sankey()
      .nodeId((d: any) => d.name)
      .nodeAlign(d3Sankey.sankeyRight)
      .nodeWidth(15)
      .nodePadding(10)
      .extent([
        [1, 5],
        [width - 1, height - 6],
      ]);

    // console.log(data);
    // console.log("Nodes:", data.nodes);
    // console.log("Links:", data.links);

    const { nodes, links } = sankey({
      nodes: data.nodes.map((d: any) => ({ ...d })),
      links: data.links.map((d: any) => ({ ...d })),
    });

    const defs = svg.append("defs");

    defs
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%")
      .selectAll("stop")
      .data([
        { offset: "0%", color: "#cccccc" },
        { offset: "100%", color: "#666666" },
      ])
      .join("stop")
      .attr("offset", (d) => d.offset)
      .attr("stop-color", (d) => d.color);

    const rect = svg
      .append("g")
      .attr("stroke", "#000")
      .selectAll("rect")
      .data(nodes)
      .join("rect")
      .attr("x", (d) => d.x0!)
      .attr("y", (d) => d.y0!)
      .attr("height", (d) => d.y1! - d.y0!)
      .attr("width", (d) => d.x1! - d.x0!)
      .attr("fill", "#B0C4DE");

    rect.append("title").text((d: any) => `${d.name}\n${d.value!} TWh`);

    const link = svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke-opacity", 0.5)
      .selectAll()
      .data(links)
      .join("g")
      .style("mix-belnd-mode", "multiply");

    link
      .append("path")
      .attr("d", d3Sankey.sankeyLinkHorizontal())
      .attr("stroke", "url(#gradient)")
      .attr("stroke-width", (d) => Math.max(1, d.width!))
      .text(
        (d: any) => `${d.source.name} -> ${d.target.name}\n${d.value!} TWh`
      );

    svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("x", (d) => (d.x0! < width / 2 ? d.x1! + 6 : d.x0! - 6))
      .attr("y", (d) => (d.y1! + d.y0!) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.x0! < width / 2 ? "start" : "end"))
      .text((d: any) => d.name);
  }, [data]);

  return <svg ref={charRef}></svg>;
}
