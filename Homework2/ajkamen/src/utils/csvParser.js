import * as d3 from 'd3'

export function parseCSV(csv) {
  return d3.csvParse(csv)
}
