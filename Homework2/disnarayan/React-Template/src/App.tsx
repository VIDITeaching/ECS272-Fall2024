import React from 'react';
import MentalHealthChart from './components/MentalHealthChart';
import SankeyDiagram from './components/SankeyDiagram';
import ChordDiagram from './components/ChordDiagram';
import StackedBarChart from './components/StackedBarChart';

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Student Mental Health Analysis</h1>
      </header>
      <main>
        <section className="chart-section">
          <h2>Overview of Student Data by Categories</h2>
          <StackedBarChart />
          <p>
            This stacked bar chart provides an overview of various categories, such as Gender, Course, CGPA,
            Year of Study, and more. Each bar is divided into its corresponding value (e.g., Male/Female for Gender).
          </p>
        </section>
        <section className="chart-section">
          <h2>Mental Health Conditions Bar Chart</h2>
          <MentalHealthChart />
          <p>
            This chart displays the prevalence of mental health conditions among students, including depression, anxiety,
            and panic attacks. The data is based on a survey of student responses, showing the number of students who
            reported experiencing each condition (True) versus those who did not (False).
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
        </section>
        <section className="chart-section">
          <h2>Ages 18-24 and Mental Health Conditions Chord Diagram</h2>
          <ChordDiagram />
          <p>
            This chord diagram illustrates the relationships between individual ages (18 to 24) 
            and mental health conditions. It shows how each age from 18 to 24 is associated with 
            mental health conditions like depression, anxiety, and panic attacks.
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