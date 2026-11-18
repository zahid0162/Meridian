export interface KnowledgeReferenceContext {
  regionGuidance: string;
  dataVerificationStandard: string;
  salaryCaveat: string;
}

const REGION_HIGHLIGHTS: Record<string, string> = {
  'united states': 'BLS occupational projections emphasize software/AI systems, healthcare clinical roles, renewable energy engineering, and skilled electrical/industrial trades.',
  'united kingdom': 'UK labor demand highlights digital engineering, fintech, life sciences, civil/grid infrastructure, and NHS clinical specialties.',
  'pakistan': 'Regional growth centers on software/export IT services, telecom & fintech, agri-tech, civil infrastructure, and renewable solar engineering; salary benchmarks vary sharply between local firms and remote international roles.',
  'india': 'High growth in enterprise software, semiconductor design, AI/data engineering, biotech, EV manufacturing, and digital financial infrastructure.',
  'canada': 'Strong demand in cloud/software engineering, healthcare, clean technology, civil infrastructure, and resource engineering.',
  'germany': 'Strong demand in industrial automation, mechanical/electrical engineering, renewable energy systems, software, and vocational Meister pathways.',
  'united arab emirates': 'Focus on AI/cloud infrastructure, fintech, logistics/supply chain, sustainable urban engineering, and tourism/hospitality leadership.',
};

export function getKnowledgeContext(country?: string): KnowledgeReferenceContext {
  const normalized = (country || '').trim().toLowerCase();
  const matched = Object.entries(REGION_HIGHLIGHTS).find(([key]) => normalized.includes(key));

  return {
    regionGuidance: matched
      ? matched[1]
      : 'Country-specific employment markets depend on local industrial structure, university-to-industry pipelines, and remote/global digital market access. Avoid fabricating unverified national statistics.',
    dataVerificationStandard:
      'Distinguish explicitly between facts directly observed in the profile, reasonable analytical assumptions, and forward-looking AI forecasts. When exact salary or local institutional figures are unavailable, state an approximate directional range with clear caveats or mark as "Insufficient verified local data".',
    salaryCaveat:
      'Estimated salary ranges reflect general directional market tiers only and vary significantly by city, employer tier, currency, and experience.',
  };
}
