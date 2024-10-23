import React, { useState, useEffect } from 'react';
import { parseCSV, processAlcoholData, calculateAlcoholStats, processAlcoholHistogramData, processParallelPlotData, processLifestyleData } from '../utils/dataProcessing';
import { Student } from '../types';
import * as d3 from 'd3';
import { 
    Grid, 
    Paper, 
    Box, 
    Typography,
    Divider,
  } from '@mui/material';

const AlcoholConsumptionDashboard = () => {
    const [mathData, setMathData] = useState([]);
    const [porData, setPorData] = useState([]);
    const [parallelData, setParallelData] = useState([]);
    
    // const [lifestyleData, setLifestyleData] = useState([]);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      const loadData = async () => {
        try {
          const [mathResponse, porResponse] = await Promise.all([
            fetch('/data/student-mat.csv'),
            fetch('/data/student-por.csv')
          ]);
  
          if (!mathResponse.ok || !porResponse.ok) {
            throw new Error('Failed to fetch CSV files');
          }
  
          const mathText = await mathResponse.text();
          const porText = await porResponse.text();
  
          console.log('Math CSV:', mathText.slice(0, 100)); // Log first 100 characters
          console.log('Por CSV:', porText.slice(0, 100)); // Log first 100 characters
  
          const parsedMathData = d3.csvParse(mathText);
          const parsedPorData = d3.csvParse(porText);
  
          console.log('Parsed Math Data:', parsedMathData.slice(0, 5));
          console.log('Parsed Por Data:', parsedPorData.slice(0, 5));
  
          setMathData(parsedMathData);
          setPorData(parsedPorData);
  
          // Move processParallelPlotData here to ensure both datasets are available
          const processedParallelData = processParallelPlotData(parsedMathData, parsedPorData);
          setParallelData(processedParallelData);

        //   const processedLifestyleData = processLifestyleData(parsedMathData, parsedPorData);
        //   setLifestyleData(processedLifestyleData)
        } catch (err) {
          console.error('Error loading CSV:', err);
          setError(err.message);
        }
      };
  
      loadData();
    }, []);
  
    useEffect(() => {
      if (mathData.length > 0 && porData.length > 0 && parallelData.length > 0) {
        try {
          createHistograms();
          createBoxPlots();
          createParallelPlot(parallelData, '#parallel-plot');
        //   createLifestyleParallelPlot(lifestyleData, '#lifestyle-plot');
        } catch (err) {
          console.error('Error creating visualizations:', err);
          setError(err.message);
        }
      }
    }, [mathData, porData, parallelData]);

const createParallelPlot = (data: any[], svgElement: SVGSVGElement) => {
    const margin = { top: 50, right: 150, bottom: 50, left: 70 };
    const width = 1000 - margin.left - margin.right + 130;
    const height = 500 - margin.top - margin.bottom;
  
    d3.select(svgElement).selectAll("*").remove();
  
    const svg = d3.select(svgElement)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    const dimensions = ['Dalc', 'Walc', 'G1_math', 'G2_math', 'G3_math', 'G1_por', 'G2_por', 'G3_por'];
  
    const y = {};
    dimensions.forEach(dim => {
      if (dim === 'Dalc' || dim === 'Walc') {
        y[dim] = d3.scaleLinear().domain([1, 5]).range([height, 0]);
      } else {
        y[dim] = d3.scaleLinear().domain([0, 20]).range([height, 0]);
      }
    });
  
    const x = d3.scalePoint()
      .range([0, width])
      .domain(dimensions);
  
    const line = d3.line()
      .defined(d => !isNaN(d[1]))
      .x((d, i) => x(dimensions[i]))
      .y(d => y[d[0]](d[1]));
  
    // Use a color scale with more variation
    const colorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain([1, 5]);  // Walc range
  
    // Draw the lines with varying opacity
    svg.selectAll('path')
      .data(data)
      .enter().append('path')
      .attr('d', d => line(dimensions.map(dim => [dim, +d[dim]])))
      .style('fill', 'none')
      .style('stroke', d => colorScale(d.Walc))
      .style('opacity', 0.3);
  
    // Add axes
    dimensions.forEach(dim => {
      const axis = svg.append('g')
        .attr('transform', `translate(${x(dim)},0)`)
        .call(d3.axisLeft(y[dim]).ticks(5));
      
      axis.append('text')
        .style('text-anchor', 'middle')
        .attr('y', -9)
        .attr('x', 0)
        .text(dim)
        .style('fill', 'black')
        .style('font-weight', 'bold');
    });
  
  
    // Add x-axis label
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Attributes');
  
    // Add y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Values');
  
    // Add legend
    const legendWidth = 100;
    const legendHeight = 200;
    const legendMargin = { top: 20, right: 40, bottom: 20, left: 20 };
  
    const legend = svg.append('g')
      .attr('transform', `translate(${width + margin.right - legendWidth}, ${margin.top})`);
  
    legend.append('rect')
      .attr('width', legendWidth -5)
      .attr('height', legendHeight)
      .style('fill', 'white')
      .style('stroke', 'black');
  
    const legendScale = d3.scaleLinear()
      .domain([1, 5])
      .range([legendHeight - legendMargin.bottom, legendMargin.top]);
  
    const legendAxis = d3.axisRight(legendScale)
      .ticks(5)
      .tickFormat(d3.format('d'));
  
    legend.append('g')
      .attr('transform', `translate(${legendWidth - legendMargin.right}, 0)`)
      .call(legendAxis);
  
    const legendGradient = legend.append('defs')
      .append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');
  
    legendGradient.selectAll('stop')
      .data(d3.range(1, 6))
      .enter().append('stop')
      .attr('offset', (d, i) => `${i * 25}%`)
      .attr('stop-color', d => colorScale(d));
  
    legend.append('rect')
      .attr('width', legendMargin.left)
      .attr('height', legendHeight - legendMargin.top - legendMargin.bottom)
      .attr('x', legendWidth - legendMargin.right - legendMargin.left)
      .attr('y', legendMargin.top)
      .style('fill', 'url(#legend-gradient)');
  
    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .text('Weekend Alcohol');
  
    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .text('Consumption');
  };

