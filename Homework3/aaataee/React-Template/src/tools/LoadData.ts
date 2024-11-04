// LoadData.ts
import * as d3 from 'd3';
import {VehicleData} from '../types.ts'

export const LoadData = async (): Promise<VehicleData[]> => {
  try {
    const csvData = await d3.csv('/data/car_prices.csv', d => ({
      make: d['make'] || '',
      year: +d['year'],
      sellingprice: +d['sellingprice'],
      mmr: +d['mmr'],
      profit: +d['sellingprice'] - +d['mmr'],
      condition: +d['condition'],
      odometer: +d['odometer'],
    }));

    const allData = (csvData as VehicleData[]).filter(
      d => d.make && d.year >= 2005 && d.sellingprice > 0 && d.mmr > 0 && d.condition > 0 && d.odometer > 0
    );

    return allData.slice(0, allData.length / 4);
  } catch (error) {
    console.error('Error loading CSV file:', error);
    return [];
  }
};
