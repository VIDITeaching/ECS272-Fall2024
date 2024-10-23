import React from 'react'
import { Paper, Divider, Button } from '@mui/material';
import { useState } from 'react';

// after the colon is the typing, before is how props are passed
export default function Notes({ msg }: { msg: string }) {
  const [click, setClick] = useState(0);

  return (
    <>
      <Paper elevation={1} style={{padding: '1rem'}}>
        <h3>{msg}</h3>
        <Divider />
        <p>
          We can clearly see that mental conditions are very frequent in students scoring more than 3 CGPA. This reveals a scary statistics that students are feeling stressful because of academic pressure.
        </p>
        <h4> Rationale </h4>
        <p>
          Observing how different mental conditions vary with academic performance felt like something that could produce a good inference. That is why I went ahead with a line chart as the statistics of multiple data can be see at the same time.
        </p>
      </Paper>
    </>
  )
}