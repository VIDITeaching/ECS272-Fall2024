import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { ChartProps, FilterState } from '../types';

// Interfaces and Types
interface MentalHealthCount {
  condition: string;
  count: number;
  percentage: number;
}

type D3Selection = d3.Selection<SVGGElement, unknown, null, undefined>;
type D3Transition = d3.Transition<SVGElement, unknown, null, undefined>;
type D3PieArcDatum = d3.PieArcDatum<MentalHealthCount>;

interface D3Event extends MouseEvent {
  currentTarget: SVGPathElement | SVGGElement;
}

// Constants
const COLORS = {
  Depression: '#FF69B4',    // Pink
  Anxiety: '#FFA500',       // Orange
  'Panic Attack': '#9370DB', // Purple
  'No Mental Issues': '#808080' // Gray
};

const TRANSITION_DURATION = 750;

// Helper Functions
const getAgeGroup = (age: string | undefined, selectedAge: string | null): boolean => {
  if (!age || selectedAge === null) return true;
  const ageNum = parseInt(age);
  if (isNaN(ageNum)) return false;

  switch (selectedAge) {
    case "18 or younger":
      return ageNum <= 18;
    case "24+":
      return ageNum >= 24;
    default:
      return age === selectedAge;
  }
};

// Main Component
const PieChart: React.FC<ChartProps> = ({ filters, onElementHover, isTransitioning }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const prevDataRef = useRef<{ male: MentalHealthCount[]; female: MentalHealthCount[]; } | null>(null);

  // Data Processing Logic
  const processData = useMemo(() => (csvData: d3.DSVRowString[]) => {
    const processDataForGender = (gender: string) => {
      let filteredData = csvData.filter(d => d["Choose your gender"]?.trim() === gender);
      filteredData = filteredData.filter(d => getAgeGroup(d.Age, filters.selectedAge));

      const total = filteredData.length;
      if (total === 0) return [];

      const counts = {
        Depression: filteredData.filter(d => d["Do you have Depression?"] === "Yes").length,
        Anxiety: filteredData.filter(d => d["Do you have Anxiety?"] === "Yes").length,
        "Panic Attack": filteredData.filter(d => d["Do you have Panic attack?"] === "Yes").length,
        "No Mental Issues": filteredData.filter(d => 
          d["Do you have Depression?"] === "No" &&
          d["Do you have Anxiety?"] === "No" &&
          d["Do you have Panic attack?"] === "No"
        ).length
      };

      return Object.entries(counts)
        .map(([condition, count]) => ({
          condition,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0
        }))
        .filter(d => d.count > 0);
    };

    return {
      male: processDataForGender("Male"),
      female: processDataForGender("Female")
    };
  }, [filters]);

  // Chart Rendering Logic
  useEffect(() => {
    const renderChart = async () => {
      try {
        const csvData = await d3.csv('/data/Student Mental health.csv');
        const data = processData(csvData);
        const prevData = prevDataRef.current;
        prevDataRef.current = data;

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
           .attr('preserveAspectRatio', 'xMidYMid meet')
           .style('opacity', isTransitioning ? 0 : 1)
           .transition()
           .duration(300)
           .style('opacity', 1);

        svg.append('text')
           .attr('x', width / 2)
           .attr('y', 25)
           .attr('text-anchor', 'middle')
           .style('fill', 'white')
           .style('font-size', '16px')
           .style('font-weight', 'bold')
           .text('Mental Health Issues Distribution Across Gender');

        const pie = d3.pie<MentalHealthCount>()
          .value(d => d.percentage)
          .sort((a, b) => a.percentage - b.percentage);

        const arc = d3.arc<D3PieArcDatum>()
          .innerRadius(0)
          .outerRadius(radius);

        const createPieChart = (pieData: MentalHealthCount[], centerX: number, title: string) => {
          const g = svg.append('g')
            .attr('transform', `translate(${centerX}, ${height / 2})`) as unknown as D3Selection;

          const segments = g.selectAll<SVGPathElement, D3PieArcDatum>('path')
            .data(pie(pieData))
            .join(
              enter => enter.append('path')
                .attr('d', arc)
                .style('opacity', d => filters.selectedCondition === null ? 1 : 
                  d.data.condition === filters.selectedCondition ? 1 : 0.2)
                .style('fill', d => COLORS[d.data.condition as keyof typeof COLORS])
                .style('stroke', '#000000')
                .style('stroke-width', 2)
                .style('cursor', 'pointer'),
              update => update,
              exit => exit.remove()
            );

          segments
            .on('mouseenter', (event: MouseEvent, d: D3PieArcDatum) => {
              const target = event.currentTarget as SVGPathElement;
              d3.select(target)
                .transition()
                .duration(200)
                .attr('transform', 'scale(1.05)');

              onElementHover({
                type: 'pie',
                name: d.data.condition,
                value: d.data.count,
                percentage: d.data.percentage,
                coordinates: { x: event.pageX, y: event.pageY }
              }, event as unknown as React.MouseEvent);
            })
            .on('mouseleave', (event: MouseEvent) => {
              d3.select(event.currentTarget as SVGPathElement)
                .transition()
                .duration(200)
                .attr('transform', 'scale(1)');

              onElementHover(null, event as unknown as React.MouseEvent);
            });

          g.selectAll('text.percentage')
            .data(pie(pieData))
            .join('text')
            .attr('class', 'percentage')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .style('text-anchor', 'middle')
            .style('fill', '#000000')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('opacity', d => filters.selectedCondition === null ? 1 : 
              d.data.condition === filters.selectedCondition ? 1 : 0.2)
            .text(d => `${Math.round(d.data.percentage)}%`);

          g.append('text')
            .attr('class', 'title')
            .attr('x', radius + 10)
            .attr('y', 0)
            .attr('text-anchor', 'start')
            .style('fill', 'white')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text(title);

          // Add count and percentage for selected condition
          if (filters.selectedCondition) {
            const selectedData = pieData.find(d => d.condition === filters.selectedCondition);
            if (selectedData) {
              g.append('text')
                .attr('class', 'selected-info')
                .attr('x', radius + 10)
                .attr('y', 30)
                .attr('text-anchor', 'start')
                .style('fill', 'white')
                .style('font-size', '14px')
                .text(`${filters.selectedCondition}: ${selectedData.count} (${selectedData.percentage.toFixed(1)}%)`);
            }
          }

          const total = pieData.reduce((sum, d) => sum + d.count, 0);
          g.append('text')
            .attr('class', 'total')
            .attr('y', radius + 30)
            .attr('text-anchor', 'middle')
            .style('fill', 'white')
            .style('font-size', '14px')
            .text(`Total: ${total} students`);
        };

        createPieChart(data.female, width * 0.3, 'Female');
        createPieChart(data.male, width * 0.7, 'Male');

        const legendData = Object.entries(COLORS);
        const legend = svg.append('g')
          .attr('transform', `translate(20, ${height * 0.3})`);

        legendData.forEach(([condition, color], i) => {
          const g = legend.append('g')
            .attr('transform', `translate(0, ${i * 30})`)
            .style('cursor', 'pointer')
            .style('opacity', filters.selectedCondition === null ? 1 : 
              condition === filters.selectedCondition ? 1 : 0.2);

          g.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', color)
            .attr('stroke', '#000000')
            .attr('stroke-width', 1);

          g.append('text')
            .attr('x', 25)
            .attr('y', 12)
            .style('fill', 'white')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text(condition);
        });

      } catch (error) {
        console.error('Error loading CSV data:', error);
      }
    };

    renderChart();
  }, [filters, onElementHover, isTransitioning, processData]);

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