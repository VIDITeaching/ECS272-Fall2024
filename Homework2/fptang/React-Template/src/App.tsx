import Example from './components/Example'
import Notes from './components/Notes'
import { NotesWithReducer, CountProvider } from './components/NotesWithReducer';
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import BarChart from './components/BarChart'
import PieChart from './components/PieChart';
import PolyChart from './components/PolyChart';

function App() {
  return (
    <div className="App">
      <h1>Final Grades Visualization</h1>
      <BarChart />
      <p style={{ padding: '20px', fontSize: '16px', lineHeight: '1.5' }}>
        The bar chart above visualizes the distribution of final grades (G3) among students. The x-axis represents the final grades, ranging from 0 to 20, while the y-axis indicates the number of students who received each grade. From the chart, we can observe that most students tend to cluster around grades 10 and 11, with fewer students receiving very low (0 to 4) or very high grades (17 to 20). There are some noticeable peaks, particularly around grades 10 and 11, which suggests that the majority of students perform around this mid-range. On the other hand, a relatively high number of students also scored a zero, indicating potential failure or absence.
      </p>
      <h1>Study Time Distribution</h1>
      <PieChart />
      <p style={{ padding: '20px', fontSize: '16px', lineHeight: '1.5' }}>
        The pie chart above visualizes the distribution of study time among students. The chart shows that half of the students (50.1%) spend moderate time studying (represented by "2"). Around a quarter of students (26.6%) have a low study time ("1"), while 16.5% of students spend a high amount of time studying ("3"). A small percentage (6.8%) dedicate the highest amount of time to their studies ("4"). This distribution shows that most students fall in the middle range when it comes to their study habits, with fewer students spending very little or a lot of time on their studies.
      </p>
      <h1>Parallel Coordinates: Alcohol Consumption, Study Time, and Final Grades</h1>
      <PolyChart />
      <p style={{ padding: '20px', fontSize: '16px', lineHeight: '1.5' }}>
        The parallel coordinates chart visualizes the relationships between daily alcohol consumption (Dalc), weekend alcohol consumption (Walc), study time, and final grades (G3) for students. Each line represents an individual student, and by following their line across the axes, we can observe how different factors relate to each other. For example, students with lower daily and weekend alcohol consumption tend to have higher study time and better final grades. In contrast, students who consume more alcohol frequently, both on weekdays and weekends, may show lower study time and lower final grades. However, there are exceptions that highlight the diversity in behaviors among the students.
      </p>
    </div>
  );
}

export default App
