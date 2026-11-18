import type { CareerAssessment, PersonalProfile, PredictionCategoryId } from '../../src/types/intelligence.ts';
import { getKnowledgeContext } from './knowledgeRegistry.ts';

/**
 * Privacy-by-design sanitizer: strips direct personal identifiers (full name, exact school name)
 * before sending profile attributes to external AI inference providers.
 */
export function redactProfileForAI(profile: PersonalProfile) {
  return {
    subjectAlias: profile.relationship === 'child' ? 'Child Subject' : profile.relationship === 'dependent' ? 'Dependent Subject' : 'Primary Subject',
    relationship: profile.relationship,
    age: profile.basic.age,
    gender: profile.basic.gender || 'Not specified',
    country: profile.basic.country || 'Not specified',
    city: profile.basic.city || 'Not specified',
    languages: profile.basic.languages,
    education: {
      currentLevel: profile.education.currentLevel || 'Not specified',
      institutionType: profile.education.institution ? 'Educational institution provided (redacted for privacy)' : 'Not specified',
      overallGrade: profile.education.overallGrade || 'Not specified',
      subjectGrades: profile.education.subjectGrades,
      favoriteSubjects: profile.education.favoriteSubjects,
      weakSubjects: profile.education.weakSubjects,
      exceptionalSubjects: profile.education.exceptionalSubjects,
      achievements: profile.education.achievements,
    },
    interests: profile.interests,
    skills: profile.skills,
    background: {
      familyBackground: profile.background.familyBackground || 'Not specified',
      parentsProfessions: profile.background.parentsProfessions || 'Not specified',
      familyEducation: profile.background.familyEducation || 'Not specified',
      availableResources: profile.background.availableResources || 'Not specified',
      financialCircumstances: profile.background.financialCircumstances || 'Not specified',
    },
    completenessScore: profile.completenessScore,
  };
}

