// src/App.tsx
import React from 'react';
import MedalDashboard from './components/Dashboard/MedalDashboard';
import Grid from '@mui/material/Grid';

function Layout() {
  return (
    <Grid container spacing={1} direction='column' id="main-container">
      <Grid item xs={12}>
        <MedalDashboard />
      </Grid>
    </Grid>
  );
}

function App() {
  return <Layout />;
}

export default App;