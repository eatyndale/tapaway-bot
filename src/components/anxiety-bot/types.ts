export type ChatState = 
  | 'questionnaire' 
  | 'greeting-intensity'
  | 'conversation' 
  | 'conversation-deepening' 
  | 'gathering-intensity' 
  | 'tearless-setup'
  | 'setup' 
  | 'tapping-point' 
  | 'tapping-breathing' 
  | 'post-tapping' 
  | 'quiet-integration'
  | 'advice' 
  | 'complete';

export type ReminderPhraseType = 'acknowledging' | 'partial-release' | 'full-release';
export type SessionType = 'traditional' | 'tearless' | 'mixed';

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
  isDeepening?: boolean;
  deepeningAttempts?: number;
  totalRoundsWithoutReduction?: number;
  // New fields for revised logic
  isTearlessTrauma?: boolean;
  peakSuds?: number;
  supportContacted?: boolean;
  quietIntegrationUsed?: boolean;
  sessionType?: SessionType;
  highSudsRounds?: number; // Tracks consecutive rounds at SUDS 8-10
}

export interface Message {
  id: string;
  type: 'bot' | 'user' | 'system';
  content: string;
  timestamp: Date;
  sessionId?: string;
}
