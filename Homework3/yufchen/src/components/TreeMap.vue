<script lang="ts">
import { defineComponent, onMounted, ref, watchEffect} from 'vue';
import { useGlobalStore } from '../stores/store';
import * as d3 from 'd3';

export default defineComponent({
    props: {
        msg: String, // This is the props passed down from the parent component
    },
    name: 'TreeMap',
    setup() {
        const globalStore = useGlobalStore();
        const treemap = ref<HTMLElement | null>(null);
        const salesData = ref(null);

        const stateAbbreviations = {
            'Alabama': 'al',
            'Alaska': 'ak',
            'Arizona': 'az',
            'Arkansas': 'ar',
            'California': 'ca',
            'Colorado': 'co',
            'Connecticut': 'ct',
            'Delaware': 'de',
            'Florida': 'fl',
            'Georgia': 'ga',
            'Hawaii': 'hi',
            'Idaho': 'id',
            'Illinois': 'il',
            'Indiana': 'in',
            'Iowa': 'ia',
            'Kansas': 'ks',
            'Kentucky': 'ky',
            'Louisiana': 'la',
            'Maine': 'me',
            'Maryland': 'md',
            'Massachusetts': 'ma',
            'Michigan': 'mi',
            'Minnesota': 'mn',
            'Mississippi': 'ms',
            'Missouri': 'mo',
            'Montana': 'mt',
            'Nebraska': 'ne',
            'Nevada': 'nv',
            'New Hampshire': 'nh',
            'New Jersey': 'nj',
            'New Mexico': 'nm',
            'New York': 'ny',
            'North Carolina': 'nc',
            'North Dakota': 'nd',
            'Ohio': 'oh',
            'Oklahoma': 'ok',
            'Oregon': 'or',
            'Pennsylvania': 'pa',
            'Rhode Island': 'ri',
            'South Carolina': 'sc',
            'South Dakota': 'sd',
            'Tennessee': 'tn',
            'Texas': 'tx',
            'Utah': 'ut',
            'Vermont': 'vt',
            'Virginia': 'va',
            'Washington': 'wa',
            'West Virginia': 'wv',
            'Wisconsin': 'wi',
            'Wyoming': 'wy',
            'Overall': 'Overall'
        };

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

        async function loadData() {
            const tempState = stateAbbreviations[globalStore.chosenState];
            //console.log(tempState);
            const response = await fetch(`../../data/TreeMap/${tempState}_filtered_car_brands.json`);
            salesData.value = await response.json();
            //console.log(salesData.value);
            renderTreeMap();
        }

        watchEffect(() => {
            loadData();
        });

        onMounted(() => {
            loadData();  // Ensure data is loaded when the component mounts
        });

        // Function to render the TreeMap
        function renderTreeMap() {
            if (treemap.value && salesData.value) {
                // Remove any existing svg to prevent residual elements
                d3.select(treemap.value).selectAll("svg").remove();

                const rootData = d3.hierarchy(salesData.value)
                    .sum(d => d.total_selling_price || 0)
                    .sort((a, b) => b.value - a.value);

                const width = 250; // Adjusted width for better visualization
                const height = 700; // Standard height for visualization
                const format = d3.format(",d");
                const treemapLayout = d3.treemap()
                    .size([width, height])
                    .paddingInner(1)
                    .round(true)
                    .tile(d3.treemapResquarify);

                treemapLayout(rootData);

                // Create the svg element afresh each time data changes
                const svg = d3.select(treemap.value)
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .style("font", "10px sans-serif");

                const leaf = svg.selectAll("g")
                    .data(rootData.leaves())
                    .join("g")
                    .attr("transform", d => `translate(${d.x0},${d.y0})`);

                const tooltip = d3.select('#tooltip');

                leaf.append("title")
                    .text(d => `${d.parent.data.name}: ${d.data.name}\nTotal Selling Price: $${format(d.value)}`);

                leaf.append("rect")
                    .attr("fill", d => colorScale[d.parent.data.name] || "#ccc")
                    .attr("width", d => d.x1 - d.x0)
                    .attr("height", d => d.y1 - d.y0);

                // Conditional text appending based on block size
                leaf.append("text")
                    .attr("x", 3)
                    .attr("y", 13)
                    .filter(d => (d.x1 - d.x0) > 40 && (d.y1 - d.y0) > 14) // Only append text if block width > 50px and height > 20px
                    .text(d => `${d.data.name}`)
                    .attr("fill", "#fff");

                leaf.on('mouseover', (event, d) => {
                    tooltip.style('visibility', 'visible').html(`${d.parent.data.name}: ${d.data.name}<br>Total Selling Price: $${format(d.value)}`).style('top', `${event.pageY + 10}px`).style('left', `${event.pageX + 10}px`);
                    }).on('mousemove', (event) => {
                        tooltip.style('top', `${event.pageY + 10}px`).style('left', `${event.pageX + 10}px`);
                    }).on('mouseout', () => {
                        tooltip.style('visibility', 'hidden');
                    });
            }
        }

        return {
            treemap
        };
    }
});
</script>

<template>
    <div class="chart-container" ref="treemap">
        <h3>{{ msg }}</h3>
        <div id="tooltip" style="position: absolute; visibility: hidden; padding: 10px; background: rgba(0, 0, 0, 0.6); color: white; border-radius: 4px; pointer-events: none; z-index: 10;"></div>
    </div>
</template>

<style>
</style>