export function buildCareerAssessmentPrompt(
  profile: PersonalProfile,
  previousAssessment?: CareerAssessment | null
): { system: string; user: string } {
  const redacted = redactProfileForAI(profile);
  const knowledge = getKnowledgeContext(profile.basic.country);

  const system = `You are Meridian's Career Intelligence Reasoning Engine.
Your role is NOT to behave like a casual chatbot or output generic lists of popular jobs.
You must independently analyze the individual's complete personal, academic, interest, skill, geographic, and resource profile, weigh trade-offs, and formulate an authoritative, well-reasoned career assessment.

STRICT ANALYTICAL & EPISTEMIC RULES:
1. Never invent statistics, fabricated percentages, or fake salary claims. Only cite numbers present in the profile or clearly label estimates as approximate directional guidance.
2. Suitability scores (0-100) are analytical assessment scores reflecting profile-to-career alignment, NOT guaranteed probabilities of success.
3. If the profile lacks critical details (e.g., <35% complete or missing both grades and interests), explicitly set dataSufficiency.status to "partial" or "insufficient", explain what is missing in missingInformation, and calibrate confidence accordingly.
4. Distinguish clearly between:
   - verifiedFacts (facts directly observed in the provided profile)
   - assumptions (reasonable analytical inferences bridging sparse fields)
   - aiForecasts (forward-looking projections about trends, pathways, and fit)
5. Regional Knowledge Context: ${knowledge.regionGuidance}
6. Verification Standard: ${knowledge.dataVerificationStandard}
7. Output MUST be strictly valid JSON matching the exact requested schema. Do NOT wrap JSON in markdown fences or include commentary outside the JSON.`;

  const previousContext = previousAssessment
    ? `
PREVIOUS SAVED ASSESSMENT FOR LONGITUDINAL COMPARISON:
- Previous Assessment Title: ${previousAssessment.title}
- Previous Model Version: ${previousAssessment.modelVersion}
- Previous Primary Recommendation: ${previousAssessment.primaryRecommendation.title} (Score: ${previousAssessment.primaryRecommendation.suitabilityScore})
- Previous Alternative Recommendations: ${previousAssessment.alternativeRecommendations.map((r) => `${r.title} (${r.suitabilityScore})`).join(', ')}
- Previous Snapshot Summary:
  - Age: ${previousAssessment.profileSnapshot.basic.age ?? 'N/A'}
  - Education Level: ${previousAssessment.profileSnapshot.education.currentLevel}
  - Overall Grade: ${previousAssessment.profileSnapshot.education.overallGrade}
  - Subject Grades: ${JSON.stringify(previousAssessment.profileSnapshot.education.subjectGrades)}
  - Interests/Hobbies: ${JSON.stringify(previousAssessment.profileSnapshot.interests.interests)} / ${JSON.stringify(previousAssessment.profileSnapshot.interests.hobbies)}
  - Skills: ${JSON.stringify(previousAssessment.profileSnapshot.skills.existingSkills)} / ${JSON.stringify(previousAssessment.profileSnapshot.skills.technicalSkills)}

Because a previous assessment is provided, you MUST populate "historicalComparison" thoroughly comparing the previous snapshot and recommendations against the updated profile and new recommendations.`
    : `No prior assessment is attached. Set "historicalComparison" to null and "comparedWithAssessmentId" to "".`;

  const user = `Analyze this anonymized personal profile and produce a comprehensive Career Assessment JSON object.

PROFILE DATA:
${JSON.stringify(redacted, null, 2)}

${previousContext}

REQUIRED JSON SHAPE:
{
  "title": "Concise analytical assessment title (e.g. '2026 Career & Educational Trajectory Assessment')",
  "dataSufficiency": {
    "status": "sufficient" | "partial" | "insufficient",
    "confidenceNote": "Clear explanation of data completeness and confidence",
    "missingInformation": ["Specific fields that would strengthen future precision"]
  },
  "summaryAnalysis": "3-4 paragraph cohesive executive synthesis explaining how age, academics, interests, skills, location, and resources interact.",
  "strengths": [
    { "label": "Strength name", "score": 0-100, "evidence": "Direct profile observation" }
  ],
  "weaknesses": [
    { "label": "Gap or risk", "impact": "How it affects trajectories", "mitigation": "Concrete action" }
  ],
  "academicAnalysis": {
    "summary": "Analysis of grades, strong/weak subjects, and academic readiness",
    "subjectMetrics": [
      { "subject": "Subject name", "score": 0-100, "benchmark": 75 }
    ]
  },
  "interestAnalysis": {
    "summary": "Analysis of intrinsic motivations across technical, creative, social, and athletic dimensions",
    "distribution": [
      { "domain": "Domain name (e.g. Systems & Tech)", "affinity": 0-100 }
    ]
  },
  "skillAssessment": {
    "summary": "Evaluation of existing vs. target competencies",
    "dimensions": [
      { "skill": "Skill area", "level": 0-100, "target": 0-100 }
    ]
  },
  "primaryRecommendation": {
    "title": "Primary Recommended Career",
    "suitabilityScore": 0-100,
    "reasoning": "Independent multi-factor justification tying directly to profile evidence",
    "requiredSkills": ["Skill 1", "Skill 2"],
    "educationalPathways": ["Step-by-step academic path"],
    "degreesCertifications": ["Relevant degree or credential"],
    "challenges": ["Realistic barrier or risk"],
    "countryOpportunities": "Assessment of opportunities in the profile's country/city",
    "futureTrends": "5-10 year outlook for this discipline",
    "estimatedSalaryRange": "Directional salary band with regional caveat or 'Insufficient verified local data'",
    "shortTermPlan": ["Actionable 3-12 month steps"],
    "longTermPlan": ["Actionable 2-5 year steps"]
  },
  "alternativeRecommendations": [
    /* 2 to 3 distinct alternative CareerRecommendation objects ranked #2, #3, #4 */
  ],
  "roadmapMilestones": [
    {
      "horizon": "Short-Term" | "Medium-Term" | "Long-Term",
      "timeframe": "e.g. Next 6 Months",
      "title": "Milestone title",
      "actions": ["Action 1", "Action 2"],
      "category": "Academic | Skill | Experience | Credential"
    }
  ],
  "epistemicMarkers": {
    "verifiedFacts": ["Fact strictly observed in profile"],
    "assumptions": ["Explicit analytical assumption"],
    "aiForecasts": ["Forward-looking AI projection"]
  },
  "comparedWithAssessmentId": "${previousAssessment?.id || ''}",
  "historicalComparison": ${
    previousAssessment
      ? `{
    "previousAssessmentId": "${previousAssessment.id}",
    "previousDateLabel": "Prior Assessment",
    "previousPrimaryCareer": "${previousAssessment.primaryRecommendation.title}",
    "currentPrimaryCareer": "New primary career title",
    "interestChanges": ["Observed shift in hobbies/interests"],
    "academicChanges": ["Observed grade or subject shift"],
    "newlyDevelopedSkills": ["New skills gained since prior assessment"],
    "predictionsStillRelevant": ["Prior predictions still supported"],
    "predictionsNoLongerSupported": ["Prior predictions weakened or superseded"],
    "newlyIdentifiedOpportunities": ["New paths unlocked by updated profile"],
    "suitabilityDeltas": [
      { "career": "Career name", "previousScore": 0-100, "currentScore": 0-100 }
    ]
  }`
      : 'null'
  }
}`;

  return { system, user };
}

