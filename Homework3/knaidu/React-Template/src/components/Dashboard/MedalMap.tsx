// src/components/Dashboard/MedalMap.tsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { ComponentSize, Margin } from '../../types';

interface MedalMapProps {
  data: any[];
  size: ComponentSize;
  margin: Margin;
  onCountrySelect: (country: string) => void;
}

export default function MedalMap({ data, size, margin, onCountrySelect }: MedalMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;
    if (size.width === 0 || size.height === 0) return;

    const width = size.width - margin.left - margin.right;
    const height = size.height - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr('width', size.width)
      .attr('height', size.height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create projection
    const projection = d3.geoMercator()
      .fitSize([width, height], { type: "Sphere" });

    const path = d3.geoPath().projection(projection);

    // Create color scale for medals
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(data, d => d.Total) || 0]);

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'white')
      .style('padding', '10px')
      .style('border-radius', '5px')
      .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)');

    // Load world topology
    d3.json('/path-to-world-topology.json').then(worldData => {
      const countries = feature(worldData, worldData.objects.countries);

      // Draw map
      g.selectAll('path')
        .data(countries.features)
        .join('path')
        .attr('d', path)
        .attr('fill', d => {
          const countryData = data.find(m => m.country_code === d.id);
          return countryData ? colorScale(countryData.Total) : '#eee';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .on('mouseover', (event, d) => {
          const countryData = data.find(m => m.country_code === d.id);
          if (countryData) {
            d3.select(event.currentTarget)
              .attr('stroke-width', 1.5)
              .attr('stroke', '#333');

            tooltip
              .style('visibility', 'visible')
              .html(`
                <strong>${countryData.country}</strong><br/>
                Gold: ${countryData['Gold Medal']}<br/>
                Silver: ${countryData['Silver Medal']}<br/>
                Bronze: ${countryData['Bronze Medal']}<br/>
                Total: ${countryData.Total}
              `);
          }
        })
        .on('mousemove', (event) => {
          tooltip
            .style('top', (event.pageY - 10) + 'px')
            .style('left', (event.pageX + 10) + 'px');
        })
        .on('mouseout', (event) => {
          d3.select(event.currentTarget)
            .attr('stroke-width', 0.5)
            .attr('stroke', '#fff');
          tooltip.style('visibility', 'hidden');
        })
        .on('click', (event, d) => {
          const countryData = data.find(m => m.country_code === d.id);
          if (countryData) {
            onCountrySelect(countryData.country);
          }
        });

      // Add legend
      const legendGroup = svg.append('g')
        .attr('transform', `translate(${size.width - margin.right - 60}, ${margin.top})`);

      const legendScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([0, 200]);

      const legendAxis = d3.axisRight(legendScale)
        .ticks(5)
        .tickSize(15);

      legendGroup.selectAll('rect')
        .data(d3.range(200))
        .join('rect')
        .attr('x', 0)
        .attr('y', d => d)
        .attr('width', 15)
        .attr('height', 1)
        .attr('fill', d => colorScale(legendScale.invert(d)));

      legendGroup.append('g')
        .call(legendAxis)
        .attr('font-size', '10px');
    });

    return () => {
      tooltip.remove();
    };
  }, [data, size]);

  return <svg ref={svgRef} />;
}