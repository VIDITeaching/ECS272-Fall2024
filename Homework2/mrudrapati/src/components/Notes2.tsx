import React from 'react'
import { Paper, Divider, Button } from '@mui/material';
import { useState } from 'react';

// after the colon is the typing, before is how props are passed
export default function Notes2({ msg }: { msg: string }) {
  const [click, setClick] = useState(0);

  return (
    <>
      <Paper elevation={1} style={{padding: '1rem'}}>
        <h3>{msg}</h3>
        <Divider />
        <p>
          From the bar chart we can understand that unmarried people are more mentally exhausted than the married people. This reveals that marriage can help in lessening the stressful burdens in life when shared.
        </p>
        <h4> Rationale </h4>
        <p>
          A bar chart was my first call as observing the proportion of married people being depressed was something I wanted to know. New informaiton like anxiety is more prevalent in unmarried people and depression is more prevalent in married people is seen.
        </p>
      </Paper>
    </>
  )
}