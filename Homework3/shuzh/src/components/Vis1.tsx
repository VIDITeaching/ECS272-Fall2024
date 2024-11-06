import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { CSSProperties } from 'react'

interface StudentData {
  G3: number
  Dalc: number
  Walc: number
}

interface StackedData {
  G3: number
  [key: string]: number
}

export default function Component() {
  const [data, setData] = useState<StackedData[]>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      const csvData = await d3.csv<StudentData>("../../data/student-mat.csv", (d) => ({
        G3: +d.G3,
        Dalc: +d.Dalc,
        Walc: +d.Walc,
      }))

      const processedData = processData(csvData)
      setData(processedData)
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (data.length > 0) {
      drawChart()
    }
  }, [data])

  const processData = (rawData: StudentData[]): StackedData[] => {
    const gradeDistribution: { [key: number]: { [key: number]: number } } = {}

    rawData.forEach((student) => {
      if (!gradeDistribution[student.G3]) {
        gradeDistribution[student.G3] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
      gradeDistribution[student.G3][student.Walc]++
    })

    return Object.entries(gradeDistribution).map(([G3, counts]) => ({
      G3: +G3,
      ...counts,
    }))
  }

  const drawChart = () => {
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 5, right: 20, bottom: 40, left: window.innerWidth * 0.1 }
    const width = window.innerWidth * 0.45 - margin.left - margin.right;
    const height = window.innerHeight * 0.4 - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const x = d3.scaleBand().rangeRound([0, width]).padding(0.1)
    const y = d3.scaleLinear().rangeRound([height, 0])

    const colors = [1, 2, 3, 4, 5].map(value => d3.interpolateRdYlBu(1 - (value / 5)));

    const color = d3.scaleOrdinal<string>()
      .domain(["1", "2", "3", "4", "5"])
      .range(colors);    

    const keys = ["1", "2", "3", "4", "5"]

    x.domain(data.map((d) => d.G3.toString()))
    y.domain([0, d3.max(data, (d) => d[1] + d[2] + d[3] + d[4] + d[5]) || 0])

    const stack = d3.stack<StackedData>().keys(keys)
    const layers = stack(data)
    const tooltip = d3.select(tooltipRef.current)

    g.selectAll(".bar")
      .data(layers)
      .enter()
      .append("g")
      .attr("fill", (d) => color(d.key))
      .selectAll("rect")
      .data((d) => d)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.data.G3.toString()) || 0)
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      .on("mouseover", function(event, d) {
        const walcLevel = d3.select(this.parentNode).datum().key
        const count = d[1] - d[0]
        tooltip.style("opacity", 1)
        tooltip.html(`Grade: ${d.data.G3}<br>Walc: ${walcLevel}<br>Count: ${count}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px")

        // Color highlight animation
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill", d3.color(color(walcLevel))?.brighter(1))
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px")
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0)

        // Revert color highlight
        const walcLevel = d3.select(this.parentNode).datum().key
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill", color(walcLevel))
      })



    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .append("text")
      .attr("fill", "#000")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("dy", "0.71em")
      .attr("text-anchor", "middle")
      .text("Final Grade (G3)")

    g.append("g")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", -30)
      .attr("dy", "0.71em")
      .attr("text-anchor", "end")
      .text("Number of Students")

    const legend = g
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
      .selectAll("g")
      .data(keys.slice().reverse())
      .enter()
      .append("g")
      .attr("transform", (d, i) => `translate(0,${i * 20})`)

    legend
      .append("rect")
      .attr("x", width - 19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", color)

    legend
      .append("text")
      .attr("x", width - 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text((d) => `Dalc ${d}`)
  }

  
  const styles: { [key: string]: CSSProperties } = {
    title: {
      textAlign: 'center', 
      width: window.innerWidth /2,
    },
    graph: {
      width: window.innerWidth /2,
      height: window.innerHeight /2.
    },
    tooltip: {
      position: 'absolute',
      padding: '10px',
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '5px',
      pointerEvents: 'none',
      opacity: 0,
      transition: 'opacity 0.3s',
    },
  }

  return (
    <div>
      <h3 style={styles.title}>Impact of Alcohol Consumption on Student Grades</h3>
      <svg ref={svgRef} style={styles.graph}></svg>
      <div ref={tooltipRef} style={styles.tooltip} role="tooltip"></div>
    </div>
  )
}