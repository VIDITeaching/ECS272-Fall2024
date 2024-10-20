import React from 'react';
import MentalHealthChart from './components/MentalHealthChart';

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Bar Chart - Student Mental Health Analysis</h1>
      </header>
      <main>
        <section className="chart-section">
          <MentalHealthChart />
        </section>
        <section className="description-section">
          <h2>About This Visualization</h2>
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
      </main>
      <footer className="App-footer">
        <p>Data source: Student Mental Health Survey</p>
      </footer>
    </div>
  );
};

export default App;