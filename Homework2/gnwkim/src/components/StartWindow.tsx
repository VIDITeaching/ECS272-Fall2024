import React from 'react';
import { Paper, Divider, Button, Typography } from '@mui/material';
import { useState } from 'react';

export default function StartWindow() {
  // State to control the visibility of the window
  const [open, setOpen] = useState(true);
  // Placeholder for your message text
  const msg = "Welcome! This is your custom message.";

  if (!open) return null; // If open is false, return nothing (don't render the window)

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,

        width: '100vw',
        height: '100vh',

        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        
        zIndex: 1000,
      }}>
        <Paper 
          elevation={3} 
          style={{ 
            padding: '20px', 
            maxWidth: '600px', 
            textAlign: 'center',
            zIndex: 1001, // Higher than the overlay
          }}
        >
          {/* Your custom message */}
          <Typography variant='h2'>Welcome👋</Typography>
          <br />
          <Typography variant='body1'>
            This is Gunwoo's homework 2 for ECS 272. 
            I have chosen to use the 2024 Olympics dataset. 
            I have written three plots: Stacked Bar, Bubble Chart, and Parallel Set (Sankey).
            My goal for this visualization was for the user to explore various country's performance with respect to medals.
          </Typography>
          <br />
          <Typography variant='body1'>
            Through the stacked bar chart, the user can get a general overview of how each country performed in the Olympics.
            The bubble chart gives a different metric: average medals per athlete.
            I wanted to highlight the fact that big countries like the United States sends hundreds of athletes but only a
            small fraction of them wins medals. 
            Furthermore, some countries train few talents and aim for efficiency, e.g. North Korea.
            By looking at these plots, my hope is that the user will peak interest in some countries and explore how they did
            in more detail through the parallel set.
            The parallel set has three categories: country, discipline, and event.
            The user can now explore where the countries got their medals from. 
            You can also notice whether a country dominated in a discipline or an event.
          </Typography>
          <br />
          <Typography variant='body2'>
            <b>Some notes about parallel set</b>: it fails to minimize unnecessary crossings, and sometimes makes the plot
            look extremely complicated. 
            I didn't have enough time to implement this. 
            Right now I have chosen to display a subset of countries that makes the plot look nice.
            Moreover, when displaying a country with many medals, it is almost unreadable. 
            I would have to group items in each category to one big 'other' or incorporate more interactivity. 
            The final goal of this plot is where the user can choose which countries to view and dynamically update 
            the plot (this is not too hard, I have everything programatically generated). 
            Maybe user should be able to expand/fold certain elements.
            You may update the props to <code>&lt;ParallelSet/&gt;</code> to display different countries!
          </Typography>


          {/* Ok button to close the window */}
          <br />
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => setOpen(false)}
          >
            Continue
          </Button>
        </Paper>
      </div>
    </>
  );
}
