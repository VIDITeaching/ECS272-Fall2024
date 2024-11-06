<script lang="ts">
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal, SankeyGraph, SankeyNode, SankeyLink } from "d3-sankey";
import { debounce, isEmpty } from 'lodash';

export default {
  data() {
    return {
      data: [] as any[], // Store the CSV data
      sankeyData: {} as SankeyGraph<any, any>, // Data structure for Sankey diagram
      size: { width: 0, height: 0 }, // Chart size
      margin: { left: 50, right: 50, top: 50, bottom: 50 }, // Adjust margins
      validBodyTypes: ['sedan', 'suv', 'truck', 'coupe', 'hatchback'], // List of valid body types
      selectedState: null, // Track the selected state
      stateColorMap: new Map() // Store unique color mappings for each state
    };
  },
  computed: {
    rerender() {
      return !isEmpty(this.sankeyData) && this.size.width > 0 && this.size.height > 0;
    }
  },
  created() {
    // Load and process CSV data
    d3.csv('../../data/car_prices.csv').then((data) => {
      this.data = this.preprocessData(data); // Preprocess the data
      this.processData(); // Structure data for Sankey
      this.initChart(); // Initialize the Sankey diagram after loading data
    });
  },
  methods: {
    onResize() {
      const container = this.$refs.sankeyContainer as HTMLElement;
      this.size.width = container.clientWidth;
      this.size.height = container.clientHeight;
    },
    preprocessData(data: any[]) {
      // Filter for valid entries:
      // - state must be two lowercase letters
      // - body must be in validBodyTypes
      // - year, state, and body should not be missing
      return data.filter(d => 
        /^[a-z]{2}$/.test(d.state) && 
        this.validBodyTypes.includes(d.body) &&
        d.state && d.year && d.body
      );
    },
    processData() {
      // Process data to create nodes and links for Sankey layout
      const stateYearBodyTypeCounts = d3.rollups(
        this.data,
        v => v.length,
        d => d.state, // First level: State
        d => d.year,  // Second level: Year
        d => d.body // Third level: Body type
      );

      // Generate Sankey nodes and links from hierarchical data
      const nodes: SankeyNode<any, any>[] = [];
      const links: SankeyLink<any, any>[] = [];

      const nodeMap = new Map();

      // Helper function to add nodes and links
      const addNode = (name: string) => {
        if (!nodeMap.has(name)) {
          const node = { name };
          nodeMap.set(name, nodes.length);
          nodes.push(node);
        }
        return nodeMap.get(name);
      };

      stateYearBodyTypeCounts.forEach(([state, yearGroups]) => {
        const stateNode = addNode(state);

        yearGroups.forEach(([year, bodyGroups]) => {
          const yearNode = addNode(`Year ${year}`);
          links.push({ source: stateNode, target: yearNode, value: d3.sum(bodyGroups, d => d[1]) });

          bodyGroups.forEach(([bodyType, count]) => {
            const bodyTypeNode = addNode(bodyType);
            links.push({ source: yearNode, target: bodyTypeNode, value: count });
          });
        });
      });

      this.sankeyData = { nodes, links };

      // Generate a color scale for states
      const uniqueStates = Array.from(new Set(this.data.map(d => d.state)));
      const colorScale = d3.scaleOrdinal(d3.schemeCategory10); // You can use any other color scale
      uniqueStates.forEach((state, index) => {
        this.stateColorMap.set(state, colorScale(index));
      });
    },
    initChart() {
    const svg = d3.select("#sankey-svg")
      .attr("width", this.size.width)
      .attr("height", this.size.height)
      .attr("viewBox", `0 0 ${this.size.width} ${this.size.height}`);
    
    const chartContainer = svg.append("g")
      .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

    // Add title text at the top of the chart
    svg.append("text")
      .attr("x", this.size.width / 2)  // Center the title horizontally
      .attr("y", this.margin.top / 2)  // Position it a little above the graph
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Car Sales Flow by State, Year, and Body Type (Click to highlight links)");

    const sankeyLayout = sankey<any, any>()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[0, 0], [this.size.width - this.margin.left - this.margin.right, this.size.height - this.margin.top - this.margin.bottom]]);

    const sankeyGraph = sankeyLayout(this.sankeyData);

    // Draw links
    const link = chartContainer.append("g")
      .selectAll("path")
      .data(sankeyGraph.links)
      .enter()
      .append("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("fill", "none")
      .attr("stroke", d => d3.interpolateBlues(d.value / 100))
      .attr("stroke-width", d => Math.max(1, d.width))
      .attr("opacity", 0.5);

    // Draw nodes
    const node = chartContainer.append("g")
      .selectAll("rect")
      .data(sankeyGraph.nodes)
      .enter()
      .append("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("height", d => d.y1 - d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("fill", d => {
        // Apply color to the state nodes
        return this.stateColorMap.has(d.name) ? this.stateColorMap.get(d.name) : "gray";
      })
      .attr("stroke", "black")
      .style("cursor", "pointer") // Make the nodes clickable
      .on("click", (event, d) => this.handleClick(d, link, node)); // Add click event listener

    // Add node labels with adjusted positioning
    node.append("title").text(d => `${d.name}\n${d.value.toLocaleString()}`);

    chartContainer.append("g")
      .selectAll("text")
      .data(sankeyGraph.nodes)
      .enter()
      .append("text")
      .attr("x", d => d.x0 - 10) // Position text to the left of the node
      .attr("y", d => (d.y0 + d.y1) / 2) // Center text vertically
      .attr("text-anchor", "end") // Align text to the right (left-aligned relative to the node)
      .style("font-size", "10px")
      .style("alignment-baseline", "middle")
      .text(d => d.name);
  }
,

    handleClick(nodeData, link, node) {
      const selectedState = nodeData.name;

      // If the clicked state is the same as the selected one, reset everything
      if (this.selectedState === selectedState) {
        this.selectedState = null;
        node.style("opacity", 1);
        link.style("opacity", 0.5);
      } else {
        this.selectedState = selectedState;

        // Dim all other nodes and links
        node.style("opacity", 0.1);
        link.style("opacity", 0.1);

        // Highlight the selected state, and its related links to Year and Body Type
        node.filter(d => d.name === selectedState).style("opacity", 1);
        
        // Highlight links connected to the selected state, both to year and body type
        link.filter(d => d.source.name === selectedState || d.target.name === selectedState)
            .style("opacity", 1);

        // Ensure all relevant year and body type nodes are highlighted, even if not the source
        node.filter(d => d.name === "Year" || this.validBodyTypes.includes(d.name)).style("opacity", 1);
      }
    }
  },
  watch: {
    rerender(newSize) {
      if (newSize) {
        d3.select('#sankey-svg').selectAll('*').remove(); // Clear previous chart elements
        this.initChart();
      }
    }
  },
  mounted() {
    window.addEventListener('resize', debounce(this.onResize, 100));
    this.onResize(); // Initialize size on mount
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
  }
}
</script>

<template>
  <div class="chart-container" ref="sankeyContainer" style="width: 100vw; height: 100vh;">
    <svg id="sankey-svg"></svg>
  </div>
</template>

<style scoped>
.chart-container {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
}
</style>
