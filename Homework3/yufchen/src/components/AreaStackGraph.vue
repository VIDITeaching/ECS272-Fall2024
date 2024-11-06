<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import * as d3 from 'd3';

// Define the makes you want to display
const MAKES: string[] = ["Ford", "Chevrolet", "Toyota", "BMW", "Nissan", "Dodge", "Honda", "Hyundai"];

export default defineComponent({
  props: {
        msg: String, // This is the props passed down from the parent component
  },
  name: 'SalesStackedAreaChart',
  setup() {
    const chartContainer = ref<HTMLDivElement | null>(null);

    onMounted(async () => {
      if (!chartContainer.value) return;

      // Load and prepare data
      const data = await d3.json('../../data/sales_data_by_dates.json');
      const parsedData = parseData(data, MAKES);
      //const smoothedData = smoothData(parsedData, 7); // Applying a 7-day rolling average
      const accumulatedData = accumulateData(parsedData);
      //console.log(accumulatedData);
      createChart(chartContainer.value, accumulatedData);
    });

    return { chartContainer };
  },
});

function accumulateData(data: any[]) {
  // Initialize an object to store cumulative totals for each make
  const cumulativeTotals: { [key: string]: number } = {};

  return data.map((d) => {
    const date = new Date(d.date);

    // Update cumulative totals for each make in this entry
    const accumulatedValues = d.values.map((entry: { make: string; value: number }) => {
      const make = entry.make;

      // Initialize previous total for each make if it doesn't exist
      if (!(make in cumulativeTotals)) {
        cumulativeTotals[make] = 0;
      }

      // Add the current day's sales to the cumulative total
      cumulativeTotals[make] += entry.value;

      return { make, value: cumulativeTotals[make] };
    });

    return { date, values: accumulatedValues };
  });
}


function smoothData(data: any[], windowSize: number) {
  return data.map((d, i) => {
    const window = data.slice(Math.max(0, i - windowSize + 1), i + 1);
    const smoothedValues = d.values.map((v: any, j: number) => {
      const avg = window.reduce((sum, w) => sum + (w.values[j].value || 0), 0) / window.length;
      return { make: v.make, value: avg };
    });
    return { ...d, values: smoothedValues };
  });
}

// Helper function to process the data
function parseData(data: any[], makes: string[]) {
  return data.map((d: any) => {
    const date = d3.timeParse("%Y-%m-%d")(d.date);;
    const entries = makes.map(make => ({ make, value: d[make] || 0 }));
    return { date, values: entries };
  });
}

// Main function to create the D3 chart
function createChart(container: HTMLDivElement, data: any) {
  const width = 800;
  const height = 100;
  const margin = { top: 30, right: 80, bottom: 20, left: 30 }; // Adjust right margin for y-axis labels on the right

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Define scales
  const x = d3.scaleTime()
    .range([0, width]);

  // Calculate max value with padding
  const maxYValue = d3.max(data, (d: any) => d3.sum(d.values, (v: any) => v.value)) || 0;
  const y = d3.scaleLinear()
    .domain([0, maxYValue * 1.1]) // Add 10% padding above the max value
    .range([height, 0]);

  // Stack layout
  const stack = d3.stack()
    .keys(MAKES)
    .value((d: any, key) => d.values.find((v: any) => v.make === key)?.value || 0);

  const area = d3.area<any>()
    .x(d => x(d.data.date))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));

  const colorScale = {
    'Ford': '#1f77b4',
    'Chevrolet': '#2ca02c',
    'Nissan': '#d62728',
    'Toyota': '#e377c2',
    'Dodge': '#9467bd',
    'Honda': '#8c564b',
    'Hyundai': '#7f7f7f',
    'BMW': '#ff7f0e',
    'Mercedes-Benz': '#3a4566',
    'Infiniti': '#ede139',
    'Kia': '#39e4ed',
    'Lincoln': '#3409e0',
  };

  // Set the initial x-axis domain to skip the first few seconds
  const days = data.map((d: any) => d.date);
  const skipDays = 12; // Number of days to skip at the beginning
  const initialIndex = Math.min(skipDays, days.length - 1);
  x.domain([days[initialIndex], days[Math.min(initialIndex + 10, days.length - 1)]]);

  // Draw layers
  const layers = svg.selectAll('.layer')
    .data(stack(data))
    .join('path')
    .attr('class', 'layer')
    .attr('fill', ({ key }) => colorScale[key] || '#ccc')
    .attr('d', area);

  // Initial x-axis rendering with the limited domain
  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%Y-%m")))
    .selectAll('text')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end');

  // Add y-axis on the right
  svg.append('g')
    .attr('transform', `translate(${width},0)`) // Position y-axis on the right side
    .call(d3.axisRight(y));

  // Y-axis label on the right
  svg.append("text")
    .attr("transform", `translate(${width + 40})`) // Position it to the right side
    .style("text-anchor", "middle")
    .text("$");

  // Start the animation from `initialIndex`
  let currentIndex = initialIndex;
  const interval = setInterval(() => {
    if (currentIndex >= days.length) {
      currentIndex = initialIndex;
      return;
    }

    // Define the date range for the "window" of data to display
    const currentDate = days[currentIndex];
    const endDate = days[Math.min(currentIndex + 10, days.length - 1)]; // Adjust window size here

    // Update x-axis domain with the new range
    x.domain([currentDate, endDate]);

    // Update area paths with the new x-axis domain
    layers.attr('d', area);

    // Transition the x-axis to reflect the new domain
    svg.select('.x-axis')
      .transition()
      .duration(200) // Smooth transition for the x-axis
      .call(d3.axisBottom(x).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat("%Y-%m-%d")));

    currentIndex++;
  }, 300);
}
</script>

<template>
  <h3>{{ msg }}</h3>
  <div ref="chartContainer"></div>
</template>

<style scoped>
.layer {
  opacity: 0.8;
}
</style>
