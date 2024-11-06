// src/components/Dashboard/MedalDetailsView.tsx
import React from 'react';
import * as d3 from 'd3';
import { ComponentSize, Margin } from '../types';

interface MedalDetailsProps {
  countryData?: any;
  detailedData: any[];
  size: ComponentSize;
  margin: Margin;
}

const MedalDetailsView: React.FC<MedalDetailsProps> = ({
  countryData,
  detailedData,
  size,
  margin
}) => {
  if (!countryData) {
    return (
      <div className="medal-details-empty">
        <p>Select a country to view medal details</p>
      </div>
    );
  }

  // Group medals by discipline
  const medalsByDiscipline = d3.group(detailedData, d => d.discipline);
  const topDisciplines = Array.from(medalsByDiscipline)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5);

  return (
    <div className="medal-details">
      <div className="country-header">
        <h3>{countryData.country}</h3>
        <span className="total-medals">Total Medals: {countryData.Total}</span>
      </div>

      <div className="medal-counts">
        <div className="medal-count gold">
          <span className="count">{countryData["Gold Medal"]}</span>
          <span className="label">Gold</span>
        </div>
        <div className="medal-count silver">
          <span className="count">{countryData["Silver Medal"]}</span>
          <span className="label">Silver</span>
        </div>
        <div className="medal-count bronze">
          <span className="count">{countryData["Bronze Medal"]}</span>
          <span className="label">Bronze</span>
        </div>
      </div>

      <div className="top-disciplines">
        <h4>Top Disciplines</h4>
        {topDisciplines.map(([discipline, medals]) => (
          <div key={discipline} className="discipline-item">
            <span className="discipline-name">{discipline}</span>
            <span className="discipline-count">{medals.length}</span>
          </div>
        ))}
      </div>

      <div className="recent-medals">
        <h4>Recent Medals</h4>
        <div className="medals-list">
          {detailedData
            .sort((a, b) => new Date(b.medal_date).getTime() - new Date(a.medal_date).getTime())
            .slice(0, 5)
            .map((medal, idx) => (
              <div key={idx} className="medal-item">
                <div className={`medal-type ${medal.medal_type.toLowerCase().replace(' medal', '')}`}>
                  {medal.medal_type.split(' ')[0]}
                </div>
                <div className="medal-details">
                  <div className="medal-event">{medal.event}</div>
                  <div className="medal-name">{medal.name}</div>
                  <div className="medal-date">
                    {new Date(medal.medal_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MedalDetailsView;