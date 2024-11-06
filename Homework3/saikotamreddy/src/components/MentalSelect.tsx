import React from 'react';
import * as d3 from 'd3';


export default function MentalSelect({ setMentalDisorder }) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setMentalDisorder(event.target.value); // update App's state
  };

  return (
    <>
        <div>
        <p>Choose Mental Disorder:</p>
        <select onChange={handleChange} defaultValue="depression">
            <option value="Depression">Depression</option>
            <option value="Anxiety">Anxiety</option>
            <option value="Panic">Panic Attacks</option>
        </select>
        </div>
    </>
  );
};