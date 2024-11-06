import React from 'react';
import TextField from '@mui/material/TextField';

function NumberField({ value, onChange }) {
  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value) || 0;
    onChange(newValue); // Update value in the App component
  };

  return (
    <TextField
      label="Quantity"
      type="number"
      value={value}
      onChange={handleChange}
      variant="outlined"
      InputProps={{
        inputProps: { min: 3, max: 100, step: 1 },
      }}
      InputLabelProps={{
        shrink: true,
      }}
    />
  );
}

export default NumberField;
