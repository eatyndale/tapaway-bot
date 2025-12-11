export type ChatState = 'questionnaire' | 'conversation' | 'gathering-intensity' | 'setup' | 'tapping-point' | 'tapping-breathing' | 'post-tapping' | 'advice' | 'complete';

export type ReminderPhraseType = 'acknowledging' | 'partial-release' | 'full-release';
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
  roundsWithoutReduction?: number;
  previousIntensities?: number[];
  reminderPhraseType?: ReminderPhraseType;
  deepeningLevel?: number;
}

export interface Message {
  id: string;
  type: 'bot' | 'user' | 'system';
  content: string;
  timestamp: Date;
  sessionId?: string;
}
