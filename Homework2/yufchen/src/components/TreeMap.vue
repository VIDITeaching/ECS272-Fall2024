<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import * as d3 from 'd3';
import salesData from '../../data/filtered_car_brands.json'; // Adjust the path as needed

export default defineComponent({
    props: {
        msg: String, // This is the props passed down from the parent component
    },
    name: 'TreeMap',
    setup() {
        const treemap = ref<HTMLElement | null>(null);

        onMounted(() => {
            if (treemap.value) {
                const rootData = d3.hierarchy(salesData)
                    .sum(d => d.total_selling_price || 0)
                    .sort((a, b) => b.value - a.value);

                const colorScale = d3.scaleOrdinal()
                    .domain(rootData.children.map(d => d.data.name))
                    .range(['#1f77b4', '#2ca02c', '#d62728', '#e377c2', '#9467bd',  '#8c564b', '#7f7f7f', '#ff7f0e',]);

                const width = 100;  // More standard width for visualization
                const height = 700; // More standard height for visualization
                const format = d3.format(",d");
                const treemapLayout = d3.treemap()
                    .size([width, height])
                    .paddingInner(1)
                    .round(true)
                    .tile(d3.treemapSlice);

                treemapLayout(rootData);

                const svg = d3.select(treemap.value)
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .style("font", "10px sans-serif");

                const leaf = svg.selectAll("g")
                    .data(rootData.leaves())
                    .join("g")
                    .attr("transform", d => `translate(${d.x0},${d.y0})`);

                leaf.append("title")
                    .text(d => `${d.data.name}: ${format(d.value)}`);

                leaf.append("rect")
                    .attr("fill", d => colorScale(d.parent.data.name))
                    .attr("width", d => d.x1 - d.x0)
                    .attr("height", d => d.y1 - d.y0);

                leaf.append("text")
                    .attr("x", 3)
                    .attr("y", 13)
                    .each(function(d) {
                        if (d.value / rootData.value > 0.04) {  // Adjust as needed to manage text visibility
                            const text = d3.select(this);
                            text.append("tspan")
                                .attr("x", 3)
                                .text(d.data.name);
                            text.append("tspan")
                                .attr("x", 3)
                                .attr("dy", "1.2em")
                                .text("$" + format(d.data.total_selling_price));
                        }else if (d.value / rootData.value > 0.021) {  // Adjust as needed to manage text visibility
                            const text = d3.select(this);
                            text.append("tspan")
                                .attr("x", 3)
                                .text(d.data.name);
                        }
                    })
                    .attr("fill", "#fff");
            }
        });

        return {
            treemap
        };
    }
});
</script>

<template>
    <div class="chart-container" ref="treemap"><h3>{{ msg }}</h3></div>
</template>

<style>
</style>
