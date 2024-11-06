import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Paper, Divider, Button } from '@mui/material';
import { useState } from 'react';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

import { Margin, ComponentSize } from '.../types.ts';
import { isEmpty, truncate } from 'lodash';
import Tooltip from './Tooltip';

interface Data {
  country_code: string
  country_name: string
  country_name_long: string
  medalsPerAthlete: number
  numAthletes: number
  totalMedals: number
}
type Param = {
  toggleCountry: (countryCode: string) => void,
  selectedCountries: string[]
}

const ScatterPlot = ({ toggleCountry, selectedCountries }: Param) => {
  const [data, setData] = useState<Data[]>([]);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });

  const margin: Margin = { top: 40, bottom: 55, left: 55, right: 20 };

  const chartRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null)
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 0);
  useResizeObserver({ ref: chartRef, onResize });

  useEffect(() => {
    const dataFromCSV = async () => {
      try {
        // load the dataframes
        const medalData = await d3.csv('../../data/archive/medals.csv', d => {
          const medalNameMap = new Map([
            ['Gold Medal', 'gold'],
            ['Silver Medal', 'silver'],
            ['Bronze Medal', 'bronze']
          ]);
          return {
            country_code: d.country_code,
            country_name: d.country,
            country_name_long: d.country_long,
            medal: medalNameMap.get(d.medal_type) ?? 'undefined'
          };
        });

        const athleteData = await d3.csv('../../data/archive/athletes.csv', d => {
          return {
            country_code: d.country_code
          };
        });

        const countriesData = await d3.csv('../../data/archive/nocs.csv', d => {
          return {
            code: d.code,
            country: d.country,
            country_long: d.country_long
          };
        });

        const countryNameMap = new Map(
          countriesData.map(d => [d.code, { country: d.country, country_long: d.country_long }])
        );

        // count medals, and athlete counts for each country
        const medalCounts = d3.rollup(
          medalData,
          v => v.length,
          d => d.country_code
        );

        const athleteCounts = d3.rollup(
          athleteData,
          v => v.length,
          d => d.country_code
        );

        // create final data        
        const data = Array.from(medalCounts, ([country_code, totalMedals]) => {
          const numAthletes = athleteCounts.get(country_code) || 0;
          const countryNames = countryNameMap.get(country_code);
          return {
            country_code,
            country_name: countryNames?.country ?? '',
            country_name_long: countryNames?.country_long ?? '',
            numAthletes,
            totalMedals,
            medalsPerAthlete: numAthletes > 0 ? totalMedals / numAthletes : 0
          };
        });

        setData(data);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };
    dataFromCSV();
  }, []);

  useEffect(() => {
    if (isEmpty(data)) return;
    if (size.width === 0 || size.height === 0) return;
    d3.select('#scatter-svg').selectAll('*').remove();
    initChart();
    updateChart(); // Initial color update for selected countries
  }, [size, data]);

  useEffect(() => {
    // Update chart colors without reinitializing everything
    updateChart();
  }, [selectedCountries]);

  const initChart = () => {
    const chartContainer = d3.select('#scatter-svg');
    const tooltip = d3.select('#scatter-tooltip');
    const xScale = d3.scaleLog().domain([3, 1000]).range([margin.left, size.width - margin.right]);
    const yScale = d3.scaleLinear().domain([0, d3.max(data, d => d.medalsPerAthlete) || 0]).range([size.height - margin.bottom, margin.top]).nice();
    const radiusScale = d3.scaleSqrt().domain([0, d3.max(data, d => d.totalMedals) || 0]).range([5, 40]);

    // Define the x and y axes
    const xAxisG = chartContainer.append('g').attr('transform', `translate(0, ${size.height - margin.bottom})`).call(d3.axisBottom(xScale));
    const yAxisG = chartContainer.append('g').attr('transform', `translate(${margin.left}, 0)`).call(d3.axisLeft(yScale));

    // Add axis labels and title
    chartContainer.append('text')
      .attr('x', size.width / 2).attr('y', 20)
      .style('text-anchor', 'middle')
      .text('Average medals per athlete vs number of athletes');
    chartContainer.append('text')
      .attr('x', size.width / 2)
      .attr('y', size.height - margin.bottom / 3)
      .style('text-anchor', 'middle').text('Number of athletes');
    chartContainer.append('text')
      .attr('transform', `translate(${margin.left / 3}, ${size.height / 2}) rotate(-90)`).style('text-anchor', 'middle').text('Average medals per athlete');

    // Render circles initially (uncolored)
    chartContainer.append('g').attr('class', 'circles').selectAll('circle').data(data).join('circle')
      .attr('cx', d => xScale(d.numAthletes))
      .attr('cy', d => yScale(d.medalsPerAthlete))
      .attr('r', d => radiusScale(d.totalMedals))
      .attr('fill', 'lightgray')
      .attr('opacity', 0.5)
      .on('click', (event, d) => toggleCountry(d.country_code))
      .on('mouseout', function () {
        tooltip.style('display', 'none');
      })
      .on('mouseover', function (event, d) {
        tooltip.style('display', 'block');
      })
      .on('mousemove', function (event, d) {
        const [x, y] = d3.pointer(event);
        const svgRect = svgRef.current?.getBoundingClientRect();

        if (!svgRect) return

        const isSelected = selectedCountries.includes(d.country_code)
        console.log(isSelected)

        tooltip
          .style('left', `${ svgRect.left + x }px`)
          .style('top', `${ svgRect.top + y - 70 }px`)
          .html(`
            <strong>Country:</strong> ${d.country_name}<br/>
            <strong>Medals:</strong> ${d.totalMedals}<br/>
            <strong>Num Athletes:</strong> ${d.numAthletes}<br/>
            <strong>Medals Per Athletes:</strong> ${d.medalsPerAthlete.toFixed(2)}<br/>
            (click to select/deselect)`
          );
      })

    // Zoom behavior setup
    const zoom = d3.zoom().scaleExtent([0.5, 10])
      .filter((event) => !event.ctrlKey && event.type !== 'dblclick')
      .on('zoom', (event) => {
        const newXScale = event.transform.rescaleX(xScale);
        const newYScale = event.transform.rescaleY(yScale);
        xAxisG.call(d3.axisBottom(newXScale));
        yAxisG.call(d3.axisLeft(newYScale));
        chartContainer.selectAll('circle')
          .attr('cx', d => newXScale(d.numAthletes))
          .attr('cy', d => newYScale(d.medalsPerAthlete));
      });
    chartContainer.call(zoom);
  };

  const updateChart = () => {
    const chartContainer = d3.select('#scatter-svg');
    chartContainer.selectAll('circle')
      .data(data)
      .transition()
      .duration(300)
      .attr('fill', d => selectedCountries.includes(d.country_code) ? 'lime' : 'lightgray')
      .attr('opacity', 0.5);
  };

  return (
    <div ref={chartRef} className='chart-container'>
      <Tooltip id='scatter-tooltip' />
      <svg id='scatter-svg' width='100%' height='100%' ref={svgRef} />
    </div>
  );
}

export default ScatterPlot;
