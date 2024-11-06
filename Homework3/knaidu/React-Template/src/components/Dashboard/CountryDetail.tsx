// src/components/Dashboard/CountryDetail.tsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ComponentSize, Margin } from '../../types';

interface CountryDetailProps {
  data: any[];
  detailedData: any[];
  selectedCountry: string | null;
  size: ComponentSize;
  margin: Margin;
}

export default function CountryDetail({ 
  data, 
  detailedData, 
  selectedCountry, 
  size, 
  margin 
}: CountryDetailProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current || !selectedCountry) return;
    if (size.width === 0 || size.height === 0) return;

    const width = size.width - margin.left - margin.right;
    const height = size.height - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr('width', size.width)
      .attr('height', size.height);

    const g = svg.append('g')
      .attr('transform', `translate(${size.width/2},${size.height/2})`);

    // Get data for selected country
    const countryData = data.find(d => d.country === selectedCountry);
    if (!countryData) return;

    // Create pie data
    const pieData = [
      { type: 'Gold', value: countryData['Gold Medal'] },
      { type: 'Silver', value: countryData['Silver Medal'] },
      { type: 'Bronze', value: countryData['Bronze Medal'] }
    ];

    // Create color scale
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['Gold', 'Silver', 'Bronze'])
      .range(['#FFD700', '#C0C0C0', '#CD7F32']);

    // Create pie chart
    const pie = d3.pie<any>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(Math.min(width, height) / 2 - 40);

    // Add slices
    const ar