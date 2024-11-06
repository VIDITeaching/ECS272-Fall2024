import React, { useEffect, useRef } from 'react'; 
import * as d3 from 'd3';
import { ChartProps } from '../types';

const CHART_MARGINS = { top: 45, right: 170, bottom: 60, left: 102 };
const AGE_GROUPS = ["18 or younger", "19", "20", "21", "22", "23", "24+"];
const COLORS = {
  soughtTreatment: '#00C853',
  noTreatment: '#FF5252'
};
const CHART_WIDTH = 1190;
const CHART_HEIGHT = 388;

const getAgeGroup = (age: string): string | null => {
  const ageNum = parseInt(age);
  if (isNaN(ageNum)) return null;
  if (ageNum <= 18) return "18 or younger";
  if (ageNum === 19) return "19";
  if (ageNum === 20) return "20";
  if (ageNum === 21) return "21";
  if (ageNum === 22) return "22";
  if (ageNum === 23) return "23";
  return "24+";
};

const BarChart: React.FC<ChartProps> = ({ filters, onElementHover, isTransitioning }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const fetchAndRenderData = async () => {
      try {
        const data = await d3.csv('/data/Student Mental health.csv');
        
        // Process data matching Sankey chart logic
        const processedData = data.reduce((acc: any, row) => {
          const ageGroup = getAgeGroup(row.Age);
          if (!ageGroup) return acc;

          if (!acc[ageGroup]) {
            acc[ageGroup] = {
              ageGroup,
              soughtTreatment: 0,
              noTreatment: 0,
              totalConditions: 0
            };
          }

          const hasDepression = row["Do you have Depression?"] === "Yes";
          const hasAnxiety = row["Do you have Anxiety?"] === "Yes";
          const hasPanicAttack = row["Do you have Panic attack?"] === "Yes";
          const hasCondition = hasDepression || hasAnxiety || hasPanicAttack;
          const soughtTreatment = row["Did you seek any specialist for a treatment?"] === "Yes";

          if (!hasCondition) {
            acc[ageGroup].noTreatment++;
          } else {
            if (hasDepression) {
              if (soughtTreatment) acc[ageGroup].soughtTreatment++;
              else acc[ageGroup].noTreatment++;
            }
            if (hasAnxiety) {
              if (soughtTreatment) acc[ageGroup].soughtTreatment++;
              else acc[ageGroup].noTreatment++;
            }
            if (hasPanicAttack) {
              if (soughtTreatment) acc[ageGroup].soughtTreatment++;
              else acc[ageGroup].noTreatment++;
            }
          }
          
          return acc;
        }, {});

        const chartData = AGE_GROUPS.map(age => ({
          ageGroup: age,
          soughtTreatment: processedData[age]?.soughtTreatment || 0,
          noTreatment: processedData[age]?.noTreatment || 0,
          total: (processedData[age]?.soughtTreatment || 0) + (processedData[age]?.noTreatment || 0)
        }));

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        
        svg.attr('width', CHART_WIDTH)
           .attr('height', CHART_HEIGHT)
           .attr('viewBox', `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`)
           .attr('preserveAspectRatio', 'xMidYMid meet');

        const innerWidth = CHART_WIDTH - CHART_MARGINS.left - CHART_MARGINS.right;
        const innerHeight = CHART_HEIGHT - CHART_MARGINS.top - CHART_MARGINS.bottom;

        const chart = svg.append('g')
          .attr('transform', `translate(${CHART_MARGINS.left}, ${CHART_MARGINS.top})`);

        const xScale = d3.scaleBand()
          .domain(AGE_GROUPS)
          .range([0, innerWidth])
          .padding(0.2);

        // Adjust yMax based on selected treatment type
        let yMax;
        if (filters?.selectedTreatment === 'Sought Treatment') {
          yMax = d3.max(chartData, d => d.soughtTreatment) || 0;
        } else if (filters?.selectedTreatment === 'No Treatment') {
          yMax = d3.max(chartData, d => d.noTreatment) || 0;
        } else {
          yMax = d3.max(chartData, d => d.total) || 0;
        }

        const yScale = d3.scaleLinear()
          .domain([0, yMax])
          .range([innerHeight, 0])
          .nice();

        // Add the bars for each age group
        chartData.forEach(d => {
          const x = xScale(d.ageGroup);
          if (x === undefined) return;

          // Only show No Treatment bars if no filter or explicitly selected
          if ((filters?.selectedTreatment === 'No Treatment' || !filters?.selectedTreatment) && d.noTreatment > 0) {
            const height = innerHeight - yScale(d.noTreatment);
            chart.append('rect')
              .attr('x', x)
              .attr('y', yScale(d.noTreatment))
              .attr('width', xScale.bandwidth())
              .attr('height', height)
              .attr('fill', COLORS.noTreatment)
              .style('cursor', 'pointer')
              .on('mouseenter', (event) => {
                d3.select(event.target)
                  .style('opacity', 0.8)
                  .style('stroke', 'white')
                  .style('stroke-width', 2);

                onElementHover({
                  type: 'bar',
                  name: d.ageGroup,
                  category: 'No Treatment',
                  value: d.noTreatment,
                  percentage: (d.noTreatment / d.total) * 100,
                  coordinates: { x: event.pageX, y: event.pageY }
                }, event);
              })
              .on('mouseleave', (event) => {
                d3.select(event.target)
                  .style('opacity', 1)
                  .style('stroke', 'none');
                onElementHover(null, event);
              });

            if (!filters?.selectedTreatment || filters?.selectedTreatment === 'No Treatment') {
              chart.append('text')
                .attr('x', x + xScale.bandwidth() / 2)
                .attr('y', yScale(d.noTreatment) + height / 2)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .style('fill', 'white')
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .text(d.noTreatment);
            }
          }

          // Only show Sought Treatment bars if no filter or explicitly selected
          if ((filters?.selectedTreatment === 'Sought Treatment' || !filters?.selectedTreatment) && d.soughtTreatment > 0) {
            const baseY = filters?.selectedTreatment === 'Sought Treatment' ? innerHeight : yScale(d.noTreatment);
            const height = filters?.selectedTreatment === 'Sought Treatment' 
              ? innerHeight - yScale(d.soughtTreatment)
              : yScale(d.noTreatment) - yScale(d.total);
            const barY = filters?.selectedTreatment === 'Sought Treatment' 
              ? yScale(d.soughtTreatment)
              : yScale(d.total);

            chart.append('rect')
              .attr('x', x)
              .attr('y', barY)
              .attr('width', xScale.bandwidth())
              .attr('height', height)
              .attr('fill', COLORS.soughtTreatment)
              .style('cursor', 'pointer')
              .on('mouseenter', (event) => {
                d3.select(event.target)
                  .style('opacity', 0.8)
                  .style('stroke', 'white')
                  .style('stroke-width', 2);

                onElementHover({
                  type: 'bar',
                  name: d.ageGroup,
                  category: 'Sought Treatment',
                  value: d.soughtTreatment,
                  percentage: (d.soughtTreatment / d.total) * 100,
                  coordinates: { x: event.pageX, y: event.pageY }
                }, event);
              })
              .on('mouseleave', (event) => {
                d3.select(event.target)
                  .style('opacity', 1)
                  .style('stroke', 'none');
                onElementHover(null, event);
              });

            if (!filters?.selectedTreatment || filters?.selectedTreatment === 'Sought Treatment') {
              chart.append('text')
                .attr('x', x + xScale.bandwidth() / 2)
                .attr('y', barY + height / 2)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .style('fill', 'white')
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .text(d.soughtTreatment);
            }
          }
        });

        // X-axis with straight labels
        chart.append('g')
          .attr('transform', `translate(0, ${innerHeight})`)
          .call(d3.axisBottom(xScale))
          .style('color', 'white')
          .selectAll('text')
          .style('fill', 'white')
          .style('font-size', '18px')
          .style('font-weight', 'bold')
          .style('text-anchor', 'middle');

        // Y-axis
        chart.append('g')
          .call(d3.axisLeft(yScale).ticks(5))
          .style('color', 'white')
          .selectAll('text')
          .style('fill', 'white')
          .style('font-size', '18px')
          .style('font-weight', 'bold');

        // Title
        svg.append('text')
          .attr('x', CHART_WIDTH / 2)
          .attr('y', 25)
          .attr('text-anchor', 'middle')
          .style('fill', 'white')
          .style('font-size', '28px')
          .style('font-weight', 'bold')
          .style('opacity', isTransitioning ? 0.5 : 1)
          .text('Treatment Status Distribution by Age Group');

        // X-axis label
        chart.append('text')
          .attr('x', innerWidth / 2)
          .attr('y', innerHeight + 45)
          .attr('text-anchor', 'middle')
          .style('fill', 'white')
          .style('font-size', '20px')
          .style('font-weight', 'bold')
          .text('Age Groups');

        // Y-axis label
        chart.append('text')
          .attr('transform', 'rotate(-90)')
          .attr('x', -innerHeight / 2)
          .attr('y', -75)
          .attr('text-anchor', 'middle')
          .style('fill', 'white')
          .style('font-size', '20px')
          .style('font-weight', 'bold')
          .text('Number of Students');

        // Show legend only when no specific treatment is selected
        if (!filters?.selectedTreatment) {
          const legend = svg.append('g')
            .attr('transform', `translate(${CHART_WIDTH - 160}, ${CHART_MARGINS.top})`);

          const legendItems = [
            { key: 'soughtTreatment', label: 'Sought Treatment' },
            { key: 'noTreatment', label: 'No Treatment' }
          ];

          legendItems.forEach((item, i) => {
            const g = legend.append('g')
              .attr('transform', `translate(0, ${i * 30})`)
              .style('cursor', 'pointer');

            g.append('rect')
              .attr('width', 15)
              .attr('height', 15)
              .attr('fill', COLORS[item.key as keyof typeof COLORS])
              .attr('stroke', '#000000')
              .attr('stroke-width', 1);

            g.append('text')
              .attr('x', 25)
              .attr('y', 12)
              .style('fill', 'white')
              .style('font-size', '24px')  // Increased from 20px to 24px
              .style('font-weight', 'bold')
              .text(item.label);
          });
        }

      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchAndRenderData();
  }, [filters, onElementHover, isTransitioning]);

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