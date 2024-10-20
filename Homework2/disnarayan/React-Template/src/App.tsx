import MentalHealthChart from './components/MentalHealthChart';
import ScatterPlot from './components/ScatterPlot';

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Student Mental Health Analysis</h1>
      </header>
      <main>
        <section className="chart-section">
          <h2>Mental Health Conditions Bar Chart</h2>
          <MentalHealthChart />
          <p>
            This chart displays the prevalence of mental health conditions among students,
            including depression, anxiety, and panic attacks. The data is based on a survey
            of student responses, showing the number of students who reported experiencing
            each condition (True) versus those who did not (False).
          </p>
          <p>
            Hover over the bars to see detailed information about each category.
          </p>
        </section>
        <section className="chart-section">
          <h2>Age vs CGPA Scatter Plot</h2>
          <ScatterPlot />
          <p>
            This scatter plot shows the relationship between a student's age and their CGPA.
            Each point represents a student, with the shape indicating gender (square for male, 
            circle for female) and the color indicating whether they reported having depression 
            (red) or not (blue).
          </p>
          <p>
            Hover over the points to see detailed information about each student.
          </p>
        </section>
      </main>
      <footer className="App-footer">
        <p>Data source: Student Mental Health Survey</p>
      </footer>
    </div>
  );
};

export default App;