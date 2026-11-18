import type {
  CareerAssessment,
  CareerRecommendation,
  FuturePrediction,
  PersonalProfile,
  ProfileBackground,
  ProfileBasic,
  ProfileEducation,
  ProfileInterests,
  ProfileRelationship,
  ProfileSkills,
  ProfileSnapshot,
  SubjectGrade,
} from '../types/intelligence';

export function generateSafeId(prefix = 'id'): string {
  const raw =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/[^a-zA-Z0-9_-]/g, '')
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${raw}`.slice(0, 64);
}

function clampString(value: unknown, maxLen: number, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  return value.trim().slice(0, maxLen);
}

function clampStringList(values: unknown, maxItems: number, maxItemLen = 120): string[] {
  if (!Array.isArray(values)) return [];
  const cleaned: string[] = [];
  for (const item of values) {
    if (typeof item === 'string') {
      const trimmed = item.trim().slice(0, maxItemLen);
      if (trimmed.length > 0 && !cleaned.includes(trimmed)) {
        cleaned.push(trimmed);
      }
    }
    if (cleaned.length >= maxItems) break;
  }
  return cleaned;
}

function clampScore(val: unknown, fallback = 50): number {
  const n = typeof val === 'number' && Number.isFinite(val) ? Math.round(val) : fallback;
  return Math.max(0, Math.min(100, n));
}

export function createEmptyProfileDraft(): Omit<PersonalProfile, 'id' | 'ownerId'> {
  return {
    relationship: 'self',
    parentalConsentConfirmed: true,
    basic: {
      name: '',
      age: null,
      gender: '',
      country: '',
      city: '',
      languages: [],
    },
    education: {
      currentLevel: '',
      institution: '',
      overallGrade: '',
      subjectGrades: [],
      favoriteSubjects: [],
      weakSubjects: [],
      exceptionalSubjects: [],
      achievements: [],
    },
    interests: {
      hobbies: [],
      interests: [],
      favoriteActivities: [],
      sports: [],
      technicalInterests: [],
      creativeInterests: [],
      socialActivities: [],
      goalsAmbitions: '',
    },
    skills: {
      existingSkills: [],
      technicalSkills: [],
      communicationSkills: '',
      leadershipActivities: [],
      problemSolving: '',
      extracurriculars: [],
      volunteering: [],
      otherAchievements: [],
    },
    background: {
      familyBackground: '',
      parentsProfessions: '',
      familyEducation: '',
      availableResources: '',
      financialCircumstances: '',
    },
    completenessScore: 0,
  };
}

export function calculateProfileCompleteness(
  profile: Pick<PersonalProfile, 'basic' | 'education' | 'interests' | 'skills' | 'background'>
): number {
  const checks: boolean[] = [
    Boolean(profile.basic.name.trim()),
    profile.basic.age !== null,
    Boolean(profile.basic.country.trim()),
    Boolean(profile.basic.city.trim()),
    profile.basic.languages.length > 0,
    Boolean(profile.education.currentLevel.trim()),
    Boolean(profile.education.overallGrade.trim()) || profile.education.subjectGrades.length > 0,
    profile.education.favoriteSubjects.length > 0 || profile.education.exceptionalSubjects.length > 0,
    profile.interests.hobbies.length > 0 || profile.interests.interests.length > 0,
    profile.interests.technicalInterests.length > 0 || profile.interests.creativeInterests.length > 0,
    Boolean(profile.interests.goalsAmbitions.trim()),
    profile.skills.existingSkills.length > 0 || profile.skills.technicalSkills.length > 0,
    Boolean(profile.skills.communicationSkills.trim()) || Boolean(profile.skills.problemSolving.trim()),
    profile.skills.extracurriculars.length > 0 || profile.skills.leadershipActivities.length > 0,
    Boolean(profile.background.availableResources.trim()) || Boolean(profile.background.familyBackground.trim()),
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

export function sanitizeProfilePayload(
  raw: Omit<PersonalProfile, 'id' | 'ownerId' | 'completenessScore' | 'createdAt' | 'updatedAt'>
): {
  relationship: ProfileRelationship;
  parentalConsentConfirmed: boolean;
  basic: ProfileBasic;
  education: ProfileEducation;
  interests: ProfileInterests;
  skills: ProfileSkills;
  background: ProfileBackground;
  completenessScore: number;
} {
  const parsedAge =
    typeof raw.basic.age === 'number' && Number.isFinite(raw.basic.age)
      ? Math.max(3, Math.min(120, Math.round(raw.basic.age)))
      : null;

  const basic: ProfileBasic = {
    name: clampString(raw.basic.name, 120, 'Unnamed Profile'),
    age: parsedAge,
    gender: clampString(raw.basic.gender, 60),
    country: clampString(raw.basic.country, 120),
    city: clampString(raw.basic.city, 120),
    languages: clampStringList(raw.basic.languages, 15, 60),
  };

  const subjectGrades: SubjectGrade[] = Array.isArray(raw.education.subjectGrades)
    ? raw.education.subjectGrades
        .filter((sg) => sg && typeof sg.subject === 'string' && sg.subject.trim().length > 0)
        .slice(0, 25)
        .map((sg) => ({
          subject: clampString(sg.subject, 80),
          score: clampScore(sg.score, 75),
        }))
    : [];

  const education: ProfileEducation = {
    currentLevel: clampString(raw.education.currentLevel, 120),
    institution: clampString(raw.education.institution, 200),
    overallGrade: clampString(raw.education.overallGrade, 80),
    subjectGrades,
    favoriteSubjects: clampStringList(raw.education.favoriteSubjects, 20, 80),
    weakSubjects: clampStringList(raw.education.weakSubjects, 20, 80),
    exceptionalSubjects: clampStringList(raw.education.exceptionalSubjects, 20, 80),
    achievements: clampStringList(raw.education.achievements, 20, 140),
  };

  const interests: ProfileInterests = {
    hobbies: clampStringList(raw.interests.hobbies, 20, 80),
    interests: clampStringList(raw.interests.interests, 20, 80),
    favoriteActivities: clampStringList(raw.interests.favoriteActivities, 20, 80),
    sports: clampStringList(raw.interests.sports, 20, 80),
    technicalInterests: clampStringList(raw.interests.technicalInterests, 20, 80),
    creativeInterests: clampStringList(raw.interests.creativeInterests, 20, 80),
    socialActivities: clampStringList(raw.interests.socialActivities, 20, 80),
    goalsAmbitions: clampString(raw.interests.goalsAmbitions, 2000),
  };

  const skills: ProfileSkills = {
    existingSkills: clampStringList(raw.skills.existingSkills, 25, 80),
    technicalSkills: clampStringList(raw.skills.technicalSkills, 25, 80),
    communicationSkills: clampString(raw.skills.communicationSkills, 500),
    leadershipActivities: clampStringList(raw.skills.leadershipActivities, 20, 100),
    problemSolving: clampString(raw.skills.problemSolving, 500),
    extracurriculars: clampStringList(raw.skills.extracurriculars, 20, 100),
    volunteering: clampStringList(raw.skills.volunteering, 20, 100),
    otherAchievements: clampStringList(raw.skills.otherAchievements, 20, 140),
  };

  const background: ProfileBackground = {
    familyBackground: clampString(raw.background.familyBackground, 1200),
    parentsProfessions: clampString(raw.background.parentsProfessions, 600),
    familyEducation: clampString(raw.background.familyEducation, 600),
    availableResources: clampString(raw.background.availableResources, 1200),
    financialCircumstances: clampString(raw.background.financialCircumstances, 800),
  };

  const relationship: ProfileRelationship =
    raw.relationship === 'child' || raw.relationship === 'dependent' ? raw.relationship : 'self';

  const completenessScore = calculateProfileCompleteness({
    basic,
    education,
    interests,
    skills,
    background,
  });

  return {
    relationship,
    parentalConsentConfirmed: Boolean(raw.parentalConsentConfirmed),
    basic,
    education,
    interests,
    skills,
    background,
    completenessScore,
  };
}

function sanitizeCareerRec(rec: Partial<CareerRecommendation> | undefined): CareerRecommendation {
  return {
    title: clampString(rec?.title, 160, 'Recommended Direction'),
    suitabilityScore: clampScore(rec?.suitabilityScore, 70),
    reasoning: clampString(rec?.reasoning, 3000, 'Assessment alignment derived from profile attributes.'),
    requiredSkills: clampStringList(rec?.requiredSkills, 12, 100),
    educationalPathways: clampStringList(rec?.educationalPathways, 10, 220),
    degreesCertifications: clampStringList(rec?.degreesCertifications, 10, 160),
    challenges: clampStringList(rec?.challenges, 8, 220),
    countryOpportunities: clampString(rec?.countryOpportunities, 1200, 'Depends on regional hiring and remote market access.'),
    futureTrends: clampString(rec?.futureTrends, 1200, 'Evolving demand trajectory over the next 5-10 years.'),
    estimatedSalaryRange: clampString(rec?.estimatedSalaryRange, 200, 'Insufficient verified local salary data'),
    shortTermPlan: clampStringList(rec?.shortTermPlan, 8, 220),
    longTermPlan: clampStringList(rec?.longTermPlan, 8, 220),
  };
}

export function buildProfileSnapshot(profile: PersonalProfile): ProfileSnapshot {
  const sanitized = sanitizeProfilePayload(profile);
  return {
    relationship: sanitized.relationship,
    basic: sanitized.basic,
    education: sanitized.education,
    interests: sanitized.interests,
    skills: sanitized.skills,
    background: sanitized.background,
    completenessScore: sanitized.completenessScore,
  };
}

export function sanitizeCareerAssessmentForWrite(
  raw: Omit<CareerAssessment, 'id' | 'ownerId' | 'profileId' | 'profileSnapshot' | 'createdAt'>,
  profile: PersonalProfile
): Omit<CareerAssessment, 'id' | 'ownerId' | 'profileId' | 'createdAt'> {
  return {
    title: clampString(raw.title, 200, `${profile.basic.name} — Career Assessment`),
    modelVersion: clampString(raw.modelVersion, 120, 'Qwen/Qwen3-8B'),
    providerUsed: clampString(raw.providerUsed, 64, 'huggingface-router'),
    profileSnapshot: buildProfileSnapshot(profile),
    dataSufficiency: {
      status:
        raw.dataSufficiency?.status === 'insufficient' || raw.dataSufficiency?.status === 'partial'
          ? raw.dataSufficiency.status
          : 'sufficient',
      confidenceNote: clampString(raw.dataSufficiency?.confidenceNote, 800, 'Assessment grounded in provided profile fields.'),
      missingInformation: clampStringList(raw.dataSufficiency?.missingInformation, 12, 160),
    },
    summaryAnalysis: clampString(raw.summaryAnalysis, 8000, 'Profile synthesis completed.'),
    strengths: Array.isArray(raw.strengths)
      ? raw.strengths.slice(0, 15).map((s) => ({
          label: clampString(s?.label, 120, 'Strength'),
          score: clampScore(s?.score, 75),
          evidence: clampString(s?.evidence, 300),
        }))
      : [],
    weaknesses: Array.isArray(raw.weaknesses)
      ? raw.weaknesses.slice(0, 15).map((w) => ({
          label: clampString(w?.label, 120, 'Area for Growth'),
          impact: clampString(w?.impact, 300),
          mitigation: clampString(w?.mitigation, 300),
        }))
      : [],
    academicAnalysis: {
      summary: clampString(raw.academicAnalysis?.summary, 2000),
      subjectMetrics: Array.isArray(raw.academicAnalysis?.subjectMetrics)
        ? raw.academicAnalysis.subjectMetrics.slice(0, 25).map((m) => ({
            subject: clampString(m?.subject, 80, 'Subject'),
            score: clampScore(m?.score, 70),
            benchmark: clampScore(m?.benchmark, 75),
          }))
        : [],
    },
    interestAnalysis: {
      summary: clampString(raw.interestAnalysis?.summary, 2000),
      distribution: Array.isArray(raw.interestAnalysis?.distribution)
        ? raw.interestAnalysis.distribution.slice(0, 12).map((d) => ({
            domain: clampString(d?.domain, 80, 'Domain'),
            affinity: clampScore(d?.affinity, 65),
          }))
        : [],
    },
    skillAssessment: {
      summary: clampString(raw.skillAssessment?.summary, 2000),
      dimensions: Array.isArray(raw.skillAssessment?.dimensions)
        ? raw.skillAssessment.dimensions.slice(0, 15).map((d) => ({
            skill: clampString(d?.skill, 80, 'Skill'),
            level: clampScore(d?.level, 60),
            target: clampScore(d?.target, 85),
          }))
        : [],
    },
    primaryRecommendation: sanitizeCareerRec(raw.primaryRecommendation),
    alternativeRecommendations: Array.isArray(raw.alternativeRecommendations)
      ? raw.alternativeRecommendations.slice(0, 6).map((r) => sanitizeCareerRec(r))
      : [],
    roadmapMilestones: Array.isArray(raw.roadmapMilestones)
      ? raw.roadmapMilestones.slice(0, 20).map((m) => ({
          horizon:
            m?.horizon === 'Medium-Term' || m?.horizon === 'Long-Term' ? m.horizon : 'Short-Term',
          timeframe: clampString(m?.timeframe, 80, '6-12 Months'),
          title: clampString(m?.title, 160, 'Development Milestone'),
          actions: clampStringList(m?.actions, 8, 220),
          category: clampString(m?.category, 60, 'Skill'),
        }))
      : [],
    epistemicMarkers: {
      verifiedFacts: clampStringList(raw.epistemicMarkers?.verifiedFacts, 15, 280),
      assumptions: clampStringList(raw.epistemicMarkers?.assumptions, 15, 280),
      aiForecasts: clampStringList(raw.epistemicMarkers?.aiForecasts, 15, 280),
    },
    comparedWithAssessmentId: clampString(raw.comparedWithAssessmentId, 128),
    historicalComparison: raw.historicalComparison
      ? {
          previousAssessmentId: clampString(raw.historicalComparison.previousAssessmentId, 128),
          previousDateLabel: clampString(raw.historicalComparison.previousDateLabel, 80, 'Prior Assessment'),
          previousPrimaryCareer: clampString(raw.historicalComparison.previousPrimaryCareer, 160),
          currentPrimaryCareer: clampString(raw.historicalComparison.currentPrimaryCareer, 160),
          interestChanges: clampStringList(raw.historicalComparison.interestChanges, 12, 240),
          academicChanges: clampStringList(raw.historicalComparison.academicChanges, 12, 240),
          newlyDevelopedSkills: clampStringList(raw.historicalComparison.newlyDevelopedSkills, 12, 200),
          predictionsStillRelevant: clampStringList(raw.historicalComparison.predictionsStillRelevant, 12, 240),
          predictionsNoLongerSupported: clampStringList(raw.historicalComparison.predictionsNoLongerSupported, 12, 240),
          newlyIdentifiedOpportunities: clampStringList(raw.historicalComparison.newlyIdentifiedOpportunities, 12, 240),
          suitabilityDeltas: Array.isArray(raw.historicalComparison.suitabilityDeltas)
            ? raw.historicalComparison.suitabilityDeltas.slice(0, 10).map((d) => ({
                career: clampString(d?.career, 120, 'Career'),
                previousScore: clampScore(d?.previousScore, 50),
                currentScore: clampScore(d?.currentScore, 50),
              }))
            : [],
        }
      : null,
  };
}

export function sanitizeFuturePredictionForWrite(
  raw: Omit<FuturePrediction, 'id' | 'ownerId' | 'createdAt'>
): Omit<FuturePrediction, 'id' | 'ownerId' | 'createdAt'> {
  return {
    profileId: clampString(raw.profileId, 128),
    category: raw.category,
    subjectTitle: clampString(raw.subjectTitle, 200, 'Future Intelligence Report'),
    targetLocation: {
      country: clampString(raw.targetLocation?.country, 120),
      city: clampString(raw.targetLocation?.city, 120),
      focusSector: clampString(raw.targetLocation?.focusSector, 160),
    },
    inputContext: clampString(raw.inputContext, 4000),
    modelVersion: clampString(raw.modelVersion, 120, 'Qwen/Qwen3-8B'),
    providerUsed: clampString(raw.providerUsed, 64, 'huggingface-router'),
    executiveSummary: clampString(raw.executiveSummary, 8000, 'Forecast analysis complete.'),
    keyDimensions: Array.isArray(raw.keyDimensions)
      ? raw.keyDimensions.slice(0, 15).map((d) => ({
          label: clampString(d?.label, 120, 'Dimension'),
          score: clampScore(d?.score, 65),
          outlook: clampString(d?.outlook, 80, 'Emerging'),
          rationale: clampString(d?.rationale, 350),
        }))
      : [],
    opportunities: Array.isArray(raw.opportunities)
      ? raw.opportunities.slice(0, 15).map((o) => ({
          title: clampString(o?.title, 160, 'Opportunity'),
          horizon: clampString(o?.horizon, 80, '3-5 Years'),
          potentialImpact: clampString(o?.potentialImpact, 120, 'High'),
          prerequisites: clampStringList(o?.prerequisites, 8, 180),
        }))
      : [],
    risksAndChallenges: Array.isArray(raw.risksAndChallenges)
      ? raw.risksAndChallenges.slice(0, 15).map((r) => ({
          title: clampString(r?.title, 160, 'Risk'),
          severity: r?.severity === 'Low' || r?.severity === 'High' ? r.severity : 'Moderate',
          mitigation: clampString(r?.mitigation, 350),
        }))
      : [],
    timelineScenarios: Array.isArray(raw.timelineScenarios)
      ? raw.timelineScenarios.slice(0, 12).map((t) => ({
          horizon: clampString(t?.horizon, 80, '2026-2030'),
          scenarioTitle: clampString(t?.scenarioTitle, 160, 'Scenario'),
          description: clampString(t?.description, 600),
        }))
      : [],
    verifiedFacts: clampStringList(raw.verifiedFacts, 20, 280),
    assumptions: clampStringList(raw.assumptions, 20, 280),
    aiForecasts: clampStringList(raw.aiForecasts, 20, 280),
    dataLimitations: clampString(raw.dataLimitations, 2000),
  };
}
