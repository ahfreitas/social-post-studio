export interface PostScore {
  clarity: number;
  engagement: number;
  authenticity: number;
  provocation: number;
  claritySuggestion: string;
  engagementSuggestion: string;
  authenticitySuggestion: string;
  provocationSuggestion: string;
  overallDiagnosis: string;
}

export interface GeneratedPost {
  id: string;
  topic: string;
  tone: string;
  audience: string;
  size: string;
  networks: string[];
  language: string;
  content: string;
  hashtags: string[];
  sources: string[];
  trends: string[];
  imagePrompt: string;
  score?: PostScore;
  createdAt: string;
}
