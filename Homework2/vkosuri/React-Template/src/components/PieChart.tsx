import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface MentalHealthCount {
  condition: string;
  count: number;
  percentage: number;
}

interface GenderData {
  male: MentalHealthCount[];
  female: MentalHealthCount[];
}

const PieChart: React.FC = (): JSX.Element => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<GenderData>({ male: [], female: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const csvData = await d3.csv('/data/Student Mental health.csv');
        
        const processDataForGender = (gender: string) => {
          const genderData = csvData.filter(d => d["Choose your gender"].trim() === gender);
          const total = genderData.length;
          
          const counts = {
            depression: genderData.filter(d => d["Do you have Depression?"] === "Yes").length,
            anxiety: genderData.filter(d => d["Do you have Anxiety?"] === "Yes").length,
            panic: genderData.filter(d => d["Do you have Panic attack?"] === "Yes").length
          };
          
          const noIssues = genderData.filter(d => 
            d["Do you have Depression?"] === "No" && 
            d["Do you have Anxiety?"] === "No" && 
            d["Do you have Panic attack?"] === "No"
          ).length;
          
          return [
            { condition: "Depression", count: counts.depression, percentage: (counts.depression / total) * 100 },
            { condition: "Anxiety", count: counts.anxiety, percentage: (counts.anxiety / total) * 100 },
            { condition: "Panic Attack", count: counts.panic, percentage: (counts.panic / total) * 100 },
            { condition: "No Mental Issues", count: noIssues, percentage: (noIssues / total) * 100 }
          ].sort((a, b) => a.percentage - b.percentage); // Sort by percentage in ascending order
        };

        setData({
          male: processDataForGender("Male"),
          female: processDataForGender("Female")
        });
      } catch (error) {
        console.error('Error loading CSV data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!data.male.length || !data.female.length) return;

    const container = d3.select(svgRef.current).node()?.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const radius = Math.min(width / 6, height / 3);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    svg.attr('width', width)
       .attr('height', height)
       .attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .style('fill', 'white')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .text('Mental Health Issues Distribution Across Gender');

    const colorScale = d3.scaleOrdinal<string>()
      .domain(['Depression', 'Anxiety', 'Panic Attack', 'No Mental Issues'])
      .range(['#87CEFA', '#9370DB', '#FF6347', '#32CD32']);
    
    const createPieChart = (data: MentalHealthCount[], centerX: number, title: string) => {
      const g = svg.append('g')
        .attr('transform', `translate(${centerX}, ${height / 2})`);

      const pie = d3.pie<MentalHealthCount>()
        .value(d => d.percentage)
        .sort(null); // Remove default sorting to maintain our manual sort

      const arc = d3.arc<d3.PieArcDatum<MentalHealthCount>>()
        .innerRadius(0)
        .outerRadius(radius);

      g.selectAll('path')
        .data(pie(data))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => colorScale(d.data.condition))
        .attr('stroke', '#000000')
        .attr('stroke-width', 2);

      g.selectAll('text.percentage')
        .data(pie(data))
        .enter()
        .append('text')
        .attr('class', 'percentage')
        .attr('transform', d => {
          const [x, y] = arc.centroid(d);
          return `translate(${x}, ${y})`;
        })
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('fill', '#000000')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text(d => `${Math.round(d.data.percentage)}%`);

      g.append('text')
        .attr('class', 'title')
        .attr('y', radius + 30)
        .attr('text-anchor', 'middle')
        .style('fill', 'white')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text(title);

      const total = data.reduce((sum, d) => sum + d.count, 0);
      g.append('text')
        .attr('class', 'total')
        .attr('y', radius + 55)
        .attr('text-anchor', 'middle')
        .style('fill', 'white')
        .style('font-size', '14px')
        .text(`Total: ${total} students`);
    };

    createPieChart(data.female, width * 0.3, 'Female');
    createPieChart(data.male, width * 0.7, 'Male');

    // Get conditions in order of appearance for legend (using female data as reference)
    const legendData = data.female.map(d => d.condition);
    
    const legend = svg.append('g')
      .attr('transform', `translate(${width * 0.1 - 132 + 75.6}, ${height/2 - 100 + 56.7})`);

    const legendSpacing = 30;
    
    legendData.forEach((item, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * legendSpacing})`);

      legendItem.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', colorScale(item))
        .attr('stroke', '#000000')
        .attr('stroke-width', 1);

      legendItem.append('text')
        .attr('x', 25)
        .attr('y', 12)
        .style('fill', 'white')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text(item);
    });

  }, [data]);

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative', 
      backgroundColor: '#1a1a1a' 
    }}>
      <svg 
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
    </div>
  );
};

export default PieChart;