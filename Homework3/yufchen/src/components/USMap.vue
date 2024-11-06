<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { useGlobalStore } from '../stores/store';
import * as d3 from 'd3';
import usStates from '../../data/us-states.json';
import salesData from '../../data/highestmake.json';


export default defineComponent({
    props: {
        msg: String, // This is the props passed down from the parent component
    },
    name: 'USMap',
    setup() {
        const globalStore = useGlobalStore();
        const mapContainer = ref<HTMLElement | null>(null);

        const noDataStates = ref<string[]>(["Idaho", "Montana", "Wyoming", "North Dakota", "South Dakota", "Kansas", "Iowa", "Kentucky", "Arkansas", "Vermont", "New Hampshire", "Maine", "Connecticut", "Alaska", "Delaware"]);

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
            'Wyoming': 'wy'
        };

        

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

        function handleClick(event, d) {
            if (!noDataStates.value.includes(d.properties.name)) {
                const stateName = d.properties.name;
                globalStore.setGlobalVar(stateName); // Update the global state
            }
        }

        const tooltip = d3.select('#tooltipMap');

        const format = d3.format(",d");

        // Draw the states
        svg.selectAll('path')
            .data(usStates.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', d => { 
                const stateInfo = salesData.data.find(sd => sd.state === d.properties.name);
                if(stateInfo !== undefined) {
                    //console.log(makeColors[stateInfo.highestmake]);
                    return makeColors[stateInfo.highestmake];
                }else{
                    return 'white';
                }
            })
            .attr('stroke', 'black') // Black stroke
            .attr('stroke-width', 1) // Stroke width
            .each(function(d) {
            if (!noDataStates.value.includes(d.properties.name)) {
                d3.select(this)
                    .on('click', handleClick)
                    .on('mouseover', (event, d) => {
                        const stateInfo = salesData.data.find(sd => sd.state === d.properties.name);
                        const name = d.properties.name;
                        const make = stateInfo.highestmake;
                        const makeTotal = stateInfo.maketotalselling;
                        tooltip.style('visibility', 'visible').html(`${name}<br> Top Selling Make: ${make} <br> Total Seling by ${make}: $${format(makeTotal)}`).style('top', `${event.pageY + 10}px`).style('left', `${event.pageX + 10}px`);
                    }).on('mousemove', (event) => {
                        tooltip.style('top', `${event.pageY + 10}px`).style('left', `${event.pageX + 10}px`);
                    }).on('mouseout', () => {
                        tooltip.style('visibility', 'hidden');
                    });
            }
            });

        // Add text labels
        svg.selectAll('text')
            .data(usStates.features)
            .enter()
            .append('text')
            .attr('x', d => path.centroid(d)[0] || 0)
            .attr('y', d => path.centroid(d)[1] || 0)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text(d => {
                return stateAbbreviations[d.properties.name];
            })
            .each(function(d) {
            if (!noDataStates.value.includes(d.properties.name)) {
                d3.select(this)
                    .on('click', handleClick)
                    .on('mouseover', (event, d) => {
                        const stateInfo = salesData.data.find(sd => sd.state === d.properties.name);
                        const name = d.properties.name;
                        const make = stateInfo.highestmake;
                        const makeTotal = stateInfo.maketotalselling;
                        tooltip.style('visibility', 'visible').html(`${name}<br> Top Selling Make: ${make} <br> Total Seling by ${make}: $${format(makeTotal)}`).style('top', `${event.pageY + 10}px`).style('left', `${event.pageX + 10}px`);
                    }).on('mousemove', (event) => {
                        tooltip.style('top', `${event.pageY + 10}px`).style('left', `${event.pageX + 10}px`);
                    }).on('mouseout', () => {
                        tooltip.style('visibility', 'hidden');
                    });
            }
            });
        });

        return {
            mapContainer,
            globalStore,
            noDataStates
        };
    },
});
</script>

<template>
    <div class="mapcontainer" ref="mapContainer">
        <h3 class=".mapcontainer">{{ msg }}</h3>
        <div id="tooltipMap" style="position: absolute; visibility: hidden; padding: 10px; background: rgba(0, 0, 0, 0.6); color: white; border-radius: 4px; pointer-events: none; z-index: 10;"></div>
    </div>
</template>

<style scoped>
</style>