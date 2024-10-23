import React from 'react'
import { Paper, Divider, Button } from '@mui/material';
import { useState } from 'react';

// after the colon is the typing, before is how props are passed
export default function Notes3({ msg }: { msg: string }) {
  const [click, setClick] = useState(0);

  return (
    <>
      <Paper elevation={1} style={{padding: '1rem'}}>
        <h3>{msg}</h3>
        <Divider />
        <p>
          The sankey diagram reveals an interesting statistic. First we observe that the mos depressed people are from age 18-19. But when looked from a bigger perspective the proportion of people getting depressed is almost getting closer to non-depressed people. Also in the other part another interesting thing is noticed. We see out of depressed people very very few people consider going for treatment. This shows that mental health is not taken very seriously by young adults.
        </p>
        <h4> Rationale </h4>
        <p>
          A sankey diagram is very useful to observe how data splits into streams of different sizes to get a visual idea of a relative measure between two entities. Here the reason I chose age before was to see if there is any specific age being more depressed or not. Here we don't see a big pattern, but the information gained on the right reveals an important inference.
        </p>
      </Paper>
    </>
  )
}