<script lang="ts">
import * as d3 from "d3";
import { isEmpty, debounce } from 'lodash';

export default {
    props: {
        filteredData: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            mergedData: [] as d3.DSVRowString<string>[],
            aggregatedDalcData: [] as { Dalc: number; G3: number; count: number }[], 
            aggregatedWalcData: [] as { Walc: number; G3: number; count: number }[], 
            size: { width: 0, height: 0 }, 
            margin: { left: 50, right: 20, top: 20, bottom: 80 },
        };
    },
    created() {
        this.loadAndMergeData();
    },
    methods: {
        onResize() {
            const target = this.$refs.scatterContainer as HTMLElement;
            if (target) {
                this.size = { width: target.clientWidth - 30, height: target.clientHeight };
                d3.select('#scatter-svg').selectAll('*').remove(); 
                this.initScatterPlot(); 
            }
        },
        async loadAndMergeData() {
            try {
                const matData = await d3.csv('data/student-mat.csv');
                const porData = await d3.csv('data/student-por.csv');
                
                const commonKeys = ['school', 'sex', 'age', 'address', 'famsize', 'Pstatus', 'Medu', 'Fedu', 'Mjob', 'Fjob', 'reason', 'guardian'];
                
                const combinedData = matData.map(student => {
                    const correspondingPorStudent = porData.find(porStudent =>
                        commonKeys.every(key => student[key] === porStudent[key])
                    );
                    return correspondingPorStudent ? { ...student, ...correspondingPorStudent } : null;
                });
                this.mergedData = combinedData.filter(student => student !== null);
                this.aggregateData();
                this.initScatterPlot();
            } catch (error) {
                console.error("Error loading or merging data:", error);
            }
        },
        aggregateData() {
            const dalcDataMap = new Map();
            const walcDataMap = new Map();

            this.mergedData.forEach(d => {
                const dalcKey = `${d.Dalc}-${d.G3}`;
                const walcKey = `${d.Walc}-${d.G3}`;

                if (dalcDataMap.has(dalcKey)) {
                    dalcDataMap.get(dalcKey).count += 1;
                } else {
                    dalcDataMap.set(dalcKey, { Dalc: +d.Dalc, G3: +d.G3, count: 1 });
                }

                if (walcDataMap.has(walcKey)) {
                    walcDataMap.get(walcKey).count += 1;
                } else {
                    walcDataMap.set(walcKey, { Walc: +d.Walc, G3: +d.G3, count: 1 });
                }
            });

            this.aggregatedDalcData = Array.from(dalcDataMap.values());
            this.aggregatedWalcData = Array.from(walcDataMap.values());

        },
        initScatterPlot() {
            const svg = d3.select("#scatter-svg");
            const width = this.size.width - this.margin.left - this.margin.right;
            const height = this.size.height - this.margin.top - this.margin.bottom;


            const filteredDalcData = this.filteredData && this.filteredData.type === 'Dalc'
                ? this.aggregatedDalcData.filter(d => d.Dalc === +this.filteredData.level)
                : this.aggregatedDalcData;

            const filteredWalcData = this.filteredData && this.filteredData.type === 'Walc'
                ? this.aggregatedWalcData.filter(d => d.Walc === +this.filteredData.level)
                : this.aggregatedWalcData;

            svg.selectAll("*").remove();


            const g = svg.append("g")
                .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

 
            const xScale = d3.scaleLinear()
                .domain([1, 5]) 
                .range([0, width]);

            const yScale = d3.scaleLinear()
                .domain([0, 20]) 
                .range([height, 0]);
            
            const maxCount = Math.max(
                d3.max(this.aggregatedDalcData, d => d.count) || 1,
                d3.max(this.aggregatedWalcData, d => d.count) || 1
            );
            const radiusScale = d3.scaleSqrt()
                .domain([1, maxCount]) 
                .range([5, 15]); 

            const xAxis = d3.axisBottom(xScale).ticks(5);
            const yAxis = d3.axisLeft(yScale).ticks(10);
            const gap=20;

            g.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(xAxis)
                .append("text")
                .attr("x", width / 2)
                .attr("y", this.margin.bottom - 40)
                .attr("fill", "black")
                .style("font-size", "16px")
                .style('text-anchor', 'middle')
                .text("Alcohol Consumption");

            g.append("g")
                .attr("transform", `translate(-10, 0)`) 
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -this.margin.left + 25)
                .attr("x", -height / 2)
                .attr("fill", "black")
                .style("font-size", "16px")
                .style("text-anchor", "middle")
                .text("Final Grade (G3)");
        
            g.append("g")
                .attr("transform", `translate(0,${height})`)
                .append("text")
                .attr("x", width / 2)
                .attr("y", this.margin.bottom - 20)
                .attr("fill", "black")
                .style("font-size", "16px")
                .style('font-weight', 'bold')
                .style('text-anchor', 'middle')
                .text("Alcohol Consumption vs Final Grades");

            const tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style("visibility", "hidden")
                .style("padding", "8px")
                .style("background", "rgba(0, 0, 0, 0.7)")
                .style("border-radius", "4px")
                .style("color", "white")
                .style("font-size", "12px");

            
            const dalcPoints = g.selectAll(".dalc-point")
                .data(filteredDalcData, (d: any) => d.Dalc);

            dalcPoints.enter()
                .append("circle")
                .attr("class", "dalc-point")
                .attr("cx", d => xScale(+d.Dalc))
                .attr("cy", d => yScale(+d.G3))
                .attr("r", 0) 
                .attr("fill", "blue")
                .attr("opacity", 0)
                .on("mouseover", (event, d) => {
                    tooltip.html(`Dalc (Workday): ${d.Dalc}<br>Final Grade: ${d.G3}<br>Count: ${d.count}`)
                        .style("visibility", "visible");
                })
                .on("mousemove", event => {
                    tooltip.style("top", (event.pageY - 10) + "px")
                        .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", () => tooltip.style("visibility", "hidden"))
                .transition()
                .duration(500)
                .attr("r", d => radiusScale(d.count)) 
                .attr("opacity", 0.7);
                
            dalcPoints.exit()
                .transition()
                .duration(500)
                .attr("r", 0) 
                .attr("opacity", 0)
                .remove();

            const walcPoints = g.selectAll(".walc-point")
                .data(filteredWalcData, (d: any) => d.Walc);

            walcPoints.enter()
                .append("circle")
                .attr("class", "walc-point")
                .attr("cx", d => xScale(+d.Walc)+gap)
                .attr("cy", d => yScale(+d.G3))
                .attr("r", 0) 
                .attr("fill", "orange")
                .attr("opacity", 0)
                .on("mouseover", (event, d) => {
                tooltip.html(`Walc (Weekend): ${d.Walc}<br>Final Grade: ${d.G3}<br>Count: ${d.count}`)
                    .style("visibility", "visible");
                })
                .on("mousemove", event => {
                tooltip.style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", () => tooltip.style("visibility", "hidden"))
                .transition()
                .duration(500)
                .attr("r", d => radiusScale(d.count)) 
                .attr("opacity", 0.7);

            walcPoints.exit()
                .transition()
                .duration(500)
                .attr("r", 0)
                .attr("opacity", 0)
                .remove();

            const legend = svg.append("g")
                .attr("transform", `translate(${width - 50}, ${this.margin.top})`); 

            // Dalc legend entry
            legend.append("circle")
                .attr("cx", 15)
                .attr("cy", -10)
                .attr("r", 5)
                .attr("fill", "blue");
            legend.append("text")
                .attr("x", 25)
                .attr("y", -10)
                .text("Dalc (Workday)")
                .style("alignment-baseline", "middle");

            // Walc legend entry
            legend.append("circle")
                .attr("cx", 15)
                .attr("cy", 10)
                .attr("r", 5)
                .attr("fill", "orange");
            legend.append("text")
                .attr("x", 25)
                .attr("y", 10)
                .text("Walc (Weekend)")
                .style("alignment-baseline", "middle");
        }
    },
    watch: {
        rerender(newSize) {
            if (!isEmpty(newSize)) {
                d3.select('#scatter-svg').selectAll('*').remove();
                this.initScatterPlot(); 
            }
        },
        filteredData(newFilter) {
            d3.select('#scatter-svg').selectAll('*').remove();
            this.initScatterPlot();
        }
    },
    mounted() {
        window.addEventListener('resize', debounce(this.onResize, 100));
        this.onResize();
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.onResize);
    }
}
</script>

<template>
    <div class="chart-container d-flex" ref="scatterContainer">
        <svg id="scatter-svg" width="100%" height="100%"></svg>
    </div>
</template>

<style scoped>
.chart-container {
    height: 100%;
    width: 100%;
}
</style>
