export type LearningModeId =
  | 'report'
  | 'research'
  | 'idea'
  | 'problem'
  | 'debate'
  | 'plan';

export type CoachActionType =
  | 'chat'
  | 'review_draft'
  | 'similar_problem'
  | 'counter_argument';

export interface GroundSource {
  title: string;
  uri: string;
}

export interface CoachResponse {
  isLocked: boolean;
  lockReason: string;
  moralGuidance: string;
  coachingType: string;
  mainHint: string;
  questionsForStudent: string[];
  keywordsToVerify: string[];
  practiceProblem: string;
  draftFeedbackPoints: string[];
  sources?: GroundSource[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  mode: LearningModeId;
  actionType?: CoachActionType;
  coachData?: CoachResponse;
  error?: string;
}

export interface ModeExamplePrompt {
  label: string;
  text: string;
  isCheatingDemo?: boolean;
}

export interface LearningModeConfig {
  id: LearningModeId;
  name: string;
  shortName: string;
  tagline: string;
  aiRole: string;
  guardrail: string;
  placeholder: string;
  draftLabel: string;
  draftPlaceholder: string;
  examples: ModeExamplePrompt[];
}

export interface SessionStats {
  studentTurns: number;
  questionsAnswered: number;
  verifiedKeywords: string[];
  lockInterventions: number;
  draftReviews: number;
}
