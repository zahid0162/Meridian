export type ModelId = 'Qwen/Qwen3-8B' | 'Qwen/Qwen3.8-2.4T-A95B' | 'gemini-4-hydrogen';

export type ProfileRelationship = 'self' | 'child' | 'dependent';

export type PredictionCategoryId =
  | 'personal_development'
  | 'city_hometown'
  | 'country_analysis'
  | 'business_intelligence';

export interface SubjectGrade {
  subject: string;
  score: number;
}

export interface ProfileBasic {
  name: string;
  age: number | null;
  gender: string;
  country: string;
  city: string;
  languages: string[];
}

export interface ProfileEducation {
  currentLevel: string;
  institution: string;
  overallGrade: string;
  subjectGrades: SubjectGrade[];
  favoriteSubjects: string[];
  weakSubjects: string[];
  exceptionalSubjects: string[];
  achievements: string[];
}

export interface ProfileInterests {
  hobbies: string[];
  interests: string[];
  favoriteActivities: string[];
  sports: string[];
  technicalInterests: string[];
  creativeInterests: string[];
  socialActivities: string[];
  goalsAmbitions: string;
}

export interface ProfileSkills {
  existingSkills: string[];
  technicalSkills: string[];
  communicationSkills: string;
  leadershipActivities: string[];
  problemSolving: string;
  extracurriculars: string[];
  volunteering: string[];
  otherAchievements: string[];
}

export interface ProfileBackground {
  familyBackground: string;
  parentsProfessions: string;
  familyEducation: string;
  availableResources: string;
  financialCircumstances: string;
}

export interface PersonalProfile {
  id: string;
  ownerId: string;
  relationship: ProfileRelationship;
  parentalConsentConfirmed: boolean;
  basic: ProfileBasic;
  education: ProfileEducation;
  interests: ProfileInterests;
  skills: ProfileSkills;
  background: ProfileBackground;
  completenessScore: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ProfileSnapshot {
  relationship: ProfileRelationship;
  basic: ProfileBasic;
  education: ProfileEducation;
  interests: ProfileInterests;
  skills: ProfileSkills;
  background: ProfileBackground;
  completenessScore: number;
}

export interface StrengthItem {
  label: string;
  score: number;
  evidence: string;
}

export interface WeaknessItem {
  label: string;
  impact: string;
  mitigation: string;
}

export interface SubjectMetric {
  subject: string;
  score: number;
  benchmark: number;
}

export interface InterestDistributionItem {
  domain: string;
  affinity: number;
}

export interface SkillDimension {
  skill: string;
  level: number;
  target: number;
}

export interface CareerRecommendation {
  title: string;
  suitabilityScore: number;
  reasoning: string;
  requiredSkills: string[];
  educationalPathways: string[];
  degreesCertifications: string[];
  challenges: string[];
  countryOpportunities: string;
  futureTrends: string;
  estimatedSalaryRange: string;
  shortTermPlan: string[];
  longTermPlan: string[];
}

export interface RoadmapMilestone {
  horizon: 'Short-Term' | 'Medium-Term' | 'Long-Term';
  timeframe: string;
  title: string;
  actions: string[];
  category: string;
}

export interface EpistemicMarkers {
  verifiedFacts: string[];
  assumptions: string[];
  aiForecasts: string[];
}

export interface SuitabilityDelta {
  career: string;
  previousScore: number;
  currentScore: number;
}

export interface HistoricalComparison {
  previousAssessmentId: string;
  previousDateLabel: string;
  previousPrimaryCareer: string;
  currentPrimaryCareer: string;
  interestChanges: string[];
  academicChanges: string[];
  newlyDevelopedSkills: string[];
  predictionsStillRelevant: string[];
  predictionsNoLongerSupported: string[];
  newlyIdentifiedOpportunities: string[];
  suitabilityDeltas: SuitabilityDelta[];
}

export interface CareerAssessment {
  id: string;
  ownerId: string;
  profileId: string;
  title: string;
  modelVersion: string;
  providerUsed: string;
  profileSnapshot: ProfileSnapshot;
  dataSufficiency: {
    status: 'sufficient' | 'partial' | 'insufficient';
    confidenceNote: string;
    missingInformation: string[];
  };
  summaryAnalysis: string;
  strengths: StrengthItem[];
  weaknesses: WeaknessItem[];
  academicAnalysis: {
    summary: string;
    subjectMetrics: SubjectMetric[];
  };
  interestAnalysis: {
    summary: string;
    distribution: InterestDistributionItem[];
  };
  skillAssessment: {
    summary: string;
    dimensions: SkillDimension[];
  };
  primaryRecommendation: CareerRecommendation;
  alternativeRecommendations: CareerRecommendation[];
  roadmapMilestones: RoadmapMilestone[];
  epistemicMarkers: EpistemicMarkers;
  comparedWithAssessmentId: string;
  historicalComparison: HistoricalComparison | null;
  createdAt?: unknown;
}

export interface PredictionDimension {
  label: string;
  score: number;
  outlook: string;
  rationale: string;
}

export interface PredictionOpportunity {
  title: string;
  horizon: string;
  potentialImpact: string;
  prerequisites: string[];
}

export interface PredictionRisk {
  title: string;
  severity: 'Low' | 'Moderate' | 'High';
  mitigation: string;
}

export interface TimelineScenario {
  horizon: string;
  scenarioTitle: string;
  description: string;
}

export interface FuturePrediction {
  id: string;
  ownerId: string;
  profileId: string;
  category: PredictionCategoryId;
  subjectTitle: string;
  targetLocation: {
    country: string;
    city: string;
    focusSector: string;
  };
  inputContext: string;
  modelVersion: string;
  providerUsed: string;
  executiveSummary: string;
  keyDimensions: PredictionDimension[];
  opportunities: PredictionOpportunity[];
  risksAndChallenges: PredictionRisk[];
  timelineScenarios: TimelineScenario[];
  verifiedFacts: string[];
  assumptions: string[];
  aiForecasts: string[];
  dataLimitations: string;
  createdAt?: unknown;
}

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  parentalConsentAccepted: boolean;
  preferredModel: ModelId;
  createdAt?: unknown;
  updatedAt?: unknown;
}
