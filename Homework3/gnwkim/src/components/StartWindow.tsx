import React from 'react';
import { Paper, Divider, Button, Typography } from '@mui/material';
import { useState } from 'react';

export default function StartWindow() {
  const [open, setOpen] = useState(true);

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
            textAlign: 'left',
            zIndex: 1001, // Higher than the overlay
          }}
        >
          {/* Your custom message */}
          <Typography variant='h2'>Welcome back👋</Typography>
          <br />
          <Typography variant='body1'>
            This is Gunwoo's homework 3 for ECS 272. 
            I did not finish/implement everything that I wanted because I don't have time & I became sick.
            I am still submitting something and I probably have sent you (TA) an email.
          </Typography>
          <br />
          <Typography variant='h3'>What's new</Typography>
          <Typography variant='body1'>
            The <b>bar chart</b> now has the ability to apply different sorting options: total medals, 
            by medal types, and by relative gold medals (# gold medal / total).
            You can also set how many countries to view.
            I've applied some subtle animation so that it is clear what is being sorted.
            You can click on the bar to select that country. 
            The selection is global and you will be able to see the changes across all the plots.
          </Typography>
          <br />
          <Typography variant='body1'>
            The <b>bubble chart</b> now has the ability to zoom and pan.
            Some parts of the plot were very cluttered, but now you are able to zoom to see the cluttered areas.
            Similary to the bar chart, you can click on the bubble to select the country.
          </Typography>
          <br />
          <Typography variant='body1'>
            The <b>parallel set</b> is essentially the same.
            I wanted to implement new categories, which are countries, events, and athletes.
            Furthermore, it will pick the top athletes from each country and plot only a subset of them (as the TA suggested).
            At this moment, I am so ill and I cannot work on this anymore. 
            There were inconsistencies and other frustrating details (so much details) that I needed to deal with in this dataset.
            I should've started on this assignment earlier, but please understand that I wasn't procrastinating; I entire 2 weeks has 
            been full of deadlines. As some evidence of work, you can look in the source code to see 
            ParallelSetV2.tsx and ParallelSetV3.tsx.
            I tried to use ChatGPT in V3, but I think this task is too complicated for it to do it right.
            It writes a bunch of code and it doesn't work. It's also impossible to point out the mistakes because
            it writes completely different code and reading it & understanding it takes a long time.
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
