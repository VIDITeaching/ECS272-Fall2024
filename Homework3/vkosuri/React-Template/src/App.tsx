import React, { useState, useCallback } from 'react';
import BarChart from './components/BarChart';
import PieChart from './components/PieChart';
import SankeyChart from './components/SankeyChart';
import { ChartProps, FilterState, HoverState, NodeData, SankeyProps } from './types';
import './style.css';

interface AppProps {}

const App: React.FC<AppProps> = () => {
  const [filters, setFilters] = useState<FilterState>({
    selectedAge: null,
    selectedCondition: null,
    selectedTreatment: null
  });

  const [hoverState, setHoverState] = useState<HoverState>({
    element: null
  });

  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'sankey' | 'bar' | 'pie'>('sankey');

  const handleSankeySelect = useCallback((node: NodeData): void => {
    setIsTransitioning(true);
   
    setFilters(prev => {
      const newFilters = { ...prev };
      if (node.category === 'age') {
        newFilters.selectedAge = prev.selectedAge === node.name ? null : node.name;
        setActiveView('bar');
      } else if (node.category === 'condition') {
        newFilters.selectedCondition = prev.selectedCondition === node.name ? null : node.name;
        setActiveView('pie');
      } else if (node.category === 'treatment') {
        newFilters.selectedTreatment = prev.selectedTreatment === node.name ? null : node.name;
        setActiveView('bar');
      }
      return newFilters;
    });

    setTimeout(() => setIsTransitioning(false), 500);
  }, []);

  const handleHover = useCallback((
    element: NonNullable<HoverState['element']> | null,
    event: React.MouseEvent
  ): void => {
    if (element) {
      setHoverState({
        element: {
          ...element,
          coordinates: { x: event.clientX, y: event.clientY }
        }
      });
    } else {
      setHoverState({ element: null });
    }
  }, []);

  const commonChartProps: Omit<ChartProps, 'onNodeSelect'> = {
    filters,
    onElementHover: handleHover,
    isTransitioning
  };

  const sankeyProps: SankeyProps = {
    ...commonChartProps,
    onNodeSelect: handleSankeySelect
  };

  const resetFilters = useCallback((): void => {
    setIsTransitioning(true);
    setFilters({
      selectedAge: null,
      selectedCondition: null,
      selectedTreatment: null
    });
    setActiveView('sankey');
    setTimeout(() => setIsTransitioning(false), 500);
  }, []);

  const renderFilterTag = useCallback((
    type: keyof FilterState,
    label: string,
    value: string | null
  ): JSX.Element | null => {
    if (!value) return null;
   
    return (
      <div
        className="filter-tag"
        onMouseEnter={() => {
          handleHover({
            type: type.replace('selected', '').toLowerCase() as any,
            name: value,
            value: 0,
            coordinates: { x: 0, y: 0 }
          }, {} as React.MouseEvent)
        }}
        onMouseLeave={() => handleHover(null, {} as React.MouseEvent)}
      >
        <span className="tag-label">{label}:</span>
        <span className="tag-value">{value}</span>
        <button
          onClick={() => {
            setIsTransitioning(true);
            setFilters(prev => ({ ...prev, [type]: null }));
            setTimeout(() => setIsTransitioning(false), 500);
          }}
          className="remove-tag"
        >
          ×
        </button>
      </div>
    );
  }, [handleHover]);

  return (
    <div className="dashboard">
      {/* Header - 5% */}
      <div className="dashboard-header">
        <h1>Student Mental Health Dashboard - Analysis of mental health conditions among students</h1>
       
        <div className="active-filters">
          {(filters.selectedAge || filters.selectedCondition || filters.selectedTreatment) && (
            <>
              {renderFilterTag('selectedAge', 'Age', filters.selectedAge)}
              {renderFilterTag('selectedCondition', 'Condition', filters.selectedCondition)}
              {renderFilterTag('selectedTreatment', 'Treatment', filters.selectedTreatment)}
             
              <button
                className="reset-filters"
                onClick={resetFilters}
              >
                Reset All
              </button>
            </>
          )}

          {activeView !== 'sankey' && (
            <button
              className="back-to-overview"
              onClick={resetFilters}
            >
              ← Back to Overview
            </button>
          )}
        </div>
      </div>

      {/* Main Content - 95% */}
      <div className="dashboard-layout">
        {/* Sankey or Active Chart - 61% */}
        <div className="top-section">
          <div className="chart-container">
            <h2>
              {activeView === 'sankey' ? 'Student Mental Health Overview: Sankey Diagram' :
               activeView === 'bar' ? 'Treatment Distribution Analysis' :
               'Mental Health Condition Distribution'}
            </h2>
            <div className={`chart-wrapper sankey-wrapper ${isTransitioning ? 'transitioning' : ''}`}>
              {activeView === 'sankey' && <SankeyChart {...sankeyProps} />}
              {activeView === 'bar' && <BarChart {...commonChartProps} />}
              {activeView === 'pie' && <PieChart {...commonChartProps} />}
            </div>
          </div>
        </div>

        {/* Bottom Section - 34% total */}
        {activeView === 'sankey' && (
          <div className="bottom-section">
            <div className="chart-container half-width">
              <h2>Mental Health by Academic Performance: Bar Chart</h2>
              <div className={`chart-wrapper bar-wrapper ${isTransitioning ? 'transitioning' : ''}`}>
                <BarChart {...commonChartProps} />
              </div>
            </div>
            <div className="chart-container half-width">
              <h2>Mental Health by Gender: Pie Chart</h2>
              <div className={`chart-wrapper pie-wrapper ${isTransitioning ? 'transitioning' : ''}`}>
                <PieChart {...commonChartProps} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {hoverState.element && (
        <div
          className="tooltip"
          style={{
            position: 'fixed',
            left: hoverState.element.coordinates.x + 10,
            top: hoverState.element.coordinates.y - 10,
            transform: 'translate(0, -100%)',
          }}
        >
          <div className="tooltip-content">
            <div className="tooltip-header">
              <strong>{hoverState.element.name}</strong>
            </div>
            <div className="tooltip-body">
              {hoverState.element.value && (
                <div className="stat-row">
                  <span>Count:</span>
                  <span>{hoverState.element.value}</span>
                </div>
              )}
              {hoverState.element.percentage && (
                <div className="stat-row">
                  <span>Percentage:</span>
                  <span>{hoverState.element.percentage.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;