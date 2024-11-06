// src/components/Dashboard/MedalTimeline.tsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ComponentSize, Margin } from '../../../types';

interface MedalTimelineProps {
  data: any[];
  size: ComponentSize;
  margin: Margin;
  selectedCountry?: string | null;
}

const MedalTimeline: React.FC<MedalTimelineProps> = ({ 
  data, 
  size, 
  margin,
  selectedCountry 
}) => {
  const timelineRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !timelineRef.current) return;

    const width = size.width - margin.left - margin.right;
    const height = size.height - margin.top - margin.bottom;

    // Clear previous content
    d3.select(timelineRef.current).selectAll("*").remove();

    const svg = d3.select(timelineRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Process data to show daily medal counts
    const dailyMedals = Array.from(
      d3.group(data, d => d3.timeDay(new Date(d.medal_date))),
      ([date, medals]) => ({
        date,
        gold: medals.filter(m => m.medal_type === 'Gold Medal').length,
        silver: medals.filter(m => m.medal_type === 'Silver Medal').length,
        bronze: medals.filter(m => m.medal_type === 'Bronze Medal').length,
        total: medals.length,
        details: d3.group(medals, m => m.medal_type)
      })
    ).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(dailyMedals, d => d.date) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(dailyMedals, d => Math.max(d.gold, d.silver, d.bronze)) || 0])
      .range([height, 0])
      .nice();

    // Create medal type series
    const medalTypes = [
      { key: 'gold', color: '#FFD700', label: 'Gold Medals' },
      { key: 'silver', color: '#C0C0C0', label: 'Silver Medals' },
      { key: 'bronze', color: '#CD7F32', label: 'Bronze Medals' }
    ];

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'medal-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'white')
      .style('padding', '10px')
      .style('border-radius', '4px')
      .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
      .style('pointer-events', 'none')
      .style('z-index', 1000);

    // Draw lines and points
    medalTypes.forEach(({ key, color, label }) => {
      // Create line
      const line = d3.line<any>()
        .x(d => xScale(d.date))
        .y(d => yScale(d[key]))
        .curve(d3.curveMonotoneX);

      svg.append('path')
        .datum(dailyMedals)
        .attr('class', `line-${key}`)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('d', line);

      // Add points
      svg.selectAll(`circle-${key}`)
        .data(dailyMedals)
        .join('circle')
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d[key]))
        .attr('r', 4)
        .attr('fill', color)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .on('mouseover', (event, d) => {
          tooltip.transition()
            .duration(200)
            .style('opacity', .9);
          
          const details = Array.from(d.details.get(key + ' Medal') || [])
            .map(m => `${m.name} - ${m.event}`)
            .join('<br>');
          
          tooltip.html(`
            <strong>${label} on ${d3.timeFormat('%B %d')(d.date)}</strong><br>
            Count: ${d[key]}<br>
            <small>${details}</small>
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => {
          tooltip.transition()
            .duration(500)
            .style('opacity', 0);
        });
    });

    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(d3.timeDay)
      .tickFormat(d3.timeFormat('%b %d'));

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale));

    // Add axis labels
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Number of Medals');

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 120}, 0)`);

    medalTypes.forEach(({ key, color, label }, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', color);

      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 10)
        .text(label);
    });

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text(selectedCountry ? 
        `Medal Distribution for ${selectedCountry}` : 
        'Overall Medal Distribution'
      );

  }, [data, size, margin, selectedCountry]);

  return (
    <div className="timeline-container">
      <svg ref={timelineRef} className="timeline-chart"></svg>
    </div>
  );
};

export default MedalTimeline;