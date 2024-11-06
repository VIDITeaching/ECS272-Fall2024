// src/components/Dashboard/DataProcessor.ts
import * as d3 from 'd3';

export interface MedalTotal {
  country_code: string;
  country: string;
  country_long: string;
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
  total: number;
}

export interface DetailedMedal {
  medal_type: string;
  medal_code: string;
  medal_date: string;
  name: string;
  gender: string;
  discipline: string;
  event: string;
  event_type: string;
  country_code: string;
  country: string;
  country_long: string;
}

export interface ProcessedData {
  medalsByCountry: Map<string, MedalTotal>;
  medalsByDiscipline: Map<string, number>;
  totalMedals: MedalTotal[];
  detailedMedals: DetailedMedal[];
}

export async function processMedalData(medalsTotal: string, medalsDetailed: string): Promise<ProcessedData> {
  try {
    // Parse the CSV strings into arrays of objects
    const totalData = d3.csvParse(medalsTotal, d => ({
      country_code: d.country_code,
      country: d.country,
      country_long: d.country_long,
      goldMedals: +d['Gold Medal'],
      silverMedals: +d['Silver Medal'],
      bronzeMedals: +d['Bronze Medal'],
      total: +d.Total
    })) as MedalTotal[];

    const detailedData = d3.csvParse(medalsDetailed, d => ({
      medal_type: d.medal_type,
      medal_code: d.medal_code,
      medal_date: d.medal_date,
      name: d.name,
      gender: d.gender,
      discipline: d.discipline,
      event: d.event,
      event_type: d.event_type,
      country_code: d.country_code,
      country: d.country,
      country_long: d.country_long
    })) as DetailedMedal[];

    // Create maps for quick lookups
    const medalsByCountry = new Map(
      totalData.map(d => [d.country_code, d])
    );

    // Count medals by discipline
    const medalsByDiscipline = new Map(
      Array.from(d3.group(detailedData, d => d.discipline))
        .map(([key, values]) => [key, values.length])
    );

    return {
      medalsByCountry,
      medalsByDiscipline,
      totalMedals: totalData,
      detailedMedals: detailedData
    };
  } catch (error) {
    console.error('Error processing medal data:', error);
    throw error;
  }
}

export function getMedalsForCountry(data: ProcessedData, countryCode: string) {
  return {
    totals: data.medalsByCountry.get(countryCode),
    details: data.detailedMedals.filter(d => d.country_code === countryCode)
  };
}

export function getTopCountries(data: ProcessedData, count: number = 10) {
  return [...data.medalsByCountry.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, count);
}