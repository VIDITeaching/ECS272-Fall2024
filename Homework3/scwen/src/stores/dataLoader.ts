import * as d3 from 'd3';

interface CarData {
  year: number;
  make: string;
  model: string;
  trim: string;
  body: string;
  transmission: string;
  vin: string;
  state: string;
  condition: number;
  odometer: number;
  color: string;
  interior: string;
  seller: string;
  mmr: number;
  sellingprice: number;
  saledate: string;
}

export async function loadCarData(filePath: string): Promise<CarData[]> {
  try {
    const data = await d3.csv<CarData>(filePath, (row) => {
      if (
        !row.year || !row.make || !row.model || !row.trim || !row.body ||
        !row.transmission || !row.vin || !row.state || !row.condition ||
        !row.odometer || !row.color || !row.interior || !row.seller ||
        !row.mmr || !row.sellingprice || !row.saledate
      ) {
        return null;
      }

      const date = new Date(row.saledate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const minDate = new Date('2014-11-01');
      const maxDate = new Date('2015-08-31');
      if (date < minDate || date > maxDate) {
        return null;
      }

      row.make = row.make.toUpperCase();
      row.model = row.model.toUpperCase();
      row.body = row.body.toUpperCase();
      row.state = row.state.toUpperCase();

      return {
        year: +row.year,
        make: row.make,
        model: row.model,
        trim: row.trim,
        body: row.body,
        transmission: row.transmission,
        vin: row.vin,
        state: row.state,
        condition: +row.condition,
        odometer: +row.odometer,
        color: row.color,
        interior: row.interior,
        seller: row.seller,
        mmr: +row.mmr,
        sellingprice: +row.sellingprice,
        saledate: formattedDate,
      };
    });

    return data.filter((row): row is CarData => row !== null);
  } catch (error) {
    console.error('Error loading CSV data:', error);
    return [];
  }
}
