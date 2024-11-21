<script>
import * as d3 from "d3";

export default {
  data() {
    return {
      margin: { top: 40, right: 20, bottom: 100, left: 80 },
      width: 800,
      height: 400,
      selectedMake: null,  // Track selected make for highlighting and filtering
    };
  },
  props: ["onMakeSelect"], // Prop to communicate with other components
  mounted() {
    this.drawChart();
    window.addEventListener("resize", this.drawChart);
  },
  methods: {
    drawChart() {
      const svg = d3.select(this.$refs.svg);
      svg.selectAll("*").remove();

      const width = this.width - this.margin.left - this.margin.right;
      const height = this.height - this.margin.top - this.margin.bottom;

      // Tooltip setup - ensure single instance
      d3.select("body").selectAll(".tooltip").remove();

      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#333")
        .style("color", "#fff")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0); // Initially hidden

      d3.csv('../../data/top_10_car_prices.csv').then(data => {
        const counts = d3.rollups(data, v => v.length, d => d.make)
          .map(([make, count]) => ({ make, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        const x = d3.scaleBand()
          .domain(counts.map(d => d.make))
          .range([0, width])
          .padding(0.1);

        const y = d3.scaleLinear()
          .domain([0, d3.max(counts, d => d.count)])
          .range([height, 0])
          .nice();

        const chart = svg
          .attr("width", this.width)
          .attr("height", this.height)
          .append("g")
          .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        // Bars with load animation and custom tooltip functionality
        chart.selectAll(".bar")
          .data(counts)
          .join("rect")
          .attr("class", "bar")
          .attr("x", d => x(d.make))
          .attr("width", x.bandwidth())
          .attr("y", height) // Start at baseline
          .attr("height", 0) // Start with height 0
          .attr("fill", d => d.make === this.selectedMake ? "orange" : "steelblue")
          .style("cursor", "pointer")
          .transition() // Animate bars growing to their full height
          .duration(1000)
          .attr("y", d => y(d.count))
          .attr("height", d => height - y(d.count));

        // Tooltip interactivity with hover and fade-in/fade-out animations
        chart.selectAll(".bar")
          .on("click", (event, d) => {
            this.selectedMake = this.selectedMake === d.make ? null : d.make;
            this.onMakeSelect(this.selectedMake);
            this.drawChart();
          })
          .on("mouseover", (event, d) => {
            // Highlight selected bar and dim others
            chart.selectAll(".bar")
              .transition()
              .duration(200)
              .attr("fill", bar => bar.make === d.make ? "darkblue" : "lightgrey");

            // Show and position tooltip with additional information
            const total = d3.sum(counts, c => c.count);
            const percentage = ((d.count / total) * 100).toFixed(2);
            tooltip
              .style("opacity", 0)
              .html(`<strong>Make:</strong> ${d.make}<br><strong>Count:</strong> ${d.count}<br><strong>Percentage:</strong> ${percentage}%`)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px")
              .transition()
              .duration(200)
              .style("opacity", 1);
          })
          .on("mousemove", event => {
            tooltip
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", () => {
            // Reset colors
            chart.selectAll(".bar")
              .transition()
              .duration(200)
              .attr("fill", d => d.make === this.selectedMake ? "orange" : "steelblue");

            // Hide tooltip
            tooltip.transition().duration(200).style("opacity", 0);
          });

        // Add count labels on top of each bar
        chart.selectAll(".label")
          .data(counts)
          .join("text")
          .attr("class", "label")
          .attr("x", d => x(d.make) + x.bandwidth() / 2)
          .attr("y", d => y(d.count) - 5)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .style("fill", "#333")
          .text(d => d.count);

        // X and Y axis
        chart.append("g")
          .attr("transform", `translate(0, ${height})`)
          .call(d3.axisBottom(x))
          .selectAll("text")
          .attr("transform", "rotate(-45)")
          .attr("dx", "-0.6em")
          .attr("dy", "0.6em")
          .style("text-anchor", "end");

        chart.append("g")
          .call(d3.axisLeft(y));

        // Title and labels
        svg.append("text")
          .attr("x", this.width / 2)
          .attr("y", this.margin.top / 2)
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .text("Top 10 Car Makes by Sales Count");

        svg.append("text")
          .attr("x", this.width / 2)
          .attr("y", this.height - 10)
          .attr("text-anchor", "middle")
          .style("font-size", "14px")
          .text("Car Make");

        svg.append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -height / 2)
          .attr("y", this.margin.left / 4)
          .attr("text-anchor", "middle")
          .style("font-size", "14px")
          .text("Count");
      });
    },
  },
  watch: {
    selectedMake() {
      this.drawChart();
    }
  }
};
</script>

<template>
  <svg ref="svg"></svg>
</template>

<style scoped>
.bar {
  transition: fill 0.2s;
}
.bar:hover {
  fill: darkblue;
}
.label {
  font-weight: bold;
  fill: #000;
}
/* Style for the custom tooltip */
.tooltip {
  font-size: 14px;
  line-height: 1.5;
  opacity: 0;
  transition: opacity 0.2s ease;
}
</style>
