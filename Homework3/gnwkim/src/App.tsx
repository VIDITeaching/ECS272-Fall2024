// import Example from './components/Example'
// import Test from './components/StackedBarChart'
// import Notes from './components/Notes'
// import { NotesWithReducer, CountProvider } from './components/NotesWithReducer';
import { Select, MenuItem, FormControl, InputLabel, Grid, SelectChangeEvent } from '@mui/material'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import { ThemeContext } from '@emotion/react';
import { useState } from 'react'


import StackedBarChart from './components/StackedBarChartV2';
import ScatterPlot from './components/ScatterPlotV2';
import ParallelSet from './components/ParallelSet';
import StartWindow from './components/StartWindow';
import NumberField from './components/NumberField';

import { SortingOptions as BarChartSortingOptions } from './components/StackedBarChartV2';

// Adjust the color theme for material ui
const theme = createTheme({
  palette: {
    primary: {
      main: grey[700],
    },
    secondary: {
      main: grey[700],
    }
  },
})


// temporary for testing
const FillingComponent = () => {
  return (
    <div style={{ border: '1px solid black', height: '100%' }}>
      <svg width='100%' height='100%' />
    </div>
  )
}

function Layout() {
  const [barChartOption, setBarChartOption] = useState<BarChartSortingOptions>('total')
  const [barChartNumber, setBarChartNumber] = useState<number>(10)
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])


  const addSelectedCountry = (countryCode: string) => {
    if (!selectedCountries.includes(countryCode)) {
      setSelectedCountries([...selectedCountries, countryCode]);
    }
  }

  const removeSelectedCountry = (countryCode: string) => {
    setSelectedCountries(selectedCountries.filter(code => code !== countryCode));
  }

  const toggleCountry = (countryCode: string) => {
    setSelectedCountries((prevSelectedCountries) => {
      if (prevSelectedCountries.includes(countryCode)) {
        return prevSelectedCountries.filter(code => code !== countryCode);
      } else {
        return [...prevSelectedCountries, countryCode];
      }
    })
  }

  const barChartOptionOnChange = (event: SelectChangeEvent) => {
    setBarChartOption(event.target.value as BarChartSortingOptions)
  }

  return (
    <>
      <StartWindow />
      <Grid
        container
        spacing={1}
        direction='row'
        id="main-container"
        paddingTop={1}
        paddingLeft={1}
      >

        {/* left */}
        <Grid container item spacing={1} direction='column' xs={5}>

          {/* top */}

          <Grid item xs={1}>
            <FormControl>
              <InputLabel id="dropdown-label">Select an Option</InputLabel>
              <Select
                labelId="dropdown-label"
                value={barChartOption || 'total'}
                label="Select an Option"
                onChange={barChartOptionOnChange}
              >
                <MenuItem value='total'>By Total Medals</MenuItem>
                <MenuItem value="gold">By Gold Medals</MenuItem>
                <MenuItem value="silver">By Silver Medals</MenuItem>
                <MenuItem value="bronze">By Bronze Medals</MenuItem>
                <MenuItem value="relativeGold">By Relative Gold Medals</MenuItem>
              </Select>
            </FormControl>

            <NumberField value={barChartNumber} onChange={setBarChartNumber}></NumberField>
          </Grid>

          <Grid item xs={5}>
            <StackedBarChart sortingOption={barChartOption} 
              number={barChartNumber} 
              toggleCountry={toggleCountry}
              selectedCountries={selectedCountries}
            />
          </Grid>

          {/* bottom */}
          <Grid item xs={6}>
            <ScatterPlot selectedCountries={selectedCountries} toggleCountry={toggleCountry} />
          </Grid>
        </Grid>


        {/* right */}
        <Grid item xs={7}>
          <p
            style={{
              position: 'absolute',
              background: 'rgba(0,0,0,0.1)',
            }}
          >
            {JSON.stringify(selectedCountries)}
          </p> {/* !!! TEMPORARY !!! */}
          {/* <ParallelSet countries={['LCA', 'DMA', 'ALB']} /> */}
          <ParallelSet countries={selectedCountries} />
        </Grid>
      </Grid>
    </>
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
