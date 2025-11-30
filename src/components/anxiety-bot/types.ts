
export type ChatState = 'questionnaire' | 'conversation' | 'gathering-intensity' | 'tapping-point' | 'tapping-breathing' | 'post-tapping' | 'advice' | 'complete';

export interface QuestionnaireResponse {
  question: number;
  answer: number; // 0-3 scale
}

export interface QuestionnaireSession {
  responses: QuestionnaireResponse[];
  totalScore: number;
  severity: 'Minimal' | 'Mild' | 'Moderate' | 'Moderately severe' | 'Severe';
  isComplete: boolean;
}

export interface ChatSession {
  id: string;
  timestamp: Date;
  problem: string;
  feeling: string;
  bodyLocation: string;
  initialIntensity: number;
  currentIntensity: number;
  round: number;
  setupStatements: string[];
  reminderPhrases: string[];
  isComplete: boolean;
}

export interface Message {
  id: string;
  type: 'bot' | 'user' | 'system';
  content: string;
  timestamp: Date;
  sessionId?: string;
}
