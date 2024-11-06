import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useFilterContext } from '../stores/FilterContext';
import { loadCarData } from '../stores/dataLoader';

interface ParallelCoordinateProps {
  dataFilePath: string;
}

const ParallelCoordinate: React.FC<ParallelCoordinateProps> = ({ dataFilePath }) => {
  const chartRef = useRef<SVGSVGElement>(null);
  const { selectedMake, selectedBodyType, selectedState } = useFilterContext();
  const [data, setData] = useState<any[]>([]);
  const width = 500;
  const height = 400;
  const margin = { top: 60, right: 150, bottom: 30, left: 60 };

  const botColor = "#020024";
  const midColor = "#790976";
  const topColor = "#00d4ff";

  useEffect(() => {
    const processData = async () => {
      const allData = await loadCarData(dataFilePath);
      const filteredData = allData.filter((row) =>
        (selectedMake === 'ALL' || row.make === selectedMake) &&
        (selectedBodyType === 'ALL' || row.body === selectedBodyType) &&
        (selectedState === 'ALL' || row.state === selectedState)
      );

      const aggregatedData = selectedMake === 'ALL' ?
        d3.groups(filteredData, d => d.make).map(([make, values]) => ({
          make, body: values[0].body,
          year: d3.mean(values, d => d.year),
          odometer: d3.mean(values, d => d.odometer),
          mmr: d3.mean(values, d => d.mmr),
          sellingprice: d3.mean(values, d => d.sellingprice),
          condition: d3.mean(values, d => d.condition),
        })) :
        selectedBodyType === 'ALL' ?
        d3.groups(filteredData, d => d.body).map(([body, values]) => ({
          make: values[0].make, body,
          year: d3.mean(values, d => d.year),
          odometer: d3.mean(values, d => d.odometer),
          mmr: d3.mean(values, d => d.mmr),
          sellingprice: d3.mean(values, d => d.sellingprice),
          condition: d3.mean(values, d => d.condition),
        })) : filteredData;

      setData(aggregatedData);
    };

    processData();
  }, [dataFilePath, selectedMake, selectedBodyType, selectedState]);

  useEffect(() => {
    if (!data.length) return;

    d3.select(chartRef.current).selectAll('*').remove();
    const dimensions = ['year', 'odometer', 'mmr', 'sellingprice'];
    const yScales: { [key: string]: d3.ScaleLinear<number, number> | d3.ScalePoint<string> } = {};

    dimensions.forEach(dimension => {
      yScales[dimension] = d3.scaleLinear()
        .domain(d3.extent(data, d => d[dimension]) as [number, number])
        .range([height - margin.bottom, margin.top]);
    });

    const xScale = d3.scalePoint()
      .domain(dimensions)
      .range([margin.left, width - margin.right]);

    const conditionExtent = d3.extent(data, d => d.condition) as [number, number];

    const colorScale = d3.scaleLinear<string>()
      .domain([conditionExtent[0], (conditionExtent[0] + conditionExtent[1]) / 2, conditionExtent[1]])
      .range([botColor, midColor, topColor]);

    const svg = d3.select(chartRef.current)
      .attr('width', width)
      .attr('height', height);

    let title = 'Parallel Coordinate Plot';
    if (selectedMake === 'ALL' && selectedBodyType === 'ALL' && selectedState === 'ALL') {
      title += ' Grouped by Make';
    } else if (selectedMake !== 'ALL' && selectedBodyType === 'ALL') {
      title = `${selectedMake} Parallel Coordinate Plot Grouped by Body Type`;
    } else if (selectedMake !== 'ALL' && selectedBodyType !== 'ALL') {
      title = `${selectedMake} ${selectedBodyType} Parallel Coordinate Plot by Individual`;
    }
    if (selectedState !== 'ALL') title += ` (State: ${selectedState})`;

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', title.length > 36 ? '12px' : '16px')
      .style('font-weight', 'bold')
      .text(title);

      const tooltip = d3.select('#tooltip');
      if (tooltip.empty()) {
        d3.select('body').append('div')
          .attr('id', 'tooltip')
          .style('position', 'absolute')
          .style('padding', '8px')
          .style('background', '#333')
          .style('color', '#fff')
          .style('border-radius', '4px')
          .style('pointer-events', 'none')
          .style('opacity', 0);
      }

      svg.selectAll('.line-path')
        .data(data)
        .join('path')
        .attr('class', 'line-path')
        .attr('d', d => d3.line<number | string>()
          .x((_, i) => xScale(dimensions[i]) as number)
          .y((_, i) => yScales[dimensions[i]](d[dimensions[i]]))
          .curve(d3.curveMonotoneX)(dimensions.map(dim => d[dim]))
        )
        .attr('fill', 'none')
        .attr('stroke', d => colorScale(d.condition))
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.7)
        .on('mouseover', function(event, d) {
          d3.select(this)
            .attr('stroke-width', 3)
            .attr('opacity', 1);
  
          let tooltipContent = `Make: ${d.make}`;
          if (selectedMake !== 'ALL' && selectedBodyType !== 'ALL') {
            tooltipContent += `<br>Model: ${d.model}`;
          }
          if (selectedBodyType !== 'ALL') {
            tooltipContent += `<br>Body Type: ${d.body}`;
          }
          tooltipContent += `<br>${selectedMake === 'ALL' || selectedBodyType === 'ALL' ? 'Avg ' : ''}Year: ${d.year.toFixed(0)}`;
          tooltipContent += `<br>${selectedMake === 'ALL' || selectedBodyType === 'ALL' ? 'Avg ' : ''}Odometer: ${d.odometer.toFixed(0)}`;
          tooltipContent += `<br>${selectedMake === 'ALL' || selectedBodyType === 'ALL' ? 'Avg ' : ''}MMR: $${d.mmr.toFixed(2)}`;
          tooltipContent += `<br>${selectedMake === 'ALL' || selectedBodyType === 'ALL' ? 'Avg ' : ''}Selling Price: $${d.sellingprice.toFixed(2)}`;
          tooltipContent += `<br>${selectedMake === 'ALL' || selectedBodyType === 'ALL' ? 'Avg ' : ''}Condition: ${d.condition.toFixed(2)}`;
  
          tooltip
            .style('opacity', 1)
            .html(tooltipContent);
        })
        .on('mousemove', (event) => {
          tooltip
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 30}px`);
        })
        .on('mouseout', function() {
          d3.select(this)
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.7);
          tooltip.style('opacity', 0);
        });

    dimensions.forEach(dimension => {
      let axis = d3.axisLeft(yScales[dimension] as d3.ScaleLinear<number, number>);

      if (dimension === 'year') {
        axis.tickFormat(d3.format('d'));
      }

      if (dimension === 'odometer' || dimension === 'sellingprice' || dimension === 'mmr') {
        axis = d3.axisRight(yScales[dimension] as d3.ScaleLinear<number, number>);
      }

      svg.append('g')
        .attr('transform', `translate(${xScale(dimension)}, 0)`)
        .call(axis);

      const label = dimension === 'year' ? 'Year of Make'
                   : dimension === 'sellingprice' ? 'Selling Price'
                   : dimension === 'mmr' ? 'MMR'
                   : dimension.charAt(0).toUpperCase() + dimension.slice(1);

      svg.append('text')
        .attr('x', xScale(dimension))
        .attr('y', height - margin.bottom + 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .text(label);
    });

    const legendHeight = (height - margin.top - margin.bottom) / 2;

    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 60}, ${margin.top})`);

    const gradient = legend.append('defs')
      .append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', topColor);

    gradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', midColor);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', botColor);

    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 20)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)');

    const legendScale = d3.scaleLinear()
      .domain(conditionExtent)
      .range([0, legendHeight]);

    legend.append('g')
      .attr('transform', 'translate(25, 0)')
      .call(d3.axisRight(legendScale).ticks(5).tickFormat(d => `${d.toFixed(2)}`));

    legend.append('text')
      .attr('x', 0)
      .attr('y', legendHeight + 20)
      .attr('text-anchor', 'start')
      .style('font-size', '12px')
      .text('Condition');

  }, [data]);

  return <svg ref={chartRef}></svg>;
};

export default ParallelCoordinate;
