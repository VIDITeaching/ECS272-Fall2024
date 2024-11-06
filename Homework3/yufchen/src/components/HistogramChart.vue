<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import * as d3 from 'd3';
import salesData from '../../data/Seller.json'; // Ensure the path matches your project structure

export default defineComponent({
    props: {
        msg: String, // This is the props passed down from the parent component
    },
    name: 'HistogramChart',
    setup() {
        const chartRef = ref(null);
        onMounted(() => {
        const sellers = Object.entries(salesData);
        const container = d3.select(chartRef.value);

        // Setting up the dimensions and margins for the svg
        const margin = {top: 10, right: 0, bottom: 20, left: 140};
        const width = 800 - margin.left - margin.right;
        const height = 180 - margin.top - margin.bottom;

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform',
                    'translate(' + margin.left + ',' + margin.top + ')');

        // Define specific colors for car makes
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

        // Extracting all makes
        const makes = [...new Set(sellers.flatMap(([, makes]) => Object.keys(makes)))];

        // Transforming the data for easy bar plotting
        const formattedData = sellers.map(([seller, makes], i) => {
            let cumulative = 0;
            const makesData = Object.entries(makes).map(([make, { sellingprice }]) => {
            const data = { seller, make, sellingprice, start: cumulative, end: cumulative += sellingprice };
            return data;
            });
            return { seller, makesData, total: cumulative };
        });

        // X axis: scale and draw
        const x = d3.scaleLinear()
                    .domain([0, d3.max(formattedData, d => d.total)])
                    .range([0, width]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickSizeOuter(0));

        // Y axis: scale and draw
        const y = d3.scaleBand()
                    .range([0, height])
                    .domain(formattedData.map(d => d.seller))
                    .padding(0.1);
        svg.append("g")
            .call(d3.axisLeft(y));

        // Bars
        svg.append("g")
            .selectAll("g")
            .data(formattedData)
            .join("g")
            .attr("transform", d => `translate(0,${y(d.seller)})`)
            .selectAll("rect")
            .data(d => d.makesData)
            .join("rect")
            .attr("x", d => x(d.start))
            .attr("y", d => 0)
            .attr("width", d => x(d.end) - x(d.start))
            .attr("height", y.bandwidth())
            .attr("fill", d => colorScale[d.make] || '#dddddd');
    });

    return {chartRef};
}
});
</script>

<template>
    <div class="chart-container" ref="chartRef">
        <h3>{{ msg }}</h3>
    </div>
</template>

<style scoped>
</style>