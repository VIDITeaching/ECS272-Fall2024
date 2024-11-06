import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';

type Combinations = {
  '100': number; // Depression only
  '010': number; // Anxiety only
  '001': number; // Panic Attack only
  '110': number; // Depression and Anxiety
  '101': number; // Depression and Panic Attack
  '011': number; // Anxiety and Panic Attack
  '111': number; // All three conditions
};

type VennDiagramComponentProps = {
  selectedRegion: string | null;
  onRegionClick?: (regionCode: keyof Combinations) => void;
};

export default function VennDiagramComponent({ selectedRegion, onRegionClick }: VennDiagramComponentProps) {
  const [cleanData, setCleanData] = useState<any[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, null, undefined> | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 400, height: 300 });

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        setSize({
          width: chartRef.current.offsetWidth,
          height: chartRef.current.offsetHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await d3.csv('/data/Cleaned_Student_Mental_Health.csv', d3.autoType);
        setCleanData(data);
      } catch (error) {
        console.error('Error loading cleaned CSV:', error);
      }
    };

    loadData();
  }, []);

  // Tooltip
  useEffect(() => {
    if (chartRef.current && !tooltipRef.current) {
      tooltipRef.current = d3.select(chartRef.current)
        .append('div')
        .attr('id', 'tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background-color', 'rgba(255, 255, 255, 0.8)')
        .style('padding', '8px')
        .style('border', '1px solid #ccc')
        .style('border-radius', '4px')
        .style('pointer-events', 'none')
        .style('font-size', '14px')
        .style('color', '#333')
        .style('box-shadow', '0px 2px 6px rgba(0,0,0,0.2)');
    }
  }, []);

  function calculateFrequencies(data: any[]): Combinations {
    const combinations: Combinations = {
      '100': 0,
      '010': 0,
      '001': 0,
      '110': 0,
      '101': 0,
      '011': 0,
      '111': 0,
    };

    data.forEach((d) => {
      const key = `${d["Do you have Depression?"]?.toLowerCase() === 'yes' ? 1 : 0}${
        d["Do you have Anxiety?"]?.toLowerCase() === 'yes' ? 1 : 0
      }${d["Do you have Panic attack?"]?.toLowerCase() === 'yes' ? 1 : 0}` as keyof Combinations;
      combinations[key]++;
    });

    return combinations;
  }

  useEffect(() => {
    if (cleanData.length === 0 || size.width === 0 || size.height === 0 || !tooltipRef.current) return;

    d3.select(chartRef.current).select('svg').remove();

    const frequencies = calculateFrequencies(cleanData);

    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('width', size.width)
      .attr('height', size.height)
      .style('background-color', '#f0f0f0');

    // Add title
    svg.append('text')
      .attr('x', size.width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Overall mental health distribution');

    const centerX = size.width / 2;
    const centerY = size.height / 2 + 10;

    const radius = Math.min(size.width, size.height) / 4;
    const xOffset = radius / 1.5;
    const yOffset = radius / 3;

    const g = svg
      .append('g')
      .attr('transform', `translate(${centerX}, ${centerY - 10})`);

    function handleRegionClick(regionCode: keyof Combinations) {
      if (onRegionClick) {
        onRegionClick(regionCode);
      }
    }

    const regionLabels: { [key: string]: string } = {
      '100': 'Depression',
      '010': 'Anxiety',
      '001': 'Panic Attack',
      '110': 'Depression & Anxiety',
      '101': 'Depression & Panic Attack',
      '011': 'Anxiety & Panic Attack',
      '111': 'Depression & Anxiety & Panic Attack',
    };

    // Circles
    const circleData = [
      { cx: -xOffset, cy: -yOffset, condition: 'Depression', color: 'red', index: 0 },
      { cx: xOffset, cy: -yOffset, condition: 'Anxiety', color: 'green', index: 1 },
      { cx: 0, cy: radius / 1.5, condition: 'Panic Attack', color: 'blue', index: 2 },
    ];

    const circles = g.selectAll('circle')
      .data(circleData);

    circles.enter()
      .append('circle')
      .attr('cx', d => d.cx)
      .attr('cy', d => d.cy)
      .attr('r', radius)
      .style('fill', d => d.color)
      .style('stroke', '#999999')
      .style('stroke-width', '2px')
      .style('fill-opacity', d =>
        selectedRegion ? (selectedRegion[d.index] === '1' ? 0.7 : 0.2) : 0.5
      )
      .on('mouseover', function (event, d) {
        tooltipRef.current!
          .style('visibility', 'visible')
          .text(d.condition);
      })
      .on('mousemove', function (event) {
        const [x, y] = d3.pointer(event, chartRef.current);
        tooltipRef.current!
          .style('top', `${y - 10}px`)
          .style('left', `${x + 10}px`);
      })
      .on('mouseout', function () {
        tooltipRef.current!.style('visibility', 'hidden');
      })
      .on('click', function () {
        tooltipRef.current!.style('visibility', 'hidden');
      });

    // Labels
    g.selectAll('.condition-label')
      .data(circleData)
      .enter()
      .append('text')
      .attr('x', d => d.cx)
      .attr('y', d => (d.cy < 0 ? d.cy - radius - 10 : d.cy + radius + 20))
      .attr('text-anchor', 'middle')
      .attr('class', 'condition-label')
      .style('font-size', '14px')
      .style('fill', 'black')
      .text(d => d.condition);

    // Frequencies
    const frequencyPositions = [
      { code: '100', x: -xOffset - radius / 2, y: -yOffset },
      { code: '010', x: xOffset + radius / 2, y: -yOffset },
      { code: '001', x: 0, y: radius / 1.5 + radius / 2 },
      { code: '110', x: 0, y: -yOffset - yOffset / 2 },
      { code: '101', x: (-xOffset + 0) / 2 - xOffset / 4, y: (-yOffset + radius / 1.5) / 2 + yOffset / 2 },
      { code: '011', x: (xOffset + 0) / 2 + xOffset / 4, y: (-yOffset + radius / 1.5) / 2 + yOffset / 2 },
      { code: '111', x: 0, y: yOffset / 2 },
    ];

    frequencyPositions.forEach((pos) => {
      g.append('rect')
        .attr('x', pos.x - 20)
        .attr('y', pos.y - 20)
        .attr('width', 40)
        .attr('height', 40)
        .style('fill', 'transparent')
        .style('cursor', 'pointer')
        .on('click', () => {
          tooltipRef.current!.style('visibility', 'hidden');
          handleRegionClick(pos.code as keyof Combinations);
        })
        .on('mouseover', function () {
          tooltipRef.current!
            .style('visibility', 'visible')
            .text(regionLabels[pos.code]);
        })
        .on('mousemove', function (event) {
          const [x, y] = d3.pointer(event, chartRef.current);
          tooltipRef.current!
            .style('top', `${y - 10}px`)
            .style('left', `${x + 10}px`);
        })
        .on('mouseout', function () {
          tooltipRef.current!.style('visibility', 'hidden');
        });
    });

    g.selectAll('.frequency-text')
      .data(frequencyPositions)
      .enter()
      .append('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('text-anchor', 'middle')
      .attr('class', 'frequency-text')
      .style('font-size', '12px')
      .style('fill', d => (selectedRegion === d.code ? 'yellow' : 'black'))
      .style('cursor', 'pointer')
      .text(d => frequencies[d.code as keyof Combinations])
      .on('click', (event, d) => {
        tooltipRef.current!.style('visibility', 'hidden');
        handleRegionClick(d.code as keyof Combinations);
      })
      .on('mouseover', function (event, d) {
        tooltipRef.current!
          .style('visibility', 'visible')
          .text(regionLabels[d.code]);
      })
      .on('mousemove', function (event) {
        const [x, y] = d3.pointer(event, chartRef.current);
        tooltipRef.current!
          .style('top', `${y - 10}px`)
          .style('left', `${x + 10}px`);
      })
      .on('mouseout', function () {
        tooltipRef.current!.style('visibility', 'hidden');
      });

    circles.merge(circles)
      .transition()
      .duration(500)
      .style('fill-opacity', d =>
        selectedRegion ? (selectedRegion[d.index] === '1' ? 0.7 : 0.2) : 0.5
      );

    // Legend
    const legendData = [
      { label: 'Depression', color: 'red' },
      { label: 'Anxiety', color: 'green' },
      { label: 'Panic Attack', color: 'blue' },
    ];

    const legend = svg.append('g')
      .attr('transform', `translate(${size.width - 120}, ${size.height - 100})`);

    legend.selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (d, i) => i * 25)
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', d => d.color);

    legend.selectAll('.legend-label')
      .data(legendData)
      .enter()
      .append('text')
      .attr('x', 22)
      .attr('y', (d, i) => i * 25 + 14)
      .style('font-size', '14px')
      .text(d => d.label);

  }, [cleanData, size, selectedRegion]);

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', maxWidth: '400px', height: '300px', marginBottom: '0px', position: 'relative' }}
    />
  );
}
