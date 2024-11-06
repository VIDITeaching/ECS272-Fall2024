import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useState } from 'react';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

import { Margin, ComponentSize } from '.../types.ts';
import { isEmpty } from 'lodash';
import Tooltip from './Tooltip';

interface CountryMedals {
  country_name: string;
  country_name_long: string;
  country_code: string;
  gold: number;
  relativeGold: number;
  silver: number;
  relativeSilver: number;
  bronze: number;
  relativeBronze: number;
  total: number;
}

export type SortingOptions = 'total' | 'gold' | 'silver' | 'bronze' | 'relativeGold';

type Param = { 
  sortingOption: SortingOptions,
   number: number, 
   toggleCountry: (countryCode: string) => void,
   selectedCountries: string[]
  }

const StackedBarChart = ({ sortingOption, number, toggleCountry, selectedCountries}: Param) => {
  const [data, setData] = useState<CountryMedals[]>([]);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });

  const margin: Margin = { top: 20, bottom: 35, left: 50, right: 20 };

  const chartRef = useRef<HTMLDivElement>(null);
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 0);
  useResizeObserver({ ref: chartRef, onResize });

  // Reading and processing data.
  useEffect(() => {
    const dataFromCSV = async () => {
      try {
        const medalData = await d3.csv('../../data/archive/medals_total.csv', d => ({
          country_code: d.country_code,
          country_name: d.country,
          country_name_long: d.country_long,
          gold: +d['Gold Medal'],
          relativeGold: +d['Gold Medal'] / +d['Total'],
          silver: +d['Silver Medal'],
          relativeSilver: +d['Silver Medal'] / +d['Total'],
          bronze: +d['Bronze Medal'],
          relativeBronze: +d['Bronze Medal'] / +d['Total'],
          total: +d['Total'],
        }))
        setData(medalData)
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };
    dataFromCSV();
  }, []);

  useEffect(() => {
    if (isEmpty(data)) return;
    if (size.width === 0 || size.height === 0) return;

    d3.select('#stacked-bar-svg').selectAll('*').remove() // clear container
    initChart();
    updateChart();
  }, [data, size]);

  useEffect(() => {
    if (!isEmpty(data) && size.width > 0 && size.height > 0) {
      updateChart();
    }
  }, [sortingOption, number, selectedCountries]);

  const initChart = () => {
    const chartContainer = d3.select('#stacked-bar-svg');

    // Set up initial scales and axes
    chartContainer.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${size.height - margin.bottom})`);

    chartContainer.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${margin.left}, 0)`);

    // Append initial chart labels and title
    chartContainer.append('g')
      .attr('transform', `translate(${margin.left / 3}, ${size.height / 2}) rotate(-90)`)
      .append('text')
      .text('Total medals')
      .style('font-size', '.8rem')
      .style('text-anchor', 'middle');

    chartContainer.append('g')
      .attr('transform', `translate(${margin.left + (size.width - margin.left - margin.right) / 2}, ${size.height - margin.bottom / 9})`)
      .append('text')
      .text('Countries')
      .style('text-anchor', 'middle')
      .style('font-size', '.8rem');

    chartContainer.append('g')
      .attr('transform', `translate(${size.width / 2}, ${margin.top})`)
      .append('text')
      .text('Medals earned by each country')
      .style('font-size', '1rem')
      .style('text-anchor', 'middle');
  };

  const updateChart = () => {
    const chartContainer = d3.select('#stacked-bar-svg');
    const tooltip = d3.select('#bar-tooltip');


    const truncatedData: CountryMedals[] = data
      .sort((a, b) => b[sortingOption] - a[sortingOption])
      .slice(0, number);

    const yMax: number = d3.max(truncatedData.map(d => d.total)) as number;
    const xCategories: string[] = truncatedData.map(d => d.country_code);

    // Update scales
    const xScale = d3.scaleBand()
      .rangeRound([margin.left, size.width - margin.right])
      .domain(xCategories)
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain(sortingOption === 'relativeGold' ? [0, 1.1] : [0, yMax])
      .range([size.height - margin.bottom, margin.top]);

    // Update axes with transitions
    chartContainer.select('.x-axis')
      .transition()
      .duration(500)
      .call(d3.axisBottom(xScale));

    chartContainer.select('.y-axis')
      .transition()
      .duration(500)
      .call(d3.axisLeft(yScale));

    // Set stack keys based on sortingOption
    const stackKeys = sortingOption === 'gold' ? ['gold', 'silver', 'bronze'] :
                      sortingOption === 'relativeGold' ? ['relativeGold', 'relativeSilver', 'relativeBronze'] :
                      sortingOption === 'silver' ? ['silver', 'bronze', 'gold'] : ['bronze', 'silver', 'gold']

    // Stack the data with the determined order
    const stack = d3.stack<CountryMedals>().keys(stackKeys);
    const stackedData = stack(truncatedData); 

    // Bind data to layers and use enter, update, and exit pattern
    const layers = chartContainer.selectAll('g.layer')
      .data(stackedData, d => d.key);

    layers.enter()
      .append('g')
      .attr('class', 'layer')
      .attr('fill', (d, i) => {
        const colorMap = {
          gold: 'rgb(255, 223, 127)', silver: 'rgb(216, 216, 216)', bronze: 'rgb(205, 160, 128)',
          relativeGold: 'rgb(255, 223, 127)', relativeSilver: 'rgb(216, 216, 216)', relativeBronze: 'rgb(205, 160, 128)'
        };
        return colorMap[stackKeys[i]];  // Map color based on the stack order
      })
      .merge(layers)
      .selectAll('rect')
      .data(d => d as Array<[number, number] & { data: CountryMedals }>, d => d.data.country_code)
      .join(
        enter => enter.append('rect')
          .attr('x', d => xScale(d.data.country_code) as number)
          .attr('y', d => yScale(d[1]) as number)
          .attr('height', d => Math.abs(yScale(d[0]) - yScale(d[1])))
          .attr('width', xScale.bandwidth())
          .style('opacity', 0)
          .on('mouseover', function (event, d) {
            tooltip.style('display', 'block');
          })
          .on('mousemove', function (event, d) {
            const [x, y] = d3.pointer(event);
            tooltip
              .style('left', `${x}px`)
              .style('top', `${y}px`)

            // style tooltip for relative medals differently
            if (sortingOption === 'relativeGold') {
              const v = (d[1] - d[0]) * 100
              tooltip
                .html(`
                    <strong>Country:</strong> ${d.data.country_name}<br/>
                    <strong>Medal Percent:</strong> ${v.toFixed(2)}%
                  `);
            } else {
              tooltip
                .html(`
                  <strong>Country:</strong> ${d.data.country_name}<br/>
                  <strong>Medals:</strong> ${d[1] - d[0]}
                `);
            }
          })
          .on('mouseout', function () {
            tooltip.style('display', 'none');
          })
          .on('click', function (event, d) {
            // console.log(`Country code:`, d.data);
            toggleCountry(d.data.country_code)
          })
          .transition()
          .duration(500)
          .style('stroke-width', '3px')
          .style('stroke', d => selectedCountries.includes(d.data.country_code) ? 'black' : 'none')
          .style('opacity', 1),
        update => update
          .interrupt()
          .style('opacity', 1)
          .transition()
          .duration(500)
          .attr('x', d => xScale(d.data.country_code) as number)
          .attr('y', d => yScale(d[1]) as number)
          .attr('height', d => Math.abs(yScale(d[0]) - yScale(d[1])))
          .attr('width', xScale.bandwidth())
          .style('stroke-width', '3px')
          .style('stroke', d => selectedCountries.includes(d.data.country_code) ? 'black' : 'none'),
        exit => exit
          .transition()
          .duration(500)
          .style('opacity', 0)
          .remove()
      );

    layers.exit().remove();
  };




  return (
    <div ref={chartRef} className='chart-container'>
      <Tooltip id='bar-tooltip'/>
      <svg id='stacked-bar-svg' width='100%' height='100%' />
    </div>
  );
};

export default StackedBarChart;
