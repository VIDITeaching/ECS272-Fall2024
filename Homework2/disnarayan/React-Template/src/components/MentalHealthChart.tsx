import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { csv } from 'd3-fetch';

interface DataPoint {
  condition: string;
  value: string;
  count: number;
}

const MentalHealthChart: React.FC = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    csv('/data/StudentMentalhealth.csv').then((csvData) => {
      const mentalHealthData: DataPoint[] = [
        { condition: 'Depression', value: 'True', count: 0 },
        { condition: 'Depression', value: 'False', count: 0 },
        { condition: 'Anxiety', value: 'True', count: 0 },
        { condition: 'Anxiety', value: 'False', count: 0 },
        { condition: 'Panic attack', value: 'True', count: 0 },
        { condition: 'Panic attack', value: 'False', count: 0 },
      ];

      csvData.forEach((row) => {
        mentalHealthData[0].count += row['Do you have Depression?'] === 'Yes' ? 1 : 0;
        mentalHealthData[1].count += row['Do you have Depression?'] === 'No' ? 1 : 0;
        mentalHealthData[2].count += row['Do you have Anxiety?'] === 'Yes' ? 1 : 0;
        mentalHealthData[3].count += row['Do you have Anxiety?'] === 'No' ? 1 : 0;
        mentalHealthData[4].count += row['Do you have Panic attack?'] === 'Yes' ? 1 : 0;
        mentalHealthData[5].count += row['Do you have Panic attack?'] === 'No' ? 1 : 0;
      });

      setData(mentalHealthData);
    });
  }, []);

  useEffect(() => {
    if (data.length === 0 || !svgRef.current) return;

    const margin = { top: 50, right: 120, bottom: 60, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x0 = d3.scaleBand()
      .domain(data.map(d => d.condition))
      .rangeRound([0, width])
      .paddingInner(0.1);

    const x1 = d3.scaleBand()
      .domain(['True', 'False'])
      .rangeRound([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 0])
      .nice()
      .rangeRound([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(['True', 'False'])
      .range(['#4e79a7', '#e15759']);

    svg.append('g')
      .selectAll('g')
      .data(data)
      .join('g')
      .attr('transform', d => `translate(${x0(d.condition)},0)`)
      .selectAll('rect')
      .data(d => [d])
      .join('rect')
      .attr('x', d => x1(d.value) || 0)
      .attr('y', d => y(d.count))
      .attr('width', x1.bandwidth())
      .attr('height', d => height - y(d.count))
      .attr('fill', d => color(d.value) as string)
      .on('mouseover', (event, d) => {
        const tooltip = d3.select('#tooltip');
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip.html(`${d.condition}<br/>${d.value}: ${d.count}`)
          .style('left', `${event.pageX}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        d3.select('#tooltip').transition().duration(500).style('opacity', 0);
      });

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x0));

    svg.append('g')
      .call(d3.axisLeft(y));

    // X-axis label
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .text('Mental Health Conditions');

    // Y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Number of Students');

    const legend = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'end')
      .selectAll('g')
      .data(['True', 'False'])
      .join('g')
      .attr('transform', (d, i) => `translate(${width + 60},${i * 20})`);

    legend.append('rect')
      .attr('x', -19)
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', color as any);

    legend.append('text')
      .attr('x', -24)
      .attr('y', 9.5)
      .attr('dy', '0.32em')
      .text(d => d);

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 0 - (margin.top / 2))
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('text-decoration', 'underline')
      .text('Mental Health Conditions Among Students');

  }, [data]);

  return (
    <div className="chart-container">
      <svg ref={svgRef}></svg>
      <div id="tooltip" style={{
        position: 'absolute',
        textAlign: 'center',
        padding: '8px',
        font: '12px sans-serif',
        background: 'lightsteelblue',
        border: '0px',
        borderRadius: '8px',
        pointerEvents: 'none',
        opacity: 0,
      }}></div>
    </div>
  );
};

export default MentalHealthChart;