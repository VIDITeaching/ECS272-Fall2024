import React from 'react';
import MentalHealthChart from './components/MentalHealthChart';
import ScatterPlot from './components/ScatterPlot';
import SankeyDiagram from './components/SankeyDiagram';
import ChordDiagram from './components/ChordDiagram';

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
        <section className="chart-section">
          <h2>Course to Year of Study to Mental Health Condition Flow</h2>
          <SankeyDiagram />
          <p>
            This Sankey diagram visualizes the flow of students from their course to year of study
            to their mental health condition (specifically, whether they have depression or not).
            The width of each flow represents the number of students in that path.
          </p>
          <p>
            Hover over the nodes and links to see more detailed information.
          </p>
        </section>
        <section className="chart-section">
          <h2>Age Groups and Mental Health Conditions Chord Diagram</h2>
          <ChordDiagram />
          <p>
            This chord diagram illustrates the relationships between age groups and mental health conditions.
            It shows how different age categories (Under 20, 20-25, 25-30, 30+) are associated with 
            mental health conditions like depression, anxiety, and panic attacks.
          </p>
          <p>
            The thickness of the chords represents the number of students in each age group 
            experiencing a particular mental health condition. Hover over the chords and arcs 
            for more detailed information.
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