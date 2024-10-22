import Example from './components/sampleComponents/Example.js'
import Notes from './components/sampleComponents/Notes.js'
import Viz1 from './components/Viz1'
import { NotesWithReducer, CountProvider } from './components/sampleComponents/NotesWithReducer.js';
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import { useState, useEffect } from 'react';
import DataContext from './stores/DataContext.js';
import * as d3 from 'd3';
import * as types from './types';


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

  useEffect(() => {
    const readCSV = async () => {
      try {
        const csvData : types.DataRow[] = await d3.csv('../../data/student-mat.csv', r => {
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
            schoolSup: r.schoolsup === "yes",
            famSup: r.famsup === "yes",
            paid: r.paid === "yes",
            activities: r.activities === "yes",
            nursery: r.nursery === "yes",
            higher: r.higher === "yes",
            internet: r.internet === "yes",
            romantic: r.romantic === "yes",
            famRel: r.famrel as types.QualityEnum,
            freeTime: r.freetime as types.FrequencyEnum,
            goOut: r.goout as types.FrequencyEnum,
            weekdayAlc: r.Dalc as types.FrequencyEnum,
            weekendAlc: r.Walc as types.FrequencyEnum,
            health: r.health as types.QualityEnum,
            absences: +r.absences,
            G1: +r.G1,
            G2: +r.G2,
            G3: +r.G3
          }
        });
        setData(csvData);
        // console.log(csvData);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    }
    readCSV();
  }, []);


  return (
    <DataContext.Provider value={data}>
      <Grid container spacing={1} direction='column' id="main-container">
        <Grid container item xs={6} sm={6} md={6} lg={6}>
          <Grid item xs={5} sm={5} md={5} lg={5}>
            <p>Vertical grid item 2</p>
            <Viz1/>
          </Grid>
          <Grid item xs sm md lg/>
        </Grid>
        <Grid item xs sm md lg>
          <p>Vertical grid item 2</p>
        </Grid>
      </Grid>
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
