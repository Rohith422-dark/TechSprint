
export enum Domain {
  SOFTWARE = 'Software Development',
  DATA = 'Data Science & Analytics',
  AI = 'Artificial Intelligence',
  CYBERSECURITY = 'Cybersecurity',
  CLOUD_DEVOPS = 'Cloud & DevOps',
  PRODUCT_DESIGN = 'Product & Design',
  BLOCKCHAIN = 'Blockchain & Web3',
  BUSINESS_TECH = 'Business & Management'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string;
  avatar: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  category: string;
}

export interface HeatmapPoint {
  x: string; // The Skill/Topic Group
  y: string; // The Complexity Level (e.g., Intro, Advanced, Mastery)
  value: number; // 0-100 score of alignment
}

export interface AnalysisResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  outdatedTopics: string[];
  breakdown: {
    relevance: number;
    depth: number;
    modernity: number;
  };
  explanation: string;
  heatmapData: HeatmapPoint[];
  generatedDiagramUrl?: string;
}

export interface Resource {
  title: string;
  url: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  type: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface CareerCompassData {
  roadmap: { title: string; description: string; duration: string }[];
  tasks: { title: string; description: string; difficulty: string }[];
  test: QuizQuestion[];
}

export interface AppState {
  step: 'login' | 'domain' | 'upload' | 'analysis' | 'guidance' | 'profile' | 'career_compass';
  user: User | null;
  domain: Domain | null;
  role: string;
  industrySkills: Skill[];
  syllabusText: string;
  syllabusFile: { data: string; mimeType: string; name: string } | null;
  analysis: AnalysisResult | null;
  validatedSkills: string[];
  activeSessionId: string | null;
  loading: boolean;
  loadingMessage: string;
  careerCompassData?: CareerCompassData;
}
