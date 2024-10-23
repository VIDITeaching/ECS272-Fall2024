<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import * as d3 from 'd3';
import usStates from '../../data/us-states.json';
import salesData from '../../data/highestmake.json';

export default defineComponent({
    props: {
        msg: String, // This is the props passed down from the parent component
    },
    name: 'USMap',
    setup() {
        const mapContainer = ref<HTMLElement | null>(null);

        onMounted(() => {
        const svg = d3.select(mapContainer.value)
            .append('svg')
            .attr('width', 800)
            .attr('height', 500);

        // Create a projection
        const projection = d3.geoAlbersUsa()
            .translate([400, 250]) // Center the map
            .scale(1000); // Scale to fit the container

        // Create a path generator
        const path = d3.geoPath()
            .projection(projection);

        const makeColors = {
            'Ford': '#1f77b4',
            'BMW': '#ff7f0e',
            'Chevrolet': '#2ca02c',
            'Mercedes-Benz': '#3a4566',
            'Dodge': '#9467bd',
            'Honda': '#8c564b',
            'Toyota': '#e377c2',
            'Hyundai': '#7f7f7f'
        };

        // Draw the states
        svg.selectAll('path')
            .data(usStates.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', d => { 
                const stateInfo = salesData.data.find(sd => sd.state === d.properties.name);
                if(stateInfo !== undefined) {
                    console.log(makeColors[stateInfo.highestmake]);
                    return makeColors[stateInfo.highestmake];
                }else{
                    return 'white';
                }
            })
            .attr('stroke', 'black') // Black stroke
            .attr('stroke-width', 1); // Stroke width

        // Redraw the borders without fill
        svg.selectAll('.state-border')
            .data(usStates.features)
            .enter()
            .append('path')
            .attr('class', 'state-border')
            .attr('d', path)
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-width', 1);

        // Draw the states with no fill and a black stroke
        // svg.selectAll('path')
        //   .data(usStates.features)
        //   .enter()
        //   .append('path')
        //   .attr('d', path)
        //   .attr('fill', 'none') // No fill color
        //   .attr('stroke', 'black') // Black stroke
        //   .attr('stroke-width', 1); // Stroke width

        // Add text labels
        svg.selectAll('text')
            .data(usStates.features)
            .enter()
            .append('text')
            .attr('x', d => path.centroid(d)[0] || 0)
            .attr('y', d => path.centroid(d)[1] || 0)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .text(d => {
                const stateInfo = salesData.data.find(sd => sd.state === d.properties.name);
                if(stateInfo !== undefined) {
                    //return `${stateInfo.highestmake} ${stateInfo.maketotalselling}`;
                    return `${stateInfo.highestmake}`;
                }else{
                    return '';
                }
            });
        });

        return {
            mapContainer
        };
    },
});
</script>

<template>
    <div class="mapcontainer" ref="mapContainer"><h3 class=".mapcontainer">{{ msg }}</h3></div>
</template>

<style scoped>
</style>