import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"

interface StudentData {
  G3: number
  Walc: number
}

interface StackedData {
  G3: number
  [key: string]: number
}

export default function Component() {
  const [data, setData] = useState<StackedData[]>([])
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      const csvData = await d3.csv<StudentData>("../../data/student-mat.csv", (d) => ({
        G3: +d.G3,
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

    return Object.entries(gradeDistribution).map(([G3, dalcCounts]) => ({
      G3: +G3,
      ...dalcCounts,
    }))
  }

  const drawChart = () => {
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 20, bottom: 40, left: 40 }
    const width = 600 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

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

  return (
    <div className="w-full max-w-3xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-6">
        <h3 className="text-2xl font-bold mb-2">Impact of Weekend Alcohol Consumption on Student Grades</h3>
        <div className="w-full h-[400px] overflow-x-auto">
          <svg ref={svgRef} width="600" height="400"></svg>
        </div>
      </div>
    </div>
  )
}