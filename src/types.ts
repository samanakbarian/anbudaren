export enum SubscriptionTier {
  BASIC = "BASIC",
  PRO = "PRO",
  ENTERPRISE = "ENTERPRISE",
}

export interface IngestedDocument {
  id: string;
  name: string;
  type: "cv" | "presentation" | "past_bid";
  content: string;
  size: string;
}

export interface ConsultantProfile {
  name: string;
  roles: string[];
  skills: string[];
  bio: string;
}

export interface ToneOfVoiceProfile {
  styleDescription: string;
  clonedDirectives: string[];
  typicalPhrases: string[];
}

export interface CompanyProfile {
  companyName: string;
  coreCompetencies: string[];
  consultants: ConsultantProfile[];
  toneOfVoice: ToneOfVoiceProfile;
  pastWinningBiddingThemes: string[];
}

export interface TenderRequirement {
  id: string;
  text: string;
}

export interface Tender {
  id: string;
  title: string;
  authority: string;
  description: string;
  budget: string;
  deadline: string;
  category: string;
  requirements: TenderRequirement[];
}

export interface RequirementMatch {
  requirementIndex: number;
  satisfiesPercent: number; // 0, 50, 90, 100
  justification: string;
  sourceCVs: string[];
}

export interface MatchResult {
  winProbability: number;
  reasoning: string;
  requirementsChecklist: RequirementMatch[];
  strengths: string[];
  risks: string[];
}

export interface BidDraft {
  [requirementId: string]: {
    text: string;
    isGenerating?: boolean;
    isRefining?: boolean;
    history?: string[];
  };
}

export interface BidSnapshot {
  id: string;
  tenderId: string;
  label: string;
  timestamp: string;
  author: string;
  drafts: {
    [requirementId: string]: string; // requirementId to text content mapping
  };
}

export interface AppState {
  currentTier: SubscriptionTier;
  documents: IngestedDocument[];
  profile: CompanyProfile | null;
  isAnalyzing: boolean;
  selectedTenderId: string | null;
  matchResults: { [tenderId: string]: MatchResult };
  isCalculatingMatch: boolean;
  bidDraftsByTender: { [tenderId: string]: BidDraft };
}
