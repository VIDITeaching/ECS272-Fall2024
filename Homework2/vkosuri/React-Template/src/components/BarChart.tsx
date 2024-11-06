import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import Grid from '@mui/material/Grid';

interface MentalHealthData {
  CGPA: string;
  depressionCount: number;
  anxietyCount: number;
  panicAttackCount: number;
  noIssuesCount: number;
}

const CHART_MARGINS = { top: 45, right: 170, bottom: 60, left: 102 };
const CGPA_ORDER = ["0 - 1.99", "2.00 - 2.49", "2.50 - 2.99", "3.00 - 3.49", "3.50 - 4.00"];
const COLORS = ['#87CEFA', '#9370DB', '#FF6347', '#32CD32'];
const CHART_WIDTH = 1190;
const CHART_HEIGHT = 388;

const BarChart: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const fetchAndRenderData = async () => {
      try {
        // Load and process data
        const csvData = await d3.csv('/data/Student Mental health.csv', d => ({
          CGPA: d["What is your CGPA?"].trim(),
          depression: d["Do you have Depression?"],
          anxiety: d["Do you have Anxiety?"],
          panicAttack: d["Do you have Panic attack?"]
        }));

        const cgpaGroups = d3.groups(csvData, (d: any) => d.CGPA);
        const data: MentalHealthData[] = cgpaGroups.map(([CGPA, students]) => ({
          CGPA,
          depressionCount: students.filter((d: any) => d.depression === 'Yes').length,
          anxietyCount: students.filter((d: any) => d.anxiety === 'Yes').length,
          panicAttackCount: students.filter((d: any) => d.panicAttack === 'Yes').length,
          noIssuesCount: students.filter((d: any) =>
            d.depression === 'No' && d.anxiety === 'No' && d.panicAttack === 'No'
          ).length
        }));

        // Clear any existing SVG content
        d3.select(svgRef.current).selectAll("*").remove();

        // Set up the SVG
        const svg = d3.select(svgRef.current)
          .attr('width', CHART_WIDTH)
          .attr('height', CHART_HEIGHT)
          .attr('viewBox', `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`)
          .attr('preserveAspectRatio', 'xMidYMid meet');

        const innerWidth = CHART_WIDTH - CHART_MARGINS.left - CHART_MARGINS.right;
        const innerHeight = CHART_HEIGHT - CHART_MARGINS.top - CHART_MARGINS.bottom;

        const chart = svg.append('g')
          .attr('transform', `translate(${CHART_MARGINS.left}, ${CHART_MARGINS.top})`);

        // Create scales with adjusted y-axis
        const xScale = d3.scaleBand()
          .domain(CGPA_ORDER)
          .range([0, innerWidth])
          .padding(0.2);

        // Calculate the maximum stack height from the data
        const stack = d3.stack<MentalHealthData>()
          .keys(['depressionCount', 'anxietyCount', 'panicAttackCount', 'noIssuesCount']);

        const stackedData = stack(data);
        const yMax = d3.max(stackedData[stackedData.length - 1], d => d[1]) || 0;

        // Updated y-axis scale with calculated maximum plus 10% padding
        const yScale = d3.scaleLinear()
          .domain([0, yMax * 1.1])
          .range([innerHeight, 0])
          .nice();

        // Add axes with matched font styles
        chart.append('g')
          .attr('transform', `translate(0, ${innerHeight})`)
          .call(d3.axisBottom(xScale))
          .style('color', 'white')
          .selectAll('text')
          .style('fill', 'white')
          .style('font-size', '18px')
          .style('font-weight', 'bold');

        // Create y-axis with appropriate number of ticks
        const yAxis = d3.axisLeft(yScale)
          .ticks(8)
          .tickFormat(d => d.toString());

        chart.append('g')
          .call(yAxis)
          .style('color', 'white')
          .selectAll('text')
          .style('fill', 'white')
          .style('font-size', '18px')
          .style('font-weight', 'bold');

        // Add axis labels
        chart.append('text')
          .attr('x', innerWidth / 2)
          .attr('y', innerHeight + 45)
          .attr('text-anchor', 'middle')
          .style('fill', 'white')
          .style('font-size', '20px')
          .style('font-weight', 'bold')
          .text('CGPA Ranges');

        chart.append('text')
          .attr('transform', 'rotate(-90)')
          .attr('x', -innerHeight / 2)
          .attr('y', -75)
          .attr('text-anchor', 'middle')
          .style('fill', 'white')
          .style('font-size', '20px')
          .style('font-weight', 'bold')
          .text('Number of Students');

        // Create layers with labels
        const layers = chart.selectAll('g.layer')
          .data(stackedData)
          .enter()
          .append('g')
          .attr('class', 'layer')
          .attr('fill', (d, i) => COLORS[i]);

        // Add rectangles for each segment
        layers.selectAll('rect')
          .data(d => d)
          .enter()
          .append('rect')
          .attr('x', d => xScale(d.data.CGPA)!)
          .attr('y', d => yScale(d[1]))
          .attr('height', d => yScale(d[0]) - yScale(d[1]))
          .attr('width', xScale.bandwidth());

        // Add text labels for counts
        layers.selectAll('text')
          .data(d => d)
          .enter()
          .append('text')
          .attr('x', d => xScale(d.data.CGPA)! + xScale.bandwidth() / 2)
          .attr('y', d => {
            const height = yScale(d[0]) - yScale(d[1]);
            return yScale(d[1]) + height / 2;
          })
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .style('fill', 'black')
          .style('font-size', '14px')
          .style('font-weight', 'bold')
          .text(d => {
            const value = d[1] - d[0];
            return value > 0 ? value : '';
          });

        // Add title
        svg.append('text')
          .attr('x', CHART_WIDTH / 2)
          .attr('y', 25)
          .attr('text-anchor', 'middle')
          .style('fill', 'white')
          .style('font-size', '28px')
          .style('font-weight', 'bold')
          .text('Mental Health Issues Distribution Across CGPA Ranges');

        // Add legend
        const legend = svg.append('g')
          .attr('transform', `translate(${CHART_WIDTH - 160}, ${CHART_MARGINS.top})`);

        const legendItems = [
          'Depression',
          'Anxiety',
          'Panic Attack',
          'No Issues'
        ];

        legendItems.forEach((item, i) => {
          const g = legend.append('g')
            .attr('transform', `translate(0, ${i * 30})`);

          g.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', COLORS[i])
            .attr('stroke', '#000000')
            .attr('stroke-width', 1);

          g.append('text')
            .attr('x', 25)
            .attr('y', 12)
            .style('fill', 'white')
            .style('font-size', '20px')
            .style('font-weight', 'bold')
            .text(item);
        });

      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchAndRenderData();
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: CHART_WIDTH,
          maxHeight: CHART_HEIGHT
        }}
      />
    </div>
  );
};

export default BarChart;