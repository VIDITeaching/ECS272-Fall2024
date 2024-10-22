import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';

interface PieData {
  label: string;
  value: number;
}

export default function PieChart() {
  const [data, setData] = useState<PieData[]>([]);
  const pieRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/student-mat.csv', (d) => ({
          studytime: d.studytime,
        }));

        // Aggregate studytime data
        const studyTimeDistribution = d3.rollups(
          csvData,
          v => v.length,
          d => d.studytime
        ).map(([label, value]) => ({
          label: String(label),
          value: value as number
        }));

        setData(studyTimeDistribution);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };
    dataFromCSV();
  }, []);

  useEffect(() => {
    if (data.length === 0) return;
    drawPieChart();
  }, [data]);

  const drawPieChart = () => {
    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2;

    const svg = d3
      .select('#pie-chart')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const pie = d3.pie<PieData>().value(d => d.value);

    const arc = d3
      .arc<d3.PieArcDatum<PieData>>()
      .innerRadius(0)
      .outerRadius(radius);

    const arcs = svg
      .selectAll('arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    // Draw the pie chart slices
    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.label));

    // Add percentage text to each slice
    arcs
      .append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('dy', '0.35em')
      .style('text-anchor', 'middle')
      .text(d => `${((d.data.value / d3.sum(data, d => d.value)) * 100).toFixed(1)}%`);

    // Add study time label around each slice
    arcs
      .append('text')
      .attr('transform', d => {
        const [x, y] = arc.centroid(d);
        const midAngle = (d.startAngle + d.endAngle) / 2;
        const xOffset = midAngle < Math.PI ? 20 : -20;
        return `translate(${x + xOffset}, ${y})`;
      })
      .style('text-anchor', d => ((d.startAngle + d.endAngle) / 2) < Math.PI ? 'start' : 'end')
      .text(d => d.data.label);
  };

  return (
    <div ref={pieRef} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <svg id='pie-chart'></svg>
    </div>
  );
}