import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Selection } from 'd3';
import { useDashboardStore } from '../stores/dashboardStore';
import { processSankeyData, processParallelPlotData, parseCSV } from '../utils/dataProcessing';
import { sankey, sankeyLinkHorizontal, SankeyGraph } from 'd3-sankey';
import { SankeyNode, SankeyLink } from 'd3-sankey';
import AlcoholConsumptionDashboard from './AlcoholConsumptionDashboard';
import { Box, Divider, Grid, Paper, Typography } from '@mui/material';

const Dashboard: React.FC = () => {
  const { 
    students,  
    // scatterData, 
    sankeyData, 
    loading,
    setStudents, 
    // setScatterData, 
    setSankeyData, 
    setLoading,
  } = useDashboardStore();
  
 
  // const barChartRef = useRef<SVGSVGElement>(null);
  const sankeyChartRef = useRef<SVGSVGElement>(null);
  // const scatterPlotRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/student-mat.csv');
        const text = await response.text();
        const parsedData = parseCSV(text);
        setStudents(parsedData);
        // setScatterData(processScatterData(parsedData));
        setSankeyData(processSankeyData(parsedData));
        setLoading(false);
      } catch (error) {
        console.error('Error loading CSV:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!loading && students.length > 0) {
      createSankeyDiagram();
      // createScatterPlot();
    }
  }, [loading, sankeyData]);



