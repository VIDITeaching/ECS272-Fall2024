import { create } from 'zustand';
import { Student, StudyTimeData, ScatterData, SankeyData, ParallelPlotData } from '../types';

interface DashboardState {
  students: Student[];
  studyTimeData: StudyTimeData[];
  scatterData: ScatterData[];
  sankeyData: SankeyData;
  loading: boolean;
  parallelPlotData: ParallelPlotData[];
  setStudents: (students: Student[]) => void;
  setStudyTimeData: (data: StudyTimeData[]) => void;
  setScatterData: (data: ScatterData[]) => void;
  setSankeyData: (data: SankeyData) => void;
  setLoading: (loading: boolean) => void;
  setParallelPlotData: (data: ParallelPlotData[]) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  students: [],
  studyTimeData: [],
  scatterData: [],
  sankeyData: { nodes: [], links: [] },
  loading: true,
  parallelPlotData: [],
  setStudents: (students) => set({ students }),
  setStudyTimeData: (data) => set({ studyTimeData: data }),
  setScatterData: (data) => set({ scatterData: data }),
  setSankeyData: (data) => set({ sankeyData: data }),
  setLoading: (loading) => set({ loading }),
  setParallelPlotData: (data) => set({ parallelPlotData: data }),
}));