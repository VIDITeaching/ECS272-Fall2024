import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as d3Sankey from "d3-sankey";
import GroupedBarChart from "./GroupedBar";

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

interface SankeyDiagramProps {
  setSelectedNode: (node: any) => void;
}

const SankeyDiagram: React.FC<SankeyDiagramProps> = ({ setSelectedNode }) => {
  const [data, setData] = useState<{ nodes: Node[]; links: Link[] } | null>(
    null
  );
  const charRef = useRef<SVGSVGElement>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    display: boolean;
    content: string;
    x: number;
    y: number;
  }>({
    display: false,
    content: "",
    x: 0,
    y: 0,
  });

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
        { name: "18 - 19" },
        { name: "20 - 21" },
        { name: "22 - 23" },
        { name: "24+" },
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
        const age = getAgeRange(student["Age"] ?? "");

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

        incrementLinkValue(currentYear, age);
        incrementLinkValue(age, genderNode);
        incrementLinkValue(genderNode, maritalStatusNode);
        incrementLinkValue(maritalStatusNode, course);
        incrementLinkValue(course, gpaNode);
        incrementLinkValue(gpaNode, mentalHealthNode);
      });

      const links: Link[] = Object.values(linksMap);
      // console.log(links);
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

    const { nodes, links } = sankey({
      nodes: data.nodes.map((d: any) => ({ ...d })),
      links: data.links.map((d: any) => ({ ...d })),
    });

    // Remove existing nodes and links before rendering new ones
    svg.selectAll("*").remove();

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
      .attr("fill", "#B0C4DE")
      .on("click", (event, d: any) => {
        const isNodeActive = activeNode === d.name;
        setActiveNode(isNodeActive ? null : d.name);
        setTooltip({
          display: !isNodeActive,
          content: !isNodeActive
            ? `<strong>${d.name}</strong><br>
          <strong>Incoming Links:</strong><ul>${data.links
            .filter((link) => link.target === d.name)
            .map(
              (link) =>
                `<li>${link.source} → ${link.target}: ${link.value} students</li>`
            )
            .join("")}</ul>
          <strong>Outgoing Links:</strong><ul>${data.links
            .filter((link) => link.source === d.name)
            .map(
              (link) =>
                `<li>${link.source} → ${link.target}: ${link.value} students</li>`
            )
            .join("")}</ul>`
            : "",
          x: event.clientX,
          y: event.clientY,
        });

        if (d.name == "Female" || d.name == "Male") setSelectedNode("gender");
        else if (d.name == "Not Married" || d.name == "Married")
          setSelectedNode("marriage");
        else if (
          d.name == "year 1" ||
          d.name == "year 2" ||
          d.name == "year 3" ||
          d.name == "year 4"
        )
          setSelectedNode("year");
        else if (
          d.name == "STEM" ||
          d.name == "Humanities" ||
          d.name == "Business" ||
          d.name == "Medical" ||
          d.name == "Others"
        )
          setSelectedNode("course");
        else if (
          d.name == "18 - 19" ||
          d.name == "20 - 21" ||
          d.name == "22 - 23" ||
          d.name == "24+"
        )
          setSelectedNode("age");
        else if (
          d.name == "GPA: 0 - 1.99" ||
          d.name == "GPA: 2.00 - 2.49" ||
          d.name == "GPA: 2.50 - 2.99" ||
          d.name == "GPA: 3.00 - 3.49" ||
          d.name == "GPA: 3.50 - 4.00"
        )
          setSelectedNode("gpa");
      });

    rect.append("title").text((d: any) => `${d.name}\n${d.value!}`);

    const link = svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke-opacity", 0.5)
      .selectAll()
      .data(links)
      .join("g")
      .style("mix-blend-mode", "multiply");

    link
      .append("path")
      .attr("d", d3Sankey.sankeyLinkHorizontal())
      .attr("stroke", "gray") // Default color
      .attr("stroke-width", (d) => Math.max(1, d.width!));

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

    function updateLinkColor() {
      link
        .select("path")
        .transition()
        .duration(300)
        .attr("stroke", (d: any) =>
          d.source.name === activeNode || d.target.name === activeNode
            ? "orange"
            : "gray"
        );

      rect
        .transition()
        .duration(300)
        .attr("fill", (d: any) =>
          d.name === activeNode ? "orange" : "#B0C4DE"
        );
    }

    updateLinkColor();
  }, [data, activeNode]);

  const handleMouseLeave = () => {
    setTooltip({ display: false, content: "", x: 0, y: 0 });
  };

  return (
    <div>
      <svg ref={charRef}></svg>
      {tooltip.display && (
        <div
          className="tooltip"
          style={{
            position: "fixed",
            top: tooltip.y,
            left: tooltip.x,
            background: "rgba(255, 255, 255, 0.9)",
            border: "1px solid #ccc",
            borderRadius: "5px",
            padding: "5px",
            pointerEvents: "none",
            zIndex: 10,
          }}
          onMouseLeave={handleMouseLeave}
        >
          <div dangerouslySetInnerHTML={{ __html: tooltip.content }} />
        </div>
      )}
    </div>
  );
};

export default SankeyDiagram;
