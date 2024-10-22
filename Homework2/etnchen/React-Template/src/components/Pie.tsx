import React from 'react';
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

import { ComponentSize, Margin } from '../types';

interface sportEventPie {
  sport: string;
  total: number;
}

const TOP_N_SPORTS = 9; // Change this value as needed

export default function Pie() {
  const [data, setData] = useState<sportEventPie[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 40, right: 20, bottom: 80, left: 60 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);

  useResizeObserver({ ref: svgRef, onResize });

  useEffect(() => {
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/olymic/events.csv', d => {
          return { sport: d.sport, event: d.event };
        });

        const sportsData = d3.rollups(
          csvData,
          v => v.length, // count the number of events per sport
          d => d.sport
        ).map(([sport, total]) => ({ sport, total }));

        // Sort and limit to top N sports, grouping others
        sportsData.sort((a, b) => b.total - a.total);
        const topSports = sportsData.slice(0, TOP_N_SPORTS);
        const othersTotal = sportsData.slice(TOP_N_SPORTS).reduce((acc, d) => acc + d.total, 0);

        // Add "Others" category 
        if (othersTotal > 0) {
          topSports.push({ sport: 'Others', total: othersTotal });
        }

        setData(topSports);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };

    dataFromCSV();
  }, []);

  useEffect(() => {
    if (isEmpty(data)) return;
    if (size.width === 0 || size.height === 0) return;
    d3.select(svgRef.current).selectAll('*').remove(); // Ensure clean slate
    renderPieChart();
  }, [data, size]);

  function renderPieChart() {
    const radius = Math.min(size.width, size.height) / 2 - Math.max(margin.top, margin.bottom);
    const color = d3.scaleOrdinal(d3.schemeCategory10); // Color scheme for the pie chart

    const pie = d3.pie<sportEventPie>()
      .value(d => d.total);

    const arc = d3.arc<d3.PieArcDatum<sportEventPie>>()
      .outerRadius(radius)
      .innerRadius(0); // Full pie chart, no inner radius

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${size.width} ${size.height}`)  // Set viewBox
      .attr('width', size.width)
      .attr('height', size.height);

    const chartContainer = svg.append('g')
      .attr('transform', `translate(${size.width / 2 -50}, ${size.height / 2})`);

    // Create pie slices
    chartContainer.selectAll('path')
      .data(pie(data))
      .join('path')
      .attr('d', arc)
      .attr('fill', (d, i) => color(i.toString()))
      .attr('stroke', 'white')
      .style('stroke-width', '2px');

    // Add text labels to slices
    chartContainer.selectAll('text')
      .data(pie(data))
      .join('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(d => d.data.sport.length > 10 ? d.data.sport.substring(0, 10) + '...' : d.data.sport); // ... long names

    // Add tooltips
    chartContainer.selectAll('path')
      .on('mouseover', function(event, d) {
        const [x, y] = d3.pointer(event);
        d3.select(this).append('title')
          .text(`${d.data.sport}: ${d.data.total}`);
      });
  }

  return (
    <>
      <div className='chart-container'>
        <svg ref={svgRef} width='600' height='600'></svg> {/* Set height for testing */}
      </div>
    </>
  );
}