const createHistograms = () => {
    const alcoholTypes = ['Dalc', 'Walc'];
    const colors = {
      Mathematics: '#244f76',
      Portuguese: '#ca62eaca'
    };
  
    alcoholTypes.forEach(alcoholType => {
      const svg = d3.select(`#${alcoholType.toLowerCase()}-histogram`)
        .attr('width', 500)
        .attr('height', 300);
  
      svg.selectAll("*").remove();
  
      const margin = { top: 30, right: 50, bottom: 50, left: 60 };
      const width = +svg.attr('width') - margin.left - margin.right;
      const height = +svg.attr('height') - margin.top - margin.bottom;
  
      const x = d3.scaleLinear()
        .domain([0, 5])
        .range([0, width]);
  
      // Create histogram bins for both subjects
      const mathBins = d3.histogram()
        .domain(x.domain())
        .thresholds(x.ticks(5))
        (mathData.map(d => +d[alcoholType]));
  
      const porBins = d3.histogram()
        .domain(x.domain())
        .thresholds(x.ticks(5))
        (porData.map(d => +d[alcoholType]));
  
      const y = d3.scaleLinear()
        .domain([0, d3.max([...mathBins, ...porBins], d => d.length)])
        .range([height, 0]);
  
      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
  
      // Add axes
      g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5))
        .append('text')
        .attr('x', width / 2)
        .attr('y', 35)
        .attr('fill', 'black')
        .style('text-anchor', 'middle')
        .text(alcoholType === 'Dalc' ? 'Workday Alcohol Consumption' : 'Weekend Alcohol Consumption');
  
      g.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y).ticks(5))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -45)
        .attr('x', -height / 2)
        .attr('fill', 'black')
        .style('text-anchor', 'middle')
        .text('Frequency');
  
      // Add Portuguese bars (back layer)
      g.selectAll('.por-bar')
        .data(porBins)
        .enter().append('rect')
        .attr('class', 'por-bar')
        .attr('x', d => x(d.x0) + 1)
        .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr('y', d => y(d.length))
        .attr('height', d => height - y(d.length))
        .style('fill', colors.Portuguese)
        .style('opacity', 0.6);
  
      // Add Math bars (front layer)
      g.selectAll('.math-bar')
        .data(mathBins)
        .enter().append('rect')
        .attr('class', 'math-bar')
        .attr('x', d => x(d.x0) + 1)
        .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr('y', d => y(d.length))
        .attr('height', d => height - y(d.length))
        .style('fill', colors.Mathematics)
        .style('opacity', 0.6);
  
      // Add legend
      const legend = g.append('g')
        .attr('transform', `translate(${width - 150}, 10)`);
  
      ['Mathematics', 'Portuguese'].forEach((subject, i) => {
        legend.append('rect')
          .attr('x', 0)
          .attr('y', i * 20)
          .attr('width', 15)
          .attr('height', 15)
          .style('fill', colors[subject])
          .style('opacity', 0.6);
  
        legend.append('text')
          .attr('x', 20)
          .attr('y', i * 20 + 12)
          .text(subject)
          .style('font-size', '12px');
      });
    });
  };
  
  const createBoxPlots = () => {
    const alcoholTypes = ['Dalc', 'Walc'];
    const colors = {
      Mathematics: '#244f76',
      Portuguese: '#ca62eaca'
    };
  
    const svg = d3.select('#combined-boxplot')
      .attr('width', 500)
      .attr('height', 300);
  
    svg.selectAll("*").remove();
  
    const margin = { top: 30, right: 50, bottom: 50, left: 60 };
    const width = +svg.attr('width') - margin.left - margin.right;
    const height = +svg.attr('height') - margin.top - margin.bottom;
  
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    const y = d3.scaleLinear()
      .domain([0, 5])
      .range([height, 0]);
  
    const x = d3.scaleBand()
      .range([0, width])
      .domain(alcoholTypes)
      .padding(0.4);
  
    // Add axes
    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y).ticks(5))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -height / 2)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Alcohol Consumption Level');
  
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Alcohol Consumption Type');
  
    const drawBoxPlot = (data, alcoholType, offset, color) => {
      const alcoholData = data.map(d => +d[alcoholType]).sort(d3.ascending);
      const q1 = d3.quantile(alcoholData, 0.25);
      const median = d3.quantile(alcoholData, 0.5);
      const q3 = d3.quantile(alcoholData, 0.75);
      const iqr = q3 - q1;
      const min = Math.max(0, q1 - 1.5 * iqr);
      const max = Math.min(5, q3 + 1.5 * iqr);
  
      g.append('rect')
        .attr('x', x(alcoholType) + offset)
        .attr('y', y(q3))
        .attr('height', y(q1) - y(q3))
        .attr('width', x.bandwidth() / 2)
        .attr('stroke', 'black')
        .attr('fill', color)
        .style('opacity', 0.6);
  
      // Add median line
      g.append('line')
        .attr('x1', x(alcoholType) + offset)
        .attr('x2', x(alcoholType) + offset + x.bandwidth() / 2)
        .attr('y1', y(median))
        .attr('y2', y(median))
        .attr('stroke', 'black');
  
      // Add whiskers
      g.append('line')
        .attr('x1', x(alcoholType) + offset + x.bandwidth() / 4)
        .attr('x2', x(alcoholType) + offset + x.bandwidth() / 4)
        .attr('y1', y(min))
        .attr('y2', y(q1))
        .attr('stroke', 'black');
  
      g.append('line')
        .attr('x1', x(alcoholType) + offset + x.bandwidth() / 4)
        .attr('x2', x(alcoholType) + offset + x.bandwidth() / 4)
        .attr('y1', y(max))
        .attr('y2', y(q3))
        .attr('stroke', 'black');
  
      // Add caps
      g.append('line')
        .attr('x1', x(alcoholType) + offset)
        .attr('x2', x(alcoholType) + offset + x.bandwidth() / 2)
        .attr('y1', y(min))
        .attr('y2', y(min))
        .attr('stroke', 'black');
  
      g.append('line')
        .attr('x1', x(alcoholType) + offset)
        .attr('x2', x(alcoholType) + offset + x.bandwidth() / 2)
        .attr('y1', y(max))
        .attr('y2', y(max))
        .attr('stroke', 'black');
    };
  
    // Draw overlapping box plots
    alcoholTypes.forEach(alcoholType => {
      drawBoxPlot(mathData, alcoholType, 0, colors.Mathematics);
      drawBoxPlot(porData, alcoholType, x.bandwidth() / 2, colors.Portuguese);
    });
  
    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${width - 50}, 10)`);
  
    ['Mathematics', 'Portuguese'].forEach((subject, i) => {
      legend.append('rect')
        .attr('x', 0)
        .attr('y', i * 20)
        .attr('width', 15)
        .attr('height', 15)
        .style('fill', colors[subject])
        .style('opacity', 0.6);
  
      legend.append('text')
        .attr('x', 20)
        .attr('y', i * 20 + 12)
        .text(subject)
        .style('font-size', '12px');
    });
  };

  return (
    <Box className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <Paper className="mb-6 bg-gradient-to-r from-indigo-900 to-indigo-700">
        <Box className="px-8 py-6 text-center">
          <Typography variant="h3" className="text-white font-bold mb-2" align="center">
            Alcohol Consumption Analysis
          </Typography>
        </Box>
      </Paper>

      {/* Stats Overview */}
      <Grid container spacing={3} className="mb-6" sx={{ pl: 10, pt: 5 }}>
        {/* Histograms */}
                <Grid item xs={12} md={6}>  {/* Additional left padding if needed */}
            <Typography variant="subtitle1" className="mb-2 font-semibold" align="center">
            Workday Consumption
            </Typography>
            <Box className="bg-white rounded-lg border border-gray-200">
            <svg id="dalc-histogram" className="w-full h-[300px]" />
            </Box>
        </Grid>
        <Grid item xs={12} md={6} sx={{ pl: 2 }}>
            <Typography variant="subtitle1" className="mb-2 font-semibold" align="center">
            Weekend Consumption
            </Typography>
            <Box className="bg-white rounded-lg border border-gray-200">
            <svg id="walc-histogram" className="w-full h-[300px]" />
            </Box>
        </Grid>

        <Grid item xs={12} md={3}>
        </Grid>

        <Grid item xs={12} md={5.5}>
          {/* <Paper className="p-6"> */}
            <Box className="flex items-center">
              {/* Box Plot */}
            <Box>
              <Typography variant="subtitle1" className="mb-2 font-semibold" align="center">
                Combined Box Plot: Alcohol Consumption Distribution
              </Typography>
              <Box className="bg-white rounded-lg border border-gray-200">
                <svg id="combined-boxplot" className="w-full h-[300px]" />
              </Box>
            </Box>
            </Box>
          {/* </Paper> */}
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>

        {/* Alcohol Consumption Analysis */}
        <Grid item xs={12}>
          <Paper className="p-6">
            <Typography variant="h6" className="mb-3 font-bold" align="center">
            Parallel Coordinates Plot: Alcohol Consumption vs Grades
            </Typography>
            {/* Parallel Coordinates Plot */}
            <Box className="mb-8">
              <Box className="bg-white rounded-lg border border-gray-200">
                <svg id="parallel-plot" className="w-full h-[400px]" />
              </Box>
            </Box>
            {/* Key Insights Section */}
  <Grid container spacing={3} className="mt-4">
    {/* Academic Performance Patterns */}
    <Grid item xs={12} md={6}>
      <Paper elevation={0} className="p-4 bg-gray-50">
        <Typography variant="h6" className="text-lg font-semibold mb-2 text-indigo-800">
          Academic Performance Patterns
        </Typography>
        <Box component="ul" className="list-disc pl-4">
          <Box component="li" className="text-gray-700 mb-2 text-sm">
            Students with lower alcohol consumption (darker purple lines) tend to maintain more consistent and higher grades across both subjects
          </Box>
          <Box component="li" className="text-gray-700 mb-2 text-sm">
            There's a noticeable negative correlation between high alcohol consumption (yellow lines) and academic performance
          </Box>
          <Box component="li" className="text-gray-700 mb-2 text-sm">
            The grades appear to be more volatile (showing more crossing lines) for students with higher alcohol consumption
          </Box>
        </Box>
      </Paper>
    </Grid>

    {/* Subject-Specific Observations */}
    <Grid item xs={12} md={6}>
      <Paper elevation={0} className="p-4 bg-gray-50">
        <Typography variant="h6" className="text-lg font-semibold mb-2 text-indigo-800">
          Subject-Specific Observations
        </Typography>
        <Box component="ul" className="list-disc pl-4">
          <Box component="li" className="text-gray-700 mb-2 text-sm">
            The pattern seems similar for both Math and Portuguese grades
          </Box>
          <Box component="li" className="text-gray-700 mb-2 text-sm">
            Grade progression (G1 to G3) shows some variation, but students generally maintain similar performance levels throughout the periods
          </Box>
        </Box>
      </Paper>
    </Grid>
  </Grid>

  {/* Quick Legend/Note */}
  <Paper elevation={0} className="p-3 mt-5 bg-blue-50">
    <Typography variant="body2" className="text-blue-800 text-sm">
      <span className="font-semibold">Note:</span> Line colors indicate weekend alcohol consumption levels - 
      darker purple represents lower consumption, while yellow represents higher consumption.
    </Typography>
  </Paper>
          </Paper>

        </Grid>
      </Grid>
    </Box>
  );
};

export default AlcoholConsumptionDashboard;