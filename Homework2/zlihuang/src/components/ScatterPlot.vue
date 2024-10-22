<script lang="ts">
import * as d3 from "d3";
import { isEmpty, debounce } from 'lodash';

export default {
    data() {
        return {
            mergedData: [] as d3.DSVRowString<string>[], // Merged data
            size: { width: 0, height: 0 }, // Container size
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
                this.size = { width: target.clientWidth-30, height: target.clientHeight };
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
                this.initScatterPlot(); // Initialize the scatter plot
            } catch (error) {
                console.error("Error loading or merging data:", error);
            }
        },
        initScatterPlot() {
            let scatterContainer = d3.select("#scatter-svg");

            scatterContainer.selectAll('*').remove();

            let xScale = d3.scaleLinear()
                .domain([0, 5]) 
                .range([this.margin.left, this.size.width - this.margin.right]);

            let yScale = d3.scaleLinear()
                .domain([0, 20]) 
                .range([this.size.height - this.margin.bottom, this.margin.top]);
            
            let dalcColorScale = d3.scaleSequential(d3.interpolatePlasma)
                .domain([1, 4]);

            let walcColorScale = d3.scaleSequential(d3.interpolateCool)
                .domain([1, 4]);

            const jitterAmount = 30; 
            const jitter = (cy: number) : number=> {
                const epsilon = 1e-6;
                // y sacle will not be the int, so need a small threshold value
                if (Math.abs(this.size.height - this.margin.bottom-cy) < epsilon) {
                    return Math.abs((Math.random() - 0.5) * jitterAmount);
                }
                return (Math.random() - 0.5) * jitterAmount;
            };

            const xAxis=scatterContainer.append("g")
                .attr("transform", `translate(0, ${this.size.height - this.margin.bottom})`)
                .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format("d")));

            const yAxis=scatterContainer.append("g")
                .attr("transform", `translate(${this.margin.left}, 0)`)
                .call(d3.axisLeft(yScale));

            const xAxisText=scatterContainer.append("text")
                .attr("x", this.size.width / 2)
                .attr("y", this.size.height - this.margin.bottom / 2)
                .style("text-anchor", "middle")
                .text("Alcohol Consumption (Dalc/Walc)");

            const yAxisText=scatterContainer.append("text")
                .attr("transform", `rotate(-90)`)
                .attr("x", -this.size.height / 2)
                .attr("y", this.margin.left / 2)
                .style("text-anchor", "middle")
                .text("Final Grade (G3)");

            const dalcDot=scatterContainer.selectAll(".dot")
                .data(this.mergedData)
                .enter().append("circle")
                .attr("class", "dot")
                .attr("cx", d => xScale(+d.Dalc)-25 + jitter(xScale(+d.Walc)))
                .attr("cy", d => {
                    const cy = yScale(+d.G3);
                    return cy - jitter(cy); 
                })
                .attr("r", 4) 
                .attr("fill", d => dalcColorScale(+d.studytime)) 
            
            const walcDot=scatterContainer.selectAll(".dalc-dot")
                .data(this.mergedData)
                .enter().append("circle")
                .attr("class", "dalc-dot")
                .attr("cx", d => xScale(+d.Walc) + 25 + jitter(xScale(+d.Walc)))
                .attr("cy", d => {
                    const cy = yScale(+d.G3);
                    return cy - jitter(cy);
                })
                .attr("r", 4)
                .attr("fill", d => walcColorScale(+d.studytime));

            const title=scatterContainer.append("text")
                .attr("x", this.size.width / 2)
                .attr("y", this.size.height - this.margin.top + 5)
                .style("text-anchor", "middle")
                .style("font-weight", "bold")
                .text("Correlation Between Alcohol Consumption and Academic Performance");

            const legendWidth = 100;
            const legendHeight = 20;

            let dalcLegendScale = d3.scaleLinear()
                .domain([1, 4])
                .range([0, legendWidth]);

            let dalcLegendAxis = d3.axisBottom(dalcLegendScale)
                .ticks(4)
                .tickFormat(d3.format("d"));

            let dalcLegend = scatterContainer.append("g")
                .attr("transform", `translate(${this.size.width - this.margin.right - legendWidth/2-30}, ${this.margin.top + 10})`);

            let dalcGradient = scatterContainer.append("defs")
                .append("linearGradient")
                .attr("id", "dalc-gradient")
                .attr("x1", "0%")
                .attr("x2", "100%");

            dalcGradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", d3.interpolatePlasma(0));

            dalcGradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", d3.interpolatePlasma(1));

            dalcLegend.append("rect")
                .attr("width", legendWidth)
                .attr("height", legendHeight)
                .style("fill", "url(#dalc-gradient)");

            dalcLegend.append("g")
                .attr("transform", `translate(0, ${legendHeight})`)
                .call(dalcLegendAxis);

            dalcLegend.append("text")
                .attr("x", legendWidth / 2)
                .attr("y", -7)
                .style("text-anchor", "middle")
                .style('font-size', '12px')
                .text("Dalc Studytime");

            let walcLegendScale = d3.scaleLinear()
                .domain([1, 4])
                .range([0, legendWidth]);

            let walcLegendAxis = d3.axisBottom(walcLegendScale)
                .ticks(4)
                .tickFormat(d3.format("d"));

            let walcLegend = scatterContainer.append("g")
                .attr("transform", `translate(${this.size.width - this.margin.right - legendWidth/2-30}, ${this.margin.top + 60})`);

            let walcGradient = scatterContainer.append("defs")
                .append("linearGradient")
                .attr("id", "walc-gradient")
                .attr("x1", "0%")
                .attr("x2", "100%");

            walcGradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", d3.interpolateCool(0));

            walcGradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", d3.interpolateCool(1));

            walcLegend.append("rect")
                .attr("width", legendWidth)
                .attr("height", legendHeight)
                .style("fill", "url(#walc-gradient)");

            walcLegend.append("g")
                .attr("transform", `translate(0, ${legendHeight})`)
                .call(walcLegendAxis);

            walcLegend.append("text")
                .attr("x", legendWidth / 2)
                .attr("y", -2)
                .style("text-anchor", "middle")
                .style('font-size', '12px')
                .text("Walc Studytime");
        }
    },
    watch: {
        rerender(newSize) {
            if (!isEmpty(newSize)) {
                d3.select('#scatter-svg').selectAll('*').remove(); // Clear previous elements
                this.initScatterPlot(); // Reinitialize
            }
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
