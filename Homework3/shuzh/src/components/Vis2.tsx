import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { CSSProperties } from 'react'

interface StudentData {
  Dalc: number
  Walc: number
}

interface AlcoholDistribution {
  value: number
  count: number
}

export default function Component() {
  const [data, setData] = useState<StudentData[]>([])
  const svgRefDalc = useRef<SVGSVGElement>(null)
  const svgRefWalc = useRef<SVGSVGElement>(null)
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const csvData = await d3.csv<StudentData>("../../data/student-mat.csv", (d) => ({
        Dalc: +d.Dalc,
        Walc: +d.Walc,
      }))
      setData(csvData)
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (data.length > 0) {
      drawPieChart(svgRefDalc.current!, processData(data, 'Dalc'), "Workday Alcohol Consumption", "Dalc")
      drawPieChart(svgRefWalc.current!, processData(data, 'Walc'), "Weekend Alcohol Consumption", "Walc")
    }
  }, [data, selectedSegment])

  const processData = (data: StudentData[], key: 'Dalc' | 'Walc'): AlcoholDistribution[] => {
    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    data.forEach((student) => {
      distribution[student[key]]++
    })
    return Object.entries(distribution).map(([value, count]) => ({ value: +value, count }))
  }

  const drawPieChart = (svgElement: SVGSVGElement, data: AlcoholDistribution[], title: string, chartType: string) => {
    
    const width = window.innerWidth * 0.29;
    const height = window.innerHeight * 0.2;
    const radius = Math.min(width, height) / 2

    d3.select(svgElement).selectAll("*").remove()

    const svg = d3.select(svgElement)
      .attr("width", width+300)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`)

    const colors = [1, 2, 3, 4, 5].map(value => d3.interpolateRdYlBu(1 - (value / 5)));

    const color = d3.scaleOrdinal<string>()
      .domain(["1", "2", "3", "4", "5"])
      .range(colors);
      

    const pie = d3.pie<AlcoholDistribution>()
      .value(d => d.count)
      .sort(null)

    const arc = d3.arc<d3.PieArcDatum<AlcoholDistribution>>()
      .innerRadius(0)
      .outerRadius((d) => (d.data.value === selectedSegment ? radius * 0.85 : radius * 0.8))

    const outerArc = d3.arc<d3.PieArcDatum<AlcoholDistribution>>()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9)

    const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("pointer-events", "none")

    const arcs = svg.selectAll("arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc")

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.value.toString()))
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr("d", d3.arc<d3.PieArcDatum<AlcoholDistribution>>()
            .innerRadius(0)
            .outerRadius(radius * 0.85))

        tooltip.transition()
          .duration(200)
          .style("opacity", .9)
          tooltip.html(`${chartType}: ${d.data.value}<br>Count: ${d.data.count}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px")
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px")
      })
      .on("mouseout", (event, d) => {
        if (d.data.value !== selectedSegment) {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr("d", arc)
        }

        tooltip.transition()
          .duration(500)
          .style("opacity", 0)
      })

    const label = svg.selectAll("text")
      .data(pie(data))
      .enter()
      .append("text")
      .attr("dy", ".35em")
      .text(d => `${d.data.count}`)
    
    label.attr("transform", d => {
      const pos = outerArc.centroid(d)
      pos[0] *= 0.7; // Adjust the x position inward (scale down)
      pos[1] *= 0.8; // Adjust the y position inward (scale down)
      return `translate(${pos})`
    })
      .style("text-anchor", "middle") // Center the text horizontally
      .style("font-size", "12px") // Optional: Set font size for better readability
      .style("fill", "white"); // Optional: Change the text color for contrast

    svg.append("text")
      .attr("text-anchor", "end") // Align to the end
      .attr("x", width / 2 + 150) // Position to the right side
      .attr("y", -height / 2 + 20) // Position at the top
      .text(title)
      .style("font-size", "12px")
      .style("font-weight", "bold");
    
    // Create a legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${-height / 2 + 40})`); // Position legend

    const legendData = data.map(d => d.value); // Get unique values for the legend
    const uniqueValues = Array.from(new Set(legendData)).sort((a, b) => b - a);

    uniqueValues.forEach((value, index) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(0, ${index * 15})`)
        .style("cursor", "pointer")
        .on("click", () => {
          setSelectedSegment(selectedSegment === value ? null : value)
          svg.selectAll("path")
            .transition()
            .duration(200)
            .attr("d", arc)
        })

      legendItem.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color(value.toString()))

    const textValue = title.includes("Workday") ? `Dalc ${value}` : `Walc ${value}`; // Determine text based on title
    legend.append("text")
      .attr("x", 20)
      .attr("y", index * 15 + 10) // Center the text vertically with the rectangle
      .text(textValue)
      .style("font-size", "10px") // Set smaller font size
      .style("fill", "black"); // Optional: Set text color
    });

  }

  const styles: { [key: string]: CSSProperties } = {
    title: {
      textAlign: 'center', 
      width: window.innerWidth /2,
    },
  }
  return (
    <div>
      <h3 style={styles.title}>Alcohol Consumption Distribution</h3>
      <div>
        <svg ref={svgRefDalc}></svg>
      </div>
      <div>
        <svg ref={svgRefWalc}></svg>
      </div>
    </div>
  )
}