const createSankeyDiagram = () => {
  if (!sankeyChartRef.current) return;

  const svg = d3.select(sankeyChartRef.current);
  svg.selectAll("*").remove();

  // Increased margins to accommodate legends and labels
  const margin = { top: 40, right: 160, bottom: 40, left: 40 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const mainG = svg
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Define color schemes with meaningful gradients
  const colorScales = {
    schools: d3.scaleOrdinal()
      .domain(['GP', 'MS'])
      .range(['#2E86C1', '#3498DB']), // Blue shades for schools
    
    gender: d3.scaleOrdinal()
      .domain(['Male', 'Female'])
      .range(['#884EA0', '#C39BD3']), // Purple shades for gender
    
    grades: d3.scaleOrdinal()
      .domain(['High Grade', 'Medium Grade', 'Low Grade'])
      .range(['#27AE60', '#F1C40F', '#E74C3C']) // Green, Yellow, Red for grades
  };

  // Process data (your existing data processing code here)
  const enhancedData = {
    nodes: [
      { name: 'GP', category: 'schools' },
      { name: 'MS', category: 'schools' },
      { name: 'Male', category: 'gender' },
      { name: 'Female', category: 'gender' },
      { name: 'High Grade', category: 'grades' },
      { name: 'Medium Grade', category: 'grades' },
      { name: 'Low Grade', category: 'grades' }
    ],
    links: [
      // School to Gender
      {
        source: 0,
        target: 2,
        value: students.filter(s => s.school === 'GP' && s.sex === 'M').length
      },
      {
        source: 0,
        target: 3,
        value: students.filter(s => s.school === 'GP' && s.sex === 'F').length
      },
      {
        source: 1,
        target: 2,
        value: students.filter(s => s.school === 'MS' && s.sex === 'M').length
      },
      {
        source: 1,
        target: 3,
        value: students.filter(s => s.school === 'MS' && s.sex === 'F').length
      },
      // Gender to Grade Levels
      {
        source: 2,
        target: 4,
        value: students.filter(s => s.sex === 'M' && ((s.G1 + s.G2 + s.G3) / 3) > 15).length
      },
      {
        source: 2,
        target: 5,
        value: students.filter(s => s.sex === 'M' && ((s.G1 + s.G2 + s.G3) / 3) >= 10 && ((s.G1 + s.G2 + s.G3) / 3) <= 15).length
      },
      {
        source: 2,
        target: 6,
        value: students.filter(s => s.sex === 'M' && ((s.G1 + s.G2 + s.G3) / 3) < 10).length
      },
      {
        source: 3,
        target: 4,
        value: students.filter(s => s.sex === 'F' && ((s.G1 + s.G2 + s.G3) / 3) > 15).length
      },
      {
        source: 3,
        target: 5,
        value: students.filter(s => s.sex === 'F' && ((s.G1 + s.G2 + s.G3) / 3) >= 10 && ((s.G1 + s.G2 + s.G3) / 3) <= 15).length
      },
      {
        source: 3,
        target: 6,
        value: students.filter(s => s.sex === 'F' && ((s.G1 + s.G2 + s.G3) / 3) < 10).length
      }
    ]
  };

  const sankeyGenerator = sankey<Node, d3.Link>()
    .nodeWidth(25)
    .nodePadding(15)
    .extent([[0, 0], [width, height]]);

  const { nodes, links } = sankeyGenerator({
    nodes: enhancedData.nodes.map((d, i) => ({ ...d, id: i.toString() })),
    links: enhancedData.links
  });

  // Add gradient definitions for links
  const gradient = mainG.append("defs")
    .selectAll("linearGradient")
    .data(links)
    .join("linearGradient")
    .attr("id", (d, i) => `gradient-${i}`)
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", d => d.source.x1 ?? 0)
    .attr("x2", d => d.target.x0 ?? 0);

  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", d => {
      const sourceNode = d.source as Node;
      const category = sourceNode.category as keyof typeof colorScales;
      return colorScales[category](sourceNode.name);
    });

  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", d => {
      const targetNode = d.target as Node;
      const category = targetNode.category as keyof typeof colorScales;
      return colorScales[category](targetNode.name);
    });

  // Draw links with gradients
  const link = mainG.append("g")
    .selectAll(".link")
    .data(links)
    .join("path")
    .attr("class", "link")
    .attr("d", sankeyLinkHorizontal())
    .attr("stroke", (d, i) => `url(#gradient-${i})`)
    .attr("stroke-width", d => Math.max(1, d.width ?? 0))
    .attr("fill", "none")
    .attr("opacity", 0.7)
    .style("mix-blend-mode", "multiply");

  // Add hover effects and tooltips for links
  link.on("mouseover", function(event, d) {
      d3.select(this)
        .attr("opacity", 1)
        .attr("stroke-width", d => Math.max(2, (d.width ?? 0) * 1.2));

      // Add tooltip
      const tooltip = d3.select(".tooltip");
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(`Flow: ${d.source.name} → ${d.target.name}<br/>${d.value} students`)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this)
        .attr("opacity", 0.7)
        .attr("stroke-width", d => Math.max(1, d.width ?? 0));
      
      d3.select(".tooltip").transition()
        .duration(500)
        .style("opacity", 0);
    });

  // Draw nodes
  const node = mainG.append("g")
    .selectAll(".node")
    .data(nodes)
    .join("rect")
    .attr("class", "node")
    .attr("x", d => d.x0 ?? 0)
    .attr("y", d => d.y0 ?? 0)
    .attr("height", d => (d.y1 ?? 0) - (d.y0 ?? 0))
    .attr("width", d => (d.x1 ?? 0) - (d.x0 ?? 0))
    .attr("fill", d => {
      const category = d.category as keyof typeof colorScales;
      return colorScales[category](d.name);
    })
    .attr("opacity", 0.8);

  // Add node labels
  mainG.append("g")
    .selectAll(".node-label")
    .data(nodes)
    .join("text")
    .attr("class", "node-label")
    .attr("x", d => (d.x0 ?? 0) < width / 2 ? (d.x1 ?? 0) + 6 : (d.x0 ?? 0) - 6)
    .attr("y", d => ((d.y1 ?? 0) + (d.y0 ?? 0)) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => (d.x0 ?? 0) < width / 2 ? "start" : "end")
    .attr("fill", "#2c3e50")
    .attr("font-size", "12px")
    .text(d => `${d.name} (${d.value})`);

  // Add legends
  const legendGroups = [
    { title: 'Schools', items: ['GP', 'MS'], scale: colorScales.schools },
    { title: 'Gender', items: ['Male', 'Female'], scale: colorScales.gender },
    { title: 'Grade Levels', items: ['High Grade', 'Medium Grade', 'Low Grade'], scale: colorScales.grades }
  ];

  const legendG = mainG.append("g")
    .attr("transform", `translate(${width + 20}, 0)`);

  legendGroups.forEach((group, groupIndex) => {
    const legendGroup = legendG.append("g")
      .attr("transform", `translate(0, ${groupIndex * 100})`);

    // Add group title
    legendGroup.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-weight", "bold")
      .attr("font-size", "12px")
      .text(group.title);

    // Add legend items
    const items = legendGroup.selectAll(".legend-item")
      .data(group.items)
      .join("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${20 + i * 20})`);

    items.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", d => group.scale(d));

    items.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .attr("font-size", "12px")
      .text(d => d);
  });


  // Add tooltips container
  d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("padding", "8px")
    .style("border", "1px solid #ddd")
    .style("border-radius", "4px")
    .style("pointer-events", "none");
};


  // const createScatterPlot = () => {
  //   if (!scatterPlotRef.current) return;

  //   const svg = d3.select(scatterPlotRef.current);
  //   svg.selectAll("*").remove();

  //   const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  //   const width = 600 - margin.left - margin.right;
  //   const height = 400 - margin.top - margin.bottom;

  //   const x = d3.scaleLinear()
  //     .range([0, width]);

  //   const y = d3.scaleLinear()
  //     .range([height, 0]);

  //   const g = svg.append("g")
  //     .attr("transform", `translate(${margin.left},${margin.top})`);

  //   x.domain([0, d3.max(scatterData, d => d.absences) as number]);
  //   y.domain([0, d3.max(scatterData, d => d.averageGrade) as number]);

  //   g.append("g")
  //     .attr("transform", `translate(0,${height})`)
  //     .call(d3.axisBottom(x));

  //   g.append("g")
  //     .call(d3.axisLeft(y));

  //   g.selectAll(".dot")
  //     .data(scatterData)
  //     .enter().append("circle")
  //     .attr("class", "dot")
  //     .attr("cx", d => x(d.absences))
  //     .attr("cy", d => y(d.averageGrade))
  //     .attr("r", 3)
  //     .attr("fill", d => d.school === 'GP' ? "#8884d8" : "#82ca9d");
  // };
 


  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <Grid container spacing={3}>
        {/* Sankey Diagram */}
        <Grid item xs={12}>
          <Paper className="mb-6 bg-gradient-to-r from-indigo-900 to-indigo-700">
            <Typography variant="h6" className="mb-3 font-bold" align="center">
              Student Flow: School to Gender to Grade Level (Math Course)
            </Typography>
            <Divider className="mb-4" />

            <Box className="w-full h-[500px]" align="center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <svg ref={sankeyChartRef} className="w-full h-full" />
            </Box>
            <Typography variant="body1" className="mb-3 text-gray-600 text-center" align='center' sx={{ fontSize: '1rem' }}>
                Visualization of student distribution across schools, gender, and grade levels in Mathematics
            </Typography>
          </Paper>
        </Grid>

        {/* Alcohol Consumption Analysis */}
        <Grid item xs={12}>
          <AlcoholConsumptionDashboard />
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;