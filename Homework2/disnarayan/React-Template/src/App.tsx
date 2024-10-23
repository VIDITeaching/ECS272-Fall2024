import React from 'react';
import SankeyDiagram from './components/SankeyDiagram';
import ChordDiagram from './components/ChordDiagram';
import StackedBarChart from './components/StackedBarChart';

const App: React.FC = () => {
  return (
    <div className="app-container" style={{
      maxWidth: '1440px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f5f7fa'
    }}>
      <header style={{
        textAlign: 'center',
        padding: '20px 0',
        marginBottom: '40px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          color: '#1a365d',
          marginBottom: '10px'
        }}>Student Mental Health Analysis</h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#4a5568',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          Comprehensive analysis of student mental health across demographics and conditions
        </p>
      </header>

      <main style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '40px'
      }}>

        {/* Demographics Analysis */}
        <section className="analysis-section" style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center' // Centers the content horizontally
        }}>
          <h2 style={{
            fontSize: '1.8rem',
            color: '#2d3748',
            marginBottom: '20px',
            textAlign: 'center'
          }}>Overview of Student Data by Category</h2>
          <div style={{ marginBottom: '20px' }}>
            <StackedBarChart />
          </div>
          <p style={{
            fontSize: '1.1rem',
            color: '#4a5568',
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            Analysis of student demographics including gender, age groups, and academic years,
            showing the distribution across different mental health conditions.
          </p>
        </section>

        {/* Flow Analysis */}
        <section className="analysis-section" style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center' // Centers the content horizontally
        }}>
          <h2 style={{
            fontSize: '1.8rem',
            color: '#2d3748',
            marginBottom: '20px',
            textAlign: 'center'
          }}>Educational Path and Mental Health Flow</h2>
          <div style={{ marginBottom: '20px' }}>
            <SankeyDiagram />
          </div>
          <p style={{
            fontSize: '1.1rem',
            color: '#4a5568',
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            Visualization of how students flow through different courses and years of study,
            and their corresponding mental health conditions.
          </p>
        </section>

        {/* Age Relationships */}
        <section className="analysis-section" style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center' // Centers the content horizontally
        }}>
          <h2 style={{
            fontSize: '1.8rem',
            color: '#2d3748',
            marginBottom: '20px',
            textAlign: 'center'
          }}>Age and Mental Health Relationships</h2>
          <div style={{ marginBottom: '20px' }}>
            <ChordDiagram />
          </div>
          <p style={{
            fontSize: '1.1rem',
            color: '#4a5568',
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            Complex relationships between age groups and various mental health conditions,
            showing patterns and correlations across different age ranges.
          </p>
        </section>
      </main>

      <footer style={{
        marginTop: '40px',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p style={{
          fontSize: '1rem',
          color: '#4a5568'
        }}>Data source: Student Mental Health Survey | Created with React and D3.js</p>
      </footer>
    </div>
  );
};

export default App;
