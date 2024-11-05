<script lang="ts">

import * as d3 from "d3";
import { sankey as d3Sankey, sankeyLinkHorizontal } from "d3-sankey";
import { isEmpty, debounce } from "lodash";
import { ComponentSize, Margin } from "../types";

export default {
  data() {
    return {
      mergedData: [] as d3.DSVRowString<string>[], 
      size: { width: 0, height: 0 } as ComponentSize,
      margin: { left: 50, right: 20, top: 80, bottom: -10 } as Margin,
      nodes: [] as any[], 
      links: [] as any[], 
    };
  },
  props: {
    highlightedNode: {
      type: Object,
      default: null
    }
  },
  created() {
    this.loadAndMergeData();
  },
  methods: {
    onResize() {
      const target = this.$refs.chartContainer as HTMLElement;
      if (target) {
        this.size = { width: target.clientWidth, height: target.clientHeight };
        d3.select('#sankey-svg').selectAll('*').remove(); 
        this.initSankeyChart(); 
      }
    },
    async loadAndMergeData() {
      try {
        const matData = await d3.csv("data/student-mat.csv");
        const porData = await d3.csv("data/student-por.csv");

        const commonKeys = ['school', 'sex', 'age', 'address', 'famsize', 'Pstatus', 'Medu', 'Fedu', 'Mjob', 'Fjob', 'reason', 'nursery','internet'];

        const combinedData = matData.map((student) => {
          const correspondingPorStudent = porData.find((porStudent) =>
            commonKeys.every((key) => student[key] === porStudent[key])
          );
          return correspondingPorStudent
            ? { ...student, ...correspondingPorStudent }
            : null;
        });
        this.mergedData = combinedData.filter((student) => student !== null);
        
        // Aggregate grades to good, mid, bad
        this.mergedData.forEach((d) => {
          d.grade =
            +d.G3 >= 15 ? "good" : +d.G3 >= 10 ? "mid" : "bad";
        });

        this.prepareSankeyData();
        this.initSankeyChart();
      } catch (error) {
        console.error("Error loading or merging data:", error);
      }
    },
    prepareSankeyData() {
      const dimensions = ["Dalc", "Walc", "famrel", "freetime", "goout", "grade"];

      const nodeSet = new Set<string>();
      this.mergedData.forEach((d) => {
        dimensions.forEach((dim) => nodeSet.add(`${dim}_${d[dim]}`));
      });

      const nodes = Array.from(nodeSet).map((name) => ({ name }));
      const nodeIndex = new Map(nodes.map((node, i) => [node.name, i]));

      const links: { source: number; target: number; value: number }[] = [];
      
      dimensions.forEach((dim, idx) => {
        if (idx === dimensions.length - 1) return; 
        const nextDim = dimensions[idx + 1];
        this.mergedData.forEach((d) => {
          const source = `${dim}_${d[dim]}`;
          const target = `${nextDim}_${d[nextDim]}`;
          const sourceIdx = nodeIndex.get(source);
          const targetIdx = nodeIndex.get(target);
          
          if (sourceIdx !== undefined && targetIdx !== undefined) {
            links.push({
              source: sourceIdx,
              target: targetIdx,
              value: 1,
            });
          } else {
            console.warn(`Invalid link: source ${source} -> target ${target}`);
          }
        });
      });

      this.nodes = nodes;
      this.links = links;
      
    },
    initSankeyChart() {
      const sankeyLayout = d3Sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .size([this.size.width - this.margin.left - this.margin.right, this.size.height - this.margin.top - this.margin.bottom]);

      try{
        sankeyLayout({ nodes: this.nodes, links: this.links });
      }
      catch{
        console.log("1")
      }
      const chartContainer = d3.select("#sankey-svg");
      
      chartContainer.selectAll("*").remove();

      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("padding", "6px")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("visibility", "hidden");
      
 
      const self = this;
      const linkSelection =chartContainer
        .append("g")
        .selectAll(".link")
        .data(this.links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", sankeyLinkHorizontal())
        .style("stroke-width", (d) => Math.max(1, d.width))
        .style("fill", "none")
        .style("stroke-opacity", 0.4)
        .style("stroke", "#888")
        .on("mouseover", function (event, d) {
          const sourceNode = d.source.name;
          const targetNode = d.target.name;
          const sourceCategory = d.source.name.split("_")[0];
          const targetCategory = d.target.name.split("_")[0];

          const specificFlow = d3.sum(self.links, (link) => {
            return link.source.name === sourceNode && link.target.name === targetNode ? link.value : 0;
          });
          const totalCategoryFlow = d3.sum(self.links, (link) => {
            return link.source.name.startsWith(sourceCategory) && link.target.name.startsWith(targetCategory) ? link.value : 0;
          });
          const linkPercentage = ((specificFlow / totalCategoryFlow) * 100).toFixed(2) + "%";

          d3.select(this).style("stroke", "#ff5733"); 
          tooltip
            .style("visibility", "visible")
            .text(`Percentage from ${d.source.name} to ${d.target.name}: ${linkPercentage}`)
            .style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px");
          

          d3.selectAll(".node rect")
            .filter((nodeData: any) => nodeData.name === d.source.name || nodeData.name === d.target.name)
            .style("fill", "#ff5733");
        })
        .on("mousemove", (event) => {
          tooltip
            .style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
          d3.select(this).style("stroke", "#888"); 
          tooltip.style("visibility", "hidden");

          d3.selectAll(".node rect")
            .style("fill", "#2d7dd2");
        });

      const node = chartContainer
        .append("g")
        .selectAll(".node")
        .data(this.nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d) => `translate(${d.x0},${d.y0})`);
      
      node
        .append("rect")
        .attr("height", (d) => d.y1 - d.y0)
        .attr("width", sankeyLayout.nodeWidth())
        .style("fill", "#2d7dd2")
        .style("stroke", "#000")
        .on("mouseover", function (event, d) {
          d3.select(this).style("fill", "#ff5733"); 
          linkSelection
            .filter((linkData: any) => linkData.source.name === d.name || linkData.target.name === d.name)
            .style("stroke", "#ff5733");
            
        })
        .on("mouseout", function () {
          d3.select(this).style("fill", "#2d7dd2"); 

          linkSelection
            .style("stroke", "#888");
        });
      
      node
        .append("text")
        .attr("x", -6)
        .attr("y", (d) => (d.y1 - d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text((d) => d.name)
        .filter((d) => d.x0 < this.size.width / 2)
        .attr("x", 6 + sankeyLayout.nodeWidth())
        .attr("text-anchor", "start");

      chartContainer
        .append("text")
        .attr("x", this.size.width / 2)
        .attr("y", this.size.height-30)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Sankey Diagram of Student Attributes and Academic Performance");
    },
  },
  watch: {
    rerender(newSize) {
      if (!isEmpty(newSize)) {
        d3.select("#sankey-svg").selectAll("*").remove();
        this.initSankeyChart();
      }
    },
    highlightedNode(data) {
      d3.selectAll('.node rect')
        .transition()
        .duration(300) 
        .style('fill', '#2d7dd2');

      d3.selectAll('.link')
        .transition()
        .duration(300) 
        .style('stroke', '#888')
        .style('stroke-opacity', 0.4);

      if (data) {

        d3.selectAll('.node rect')
          .filter((nodeData: any) => nodeData.name.includes(`${data.type}_${data.level}`))
          .transition()
          .duration(500) 
          .style('fill', '#ff5733'); 

        d3.selectAll('.link')
          .filter((linkData: any) =>
            linkData.source.name.includes(`${data.type}_${data.level}`) ||
            linkData.target.name.includes(`${data.type}_${data.level}`)
          )
          .transition()
          .duration(500) 
          .style('stroke', '#ff5733') 
          .style('stroke-opacity', 0.8); 
      }
    }
  },
  mounted() {
    window.addEventListener("resize", debounce(this.onResize, 100));
    this.onResize();
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.onResize);
  },
};
</script>

<template>
  <div class="chart-container d-flex" ref="chartContainer">
    <svg id="sankey-svg" width="100%" height="100%"></svg>
  </div>
</template>

<style scoped>
.chart-container {
  height: 100vh;
  width: 100vw;
  max-height: 100%;
  max-width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  overflow: hidden;
}
</style>
