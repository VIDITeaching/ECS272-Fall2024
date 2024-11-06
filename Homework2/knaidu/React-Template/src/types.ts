export interface Student {
  school: string;
  sex: string;
  age: number;
  studytime: number;
  failures: number;
  absences: number;
  G1: number;
  G2: number;
  G3: number;
}

export interface StudyTimeData {
  studytime: number;
  averageGrade: number;
}

export interface ScatterData {
  absences: number;
  averageGrade: number;
  school: string;
}

export interface SankeyNode {
  name: string;
  category: 'schools' | 'gender' | 'grades';
  subject?: 'Math' | 'Por';
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: {
    source: number;
    target: number;
    value: number;
  }[];
}

interface Link extends SankeyLink<Node, Link> {
  source: number | Node;
  target: number | Node;
  value: number;
  width?: number;
}

export interface ParallelPlotData {
  G1: number;
  G2: number;
  G3: number;
  failures: number;
  studytime: number;
  absences: number;
}