// src/components/Dashboard/index.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { isEmpty } from 'lodash';
import { ComponentSize, Margin } from '../../types';
import WorldMapView from './WorldMapView';
import MedalTimeline from './MedalTimeline';
import MedalDetailsView from './MedalDetailsView';

import './Dashboard.css';

interface MedalData {
  country_code: string;
  country: string;
  country_long: string;
  "Gold Medal": number;
  "Silver Medal": number;
  "Bronze Medal": number;
  Total: number;
}

interface DetailedMedal {
  medal_type: string;
  medal_date: string;
  name: string;
  discipline: string;
  event: string;
  country_code: string;
  country: string;
}

export default function MedalDashboard() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 800, height: 600 });
  const [medalData, setMedalData] = useState<MedalData[]>([]);
  const [detailedMedals, setDetailedMedals] = useState<DetailedMedal[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const margin: Margin = { top: 40, right: 20, bottom: 40, left: 60 };

  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);
  useResizeObserver({ ref: dashboardRef, onResize });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [medalResponse, detailResponse] = await Promise.all([
          fetch('/data/medals_total.csv'),
          fetch('/data/medals.csv')
        ]);

        if (!medalResponse.ok || !detailResponse.ok) {
          throw new Error('Failed to load data');
        }

        const medalText = await medalResponse.text();
        const detailText = await detailResponse.text();

        const processedMedalData = d3.csvParse(medalText, d => ({
          country_code: d.country_code,
          country: d.country,
          country_long: d.country_long,
          "Gold Medal": +d["Gold Medal"],
          "Silver Medal": +d["Silver Medal"],
          "Bronze Medal": +d["Bronze Medal"],
          Total: +d.Total
        })) as MedalData[];

        const processedDetailData = d3.csvParse(detailText, d => ({
          medal_type: d.medal_type,
          medal_date: d.medal_date,
          name: d.name,
          discipline: d.discipline,
          event: d.event,
          country_code: d.country_code,
          country: d.country
        })) as DetailedMedal[];

        setMedalData(processedMedalData);
        setDetailedMedals(processedDetailData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const getCountryMedals = (countryCode: string) => {
    return detailedMedals.filter(m => m.country_code === countryCode);
  };

  return (
    <div ref={dashboardRef} className="dashboard-container">
      <div className="dashboard-header">
        <h1>Olympic Medals Dashboard</h1>
        <h2>Paris 2024 Olympic Games Medal Tracker</h2>
      </div>

      <div className="dashboard-grid">
        {/* Map View - Takes full height, half width */}
        <div className="map-section">
          <WorldMapView
            data={medalData}
            size={{
              width: size.width / 2,
              height: size.height
            }}
            margin={margin}
            onCountrySelect={setSelectedCountry}
          />
        </div>

        {/* Right side section with Timeline and Details */}
        <div className="right-section">
          {/* Timeline View */}
          <div className="timeline-section">
            <MedalTimeline
              data={selectedCountry ? getCountryMedals(selectedCountry) : detailedMedals}
              size={{
                width: size.width / 2,
                height: size.height / 2 - 20
              }}
              margin={margin}
            />
          </div>

          {/* Details View */}
          <div className="details-section">
            <MedalDetailsView
              countryData={medalData.find(d => d.country_code === selectedCountry)}
              detailedData={selectedCountry ? getCountryMedals(selectedCountry) : []}
              size={{
                width: size.width / 2,
                height: size.height / 2 - 20
              }}
              margin={margin}
            />
          </div>
        </div>
      </div>
    </div>
  );
}