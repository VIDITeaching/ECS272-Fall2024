// src/components/Dashboard/components/WorldMapView.tsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ComponentSize, Margin } from '../../../types';

interface WorldMapProps {
  data: any[];
  size: ComponentSize;
  margin: Margin;
  onCountrySelect: (country: string) => void;
}

const WorldMapView: React.FC<WorldMapProps> = ({ data, size, margin, onCountrySelect }) => {
  const mapRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !mapRef.current) return;

    const width = size.width - margin.left - margin.right;
    const height = size.height - margin.top - margin.bottom;

    // Clear previous content
    d3.select(mapRef.current).selectAll("*").remove();

    const svg = d3.select(mapRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create map container with margin
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create color scale
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(data, d => d.Total) || 0]);

    // Fetch and render the world map
    d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then((worldData: any) => {
        // Create projection
        const projection = d3.geoMercator()
          .fitSize([width - margin.left - margin.right, height - margin.top - margin.bottom], worldData);

        const path = d3.geoPath().projection(projection);

        // Create tooltip
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('opacity', 0);

        // Draw countries
        g.selectAll('path')
          .data(worldData.features)
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
              tooltip.transition()
                .duration(200)
                .style('opacity', .9);
              tooltip.html(`
                <strong>${countryData.country}</strong><br/>
                Gold: ${countryData["Gold Medal"]}<br/>
                Silver: ${countryData["Silver Medal"]}<br/>
                Bronze: ${countryData["Bronze Medal"]}<br/>
                Total: ${countryData.Total}
              `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            }
          })
          .on('mouseout', () => {
            tooltip.transition()
              .duration(500)
              .style('opacity', 0);
          })
          .on('click', (event, d) => {
            const countryData = data.find(m => m.country_code === d.id);
            if (countryData) {
              onCountrySelect(countryData.country_code);
            }
          });

        // Add legend
        const legendWidth = 200;
        const legendHeight = 10;
        const legend = svg.append('g')
          .attr('transform', `translate(${width - legendWidth - margin.right}, ${height - margin.bottom})`);

        const legendScale = d3.scaleLinear()
          .domain(colorScale.domain())
          .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale)
          .ticks(5);

        legend.append('rect')
          .attr('width', legendWidth)
          .attr('height', legendHeight)
          .style('fill', 'url(#medal-gradient)');

        legend.append('g')
          .call(legendAxis)
          .attr('transform', `translate(0,${legendHeight})`);
      });

  }, [data, size, margin]);

  return (
    <div className="world-map-container">
      <svg ref={mapRef} className="world-map"></svg>
    </div>
  );
};

export default WorldMapView;