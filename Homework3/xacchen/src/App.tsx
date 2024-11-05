import React, { useState } from "react";
import { Box, Grid } from "@mui/material";

import SunburstChart from "./components/SunburstChart";
import DepressionBarChart from "./components/BarChart";
import SankeyDiagram from "./components/Sankey";

import sunburst_data from "../data/data.json";
import bar_data from "../data/bar_data.json";
import sankey_data from "../data/sankey_data.json";

const App = () => {
  // Set "depression" as the default metric for initial rendering
  const [selectedMetric, setSelectedMetric] = useState("depression");

  const sanitizeMetric = (metric) => {
    const coreMetric = metric.replace(/[\?:]/g, '').trim().toLowerCase();
    if (coreMetric.startsWith("panic")) {
      return "panic_attack";
    }
    
    return coreMetric;
  };

  // Handle the metric change based on Sankey node clicks
  const handleSankeyNodeClick = (metric) => {
    const cleanedMetric = sanitizeMetric(metric.split(' ')[0]); 
    setSelectedMetric(cleanedMetric);
    console.log("Now metric is " + cleanedMetric);
  };



  return (
    <div className="App">
      <Box sx={{ flexGrow: 1, paddingTop: { md: 10 }, paddingLeft: { md: 25 }, paddingRight: { md: 5 } }}>
        <Grid container spacing={6} justifyContent={"center"} alignContent={"center"}>
          <Grid item xs={12} md={4} container direction="column" spacing={2}>
            <Grid item>
              <Box />
                <h1 style={{fontFamily: 'monospace'}}> ECS 272 Homework 3 Hsin-Ai Chen</h1>
                <h3 style={{fontFamily: 'monospace'}}> Is there any relationship between grades and your mental health?  <br/> <br/>
                    Check the Sunburst Chart below to know the students' basic information from the dataset. <br/> <br/>
                    You can clcik the part you want to zoom in and click the center to zoom out.<br/> <br/>
                    Use the Sankey diagram to know their mental condition, once you click the node, the Bar chart will show the proportion of certain condition among students
                    with different grades.
                </h3>
            </Grid>
            <Grid item>
              <SunburstChart data={sunburst_data} />
            </Grid>
          </Grid>
          <Grid item xs={12} md={8} container direction="column" spacing={2}>
            <Grid item>
              <DepressionBarChart data={bar_data} selectedMetric={selectedMetric} />
            </Grid>
            <Grid item>
              <SankeyDiagram data={sankey_data} onNodeClick={handleSankeyNodeClick} />
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default App;