const CATEGORY_RUBRICS: Record<PredictionCategoryId, string> = {
  personal_development:
    'Analyze future career possibilities, potential skills development priorities, educational direction, and personal growth opportunities over a 1-to-10-year horizon.',
  city_hometown:
    'Analyze local economic development possibilities, potentially growing industries, local business opportunities, infrastructure development scenarios, and employment outlook for the specified city/hometown.',
  country_analysis:
    'Analyze national economic trends, high-growth industries, future employment opportunities, emerging professions, technology adoption trajectory, and educational ecosystem shifts.',
  business_intelligence:
    'Analyze potential business opportunities in the selected location and sector, industry growth potential, addressable market opportunities, operational/market risks, and 3-5 year market scenarios.',
};

export function buildFuturePredictionPrompt(params: {
  category: PredictionCategoryId;
  subjectTitle: string;
  country: string;
  city: string;
  focusSector: string;
  inputContext: string;
  linkedProfile?: PersonalProfile | null;
}): { system: string; user: string } {
  const knowledge = getKnowledgeContext(params.country);
  const redactedProfile = params.linkedProfile ? redactProfileForAI(params.linkedProfile) : null;

  const system = `You are Meridian's Future Intelligence & Strategic Forecasting Engine.
Category Focus: ${CATEGORY_RUBRICS[params.category]}

EPISTEMIC INTEGRITY RULES:
1. Clearly separate verified facts from analytical assumptions and AI-generated forecasts.
2. Never fabricate precise census, GDP, or market-size statistics if uncertain; state qualitative drivers or clearly labeled ranges.
3. Regional Knowledge Context: ${knowledge.regionGuidance}
4. Output strictly valid JSON matching the exact schema below with no surrounding markdown.`;

  const user = `Generate a structured Future Prediction Intelligence Report.

PARAMETERS:
- Category: ${params.category}
- Subject Title: ${params.subjectTitle}
- Country: ${params.country || 'Global / Unspecified'}
- City / Hometown: ${params.city || 'Not specified'}
- Focus Sector / Domain: ${params.focusSector || 'Cross-sector'}
- User Context & Questions: ${params.inputContext || 'General strategic forecast'}
${redactedProfile ? `- Linked Personal Profile (anonymized): ${JSON.stringify(redactedProfile)}` : ''}

REQUIRED JSON SHAPE:
{
  "subjectTitle": "${params.subjectTitle}",
  "targetLocation": {
    "country": "${params.country}",
    "city": "${params.city}",
    "focusSector": "${params.focusSector}"
  },
  "inputContext": ${JSON.stringify(params.inputContext || '')},
  "executiveSummary": "3-4 paragraph analytical synthesis balancing structural drivers, constraints, and strategic outlook.",
  "keyDimensions": [
    { "label": "Dimension name (e.g. Digital Infrastructure)", "score": 0-100, "outlook": "Accelerating | Stable | Emerging | Constrained", "rationale": "Why this score reflects current conditions" }
  ],
  "opportunities": [
    { "title": "Opportunity title", "horizon": "1-2 Years | 3-5 Years | 5-10 Years", "potentialImpact": "High | Medium", "prerequisites": ["Key enabler 1", "Key enabler 2"] }
  ],
  "risksAndChallenges": [
    { "title": "Risk title", "severity": "Low" | "Moderate" | "High", "mitigation": "Strategic hedge or preparation" }
  ],
  "timelineScenarios": [
    { "horizon": "2026-2027", "scenarioTitle": "Near-Term Baseline", "description": "Expected developments" },
    { "horizon": "2028-2030", "scenarioTitle": "Medium-Term Inflection", "description": "Structural shifts" },
    { "horizon": "2031+", "scenarioTitle": "Long-Term Horizon", "description": "Macro maturation" }
  ],
  "verifiedFacts": ["Fact grounded in user input or well-established structural reality"],
  "assumptions": ["Explicit modeling assumption"],
  "aiForecasts": ["Forward-looking AI scenario projection"],
  "dataLimitations": "Transparent statement on where live local data or statistical verification is missing."
}`;

  return { system, user };
}
