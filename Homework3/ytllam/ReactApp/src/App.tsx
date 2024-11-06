import Example from './components/sampleComponents/Example.tsx';
import Sankey from './components/Sankey.tsx';
import Viz1 from './components/Viz1.tsx';
import Viz2 from './components/Viz2.tsx';
import Histogram from './components/Histogram.tsx';
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import { useState, useEffect } from 'react';
import DataContext from './stores/DataContext.ts';
import SelectedDataContext from './stores/SelectedDataContext.ts';

import * as d3 from 'd3';
import * as types from './types';
import SmallMultiples from './components/SmallMultiples.tsx';


// Adjust the color theme for material ui
const theme = createTheme({
  palette: {
    primary:{
      main: grey[700],
    },
    secondary:{
      main: grey[700],
    }
  },
})

// For how Grid works, refer to https://mui.com/material-ui/react-grid/
function Layout() {
  const [data, setData] = useState<types.DataRow[]>([]);
  const [selectedData, setSelectedData] = useState({
    selectedNodes: [],
    selectedCols: [],
  });

  useEffect(() => {
    const readCSV = async () => {
      try {
        // Stretch goal: interactivity to toggle between math and portugese datasets
        const csvData : types.DataRow[] = await d3.csv('../../data/student-mat.csv', r => {
          let trend;
          let tolerance = 0.5
          if (r.G3 === r.G2 && r.G2 === r.G1) {
            trend = types.GradeTrendEnum.Maintained;
          } else if (r.G3 >= r.G2 && r.G2 >= r.G1) {
            trend = types.GradeTrendEnum.Improved;
          } else if (r.G3 <= r.G2 && r.G2 <= r.G1) {
            trend = types.GradeTrendEnum.Declined;
          } else {
            trend = types.GradeTrendEnum.Fluctuated;
          }

          // if (r.G3 >= r.G2 && r.G2 >= r.G1) { // up up
          //   trend = types.GradeTrendEnum.Improved;
          // } else if (r.G3 < r.G2 && r.G2 < r.G1) { // down down
          //   trend = types.GradeTrendEnum.Declined;
          // } else if (r.G3 >= r.G1 && r.G2 >= r.G1) { // up down but overall better
          //   trend = types.GradeTrendEnum['Down but overall better'];
          // } else if (r.G3 >= r.G1 && r.G2 < r.G1) { // down up but overall better
          //   trend = types.GradeTrendEnum['Up and better'];
          // } else if (r.G3 < r.G1 && r.G3 < r.G2) { // up down but overall worse
          //   trend = types.GradeTrendEnum['Down and worse'];
          // } else if (r.G3 < r.G1 && r.G3 >= r.G2) { // down up but overall worse
          //   trend = types.GradeTrendEnum['Up but worse'];
          // } else {
          //   trend = types.GradeTrendEnum.Unknown;
          // }
          return {
            school: r.school as types.SchoolEnum,
            sex: r.sex as types.SexEnum,
            age: +r.age,
            address: r.address as types.AddressEnum,
            famSize: r.famsize as types.FamSizeEnum,
            parentStatus: r.Pstatus as types.ParentStatusEnum,
            motherEdu: r.Medu as types.EducationEnum,
            fatherEdu: r.Fedu as types.EducationEnum,
            motherJob: r.Mjob as types.JobEnum,
            fatherJob: r.Fjob as types.JobEnum,
            reason: r.reason as types.SchoolReasonEnum,
            guardian: r.guardian as types.GuardianEnum,
            travelTime: r.traveltime as types.TravelTimeEnum,
            studyTime: r.studytime as types.WeeklyStudyTimeEnum,
            failures: r.failures as types.NumClassesFailedEnum,
            schoolSup: r.schoolsup as types.BooleanEnum,
            famSup: r.famsup as types.BooleanEnum,
            paid: r.paid as types.BooleanEnum,
            activities: r.activities as types.BooleanEnum,
            nursery: r.nursery as types.BooleanEnum,
            higher: r.higher as types.BooleanEnum,
            internet: r.internet as types.BooleanEnum,
            romantic: r.romantic as types.BooleanEnum,
            famRel: r.famrel as types.QualityEnum,
            freeTime: r.freetime as types.FrequencyEnum,
            goOut: r.goout as types.FrequencyEnum,
            weekdayAlc: r.Dalc as types.FrequencyEnum,
            weekendAlc: r.Walc as types.FrequencyEnum,
            health: r.health as types.QualityEnum,
            absences: +r.absences,
            G1: +r.G1,
            G2: +r.G2,
            G3: +r.G3,
            gradeTrend: trend as types.GradeTrendEnum,
          }
        });
        setData(csvData);
        // console.log('APP', csvData);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    }
    readCSV();
  }, []); // empty dependency array [] - run once

  // TODO: fix bottom half disappearing when window is tiny
  return (
    <DataContext.Provider value={data}>
      <SelectedDataContext.Provider value={{selectedData, setSelectedData}}>

      {/* Top level grid container: vertical */}
      <Grid container spacing={1} direction='column' id='main-container'>
        {/* Horizontal grids as cells */}
        <Grid container item xs={5} sm={5} md={5} lg={6} xl={6} display='flex' justifyContent='center'>
          <Grid item xs sm md lg xl>
            <Sankey/>
          </Grid>
        </Grid>
        <Grid container spacing={2} item xs sm md lg xl
          display='flex' justifyContent='center'>
          <Grid item xs={12} sm={12} md={12} lg xl>
            <Histogram/>
          </Grid>
          <Grid item xs={12} sm={12} md={12} lg={8} xl={8}>
            <SmallMultiples/>
          </Grid>
        </Grid>
      </Grid>
      </SelectedDataContext.Provider>
    </DataContext.Provider>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Layout />
    </ThemeProvider>
  )
}

export default App
