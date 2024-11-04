import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { ComponentSize, Margin } from '../types';

export default function BubbleChart({ selectedBar }) {
  const [data, setData] = useState([]);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 10, right: 50, bottom: 50, left: 150 };

  const calculateHeight = (width: number) => width * 0.6;

  const onResize = useDebounceCallback(() => {
    const parentElement = bubbleRef.current?.parentElement;
    if (parentElement) {
      const newWidth = parentElement.clientWidth;
      const newHeight = calculateHeight(newWidth);
      setSize({ width: newWidth, height: newHeight });
    }
  }, 200);

  useResizeObserver({ ref: bubbleRef, onResize });

  useEffect(() => {
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/student-por.csv', d => ({
          Medu: +d.Medu,
          Fedu: +d.Fedu,
          G3: +d.G3,
        }));

        const groupedData = d3.rollups(
          csvData,
          (v) => d3.mean(v, (d) => d.G3),
          (d) => d.Medu,
          (d) => d.Fedu
        ).map(([Medu, values]) => ({
          Medu,
          values: values.map(([Fedu, avgG3]) => ({ Fedu, avgG3 })),
        }));

        const flattenedData = groupedData.flatMap((group) =>
          group.values.map((v) => ({ Medu: group.Medu, Fedu: v.Fedu, avgG3: v.avgG3 }))
        );

        setData(flattenedData);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };
    dataFromCSV();
  }, []);

  // 检测 selectedBar 的变化，并重新初始化图表
  useEffect(() => {
    d3.select('#bubble-svg').selectAll('*').remove();
    initChart();
  }, [data, size, selectedBar]);

  function getFillColor(d) {
    const sumEdu = d.Medu + d.Fedu;
    console.log("selectedBar:", selectedBar, "sumEdu:", sumEdu);

    // 高亮条件判断
    if (selectedBar === '0-2' && sumEdu <= 2) {
      return 'white'; // 高亮颜色
    } else if (selectedBar === '3-5' && sumEdu > 2 && sumEdu <= 5) {
      return 'white'; // 高亮颜色
    } else if (selectedBar === '6-8' && sumEdu > 5 && sumEdu <= 8) {
      return 'white'; // 高亮颜色
    }
    return '#69b3a2'; // 默认颜色
  }

  function initChart() {
    const svg = d3.select('#bubble-svg')
      .attr('viewBox', `0 0 ${size.width} ${size.height}`)
      .attr('preserveAspectRatio', 'xMinYMin meet');

    const xScale = d3.scaleLinear()
      .domain([d3.min(data, (d) => d.Medu) - 0.5, d3.max(data, (d) => d.Medu) + 0.5])
      .range([margin.left, size.width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([d3.min(data, (d) => d.Fedu) - 0.5, d3.max(data, (d) => d.Fedu) + 0.5])
      .range([size.height - margin.bottom, margin.top]);

    const rScale = d3.scaleSqrt()
      .domain([d3.min(data, (d) => d.avgG3), d3.max(data, (d) => d.avgG3)])
      .range([5, 20]);

    svg.append('g')
      .attr('transform', `translate(0, ${size.height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5));

    svg.append('text')
      .attr('x', size.width / 2)
      .attr('y', size.height - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .text('Mother Education Level');

    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale).ticks(5));

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(size.height / 2))
      .attr('y', 120)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .text('Father Education Level');

    const tooltip = d3.select(bubbleRef.current)
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'white')
      .style('border', '1px solid #ccc')
      .style('padding', '5px')
      .style('border-radius', '5px')
      .style('pointer-events', 'none');

    svg.selectAll('.bubble')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'bubble')
      .attr('cx', (d) => xScale(d.Medu))
      .attr('cy', (d) => yScale(d.Fedu))
      .attr('r', (d) => rScale(d.avgG3))
      .attr('fill', (d) => getFillColor(d))
      .attr('opacity', 0.7)
      
      .on('mouseover', function (event, d) {
        d3.select(this)
          .attr('fill', 'orange') // 鼠标悬停时改变颜色
          .attr('opacity', 1);

        // 显示 tooltip
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`Avg Final Grade: ${d.avgG3.toFixed(2)}`)
          .style('left', (event.pageX + 5) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function (event, d) {
        d3.select(this)
          .attr('fill', getFillColor(d)) // 使用最新的高亮逻辑恢复颜色
          .attr('opacity', 0.7);

        // 隐藏 tooltip
        tooltip.transition().duration(500).style('opacity', 0);
      });

    const filteredData = data.filter((d) => {
      const sumEdu = d.Medu + d.Fedu;
      if (selectedBar === '0-2') return sumEdu <= 2;
      if (selectedBar === '3-5') return sumEdu > 2 && sumEdu <= 5;
      if (selectedBar === '6-8') return sumEdu > 5 && sumEdu <= 8;
      return false;
    });

    if (filteredData.length === 0) return;

    const avgMedu = d3.mean(filteredData, (d) => d.Medu) || 0;
    const avgFedu = d3.mean(filteredData, (d) => d.Fedu) || 0;
    const avgG3 = d3.mean(filteredData, (d) => d.avgG3) || 0;

    // 创建高亮圆并直接在目标位置生成
    svg.append('circle')
      .attr('class', 'bubble highlight')
      .attr('cx', xScale(avgMedu))
      .attr('cy', yScale(avgFedu))
      .attr('r', 0)  // 初始半径为 0
      .attr('fill', 'orange')
      .attr('opacity', 1)
      .transition()
      .duration(1000)
      .attr('r', rScale(avgG3)); // 过渡到目标半径
    svg.append('text')
      .attr('class', 'highlight-text')
      .attr('x', xScale(avgMedu))
      .attr('y', yScale(avgFedu) - rScale(avgG3) - 10) // 位置在高亮圆上方
      .attr('text-anchor', 'middle')
      .attr('opacity', 0)
      .text(`Avg Final Grade: ${avgG3.toFixed(2)}`)
      .transition()
      .duration(1000)
      .attr('opacity', 1); // 添加透明度动画，使文本逐渐显示
    

  }

  return (
    <>
      <div ref={bubbleRef} style={{ width: '100%', height: '100%' }}>
        <svg id="bubble-svg" width="100%" height="500"></svg>
      </div>
    </>
  );
}
