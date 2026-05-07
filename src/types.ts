export enum Theme {
  MidnightAxiom = 'midnight-axiom',
  SolarCalculus = 'solar-calculus',
  MatrixProtocol = 'matrix-protocol',
}

export enum Difficulty {
  Elementary = 'elementary',
  Middle = 'middle',
  HighSchool = 'high_school',
  Undergraduate = 'undergraduate',
  Graduate = 'graduate',
  Research = 'research',
}

export interface SolveStep {
  step_number: number;
  title: string;
  latex: string;
  plain_english: string;
}

export interface SolveResult {
  id?: string;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  final_answer: string;
  final_answer_latex: string;
  problem_summary: string;
  steps: SolveStep[];
  has_graph: boolean;
  graph_function: string | null;
  createdAt?: any;
  userId?: string;
}
