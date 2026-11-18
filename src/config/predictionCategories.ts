import type { PredictionCategoryId } from '../types/intelligence';

export interface PredictionCategoryDefinition {
  id: PredictionCategoryId;
  title: string;
  subtitle: string;
  imagePath: string;
  focusDimensions: string[];
  sectorPlaceholder: string;
  contextPlaceholder: string;
}

export const PREDICTION_CATEGORIES: PredictionCategoryDefinition[] = [
  {
    id: 'personal_development',
    title: 'Personal Development',
    subtitle: 'Long-term skill acquisition, education trajectory, and emerging personal capability opportunities.',
    imagePath: '/src/assets/images/prediction_personal_dev_1794981809137.jpg',
    focusDimensions: ['Future Career Mobility', 'Skill Compounding', 'Educational Direction', 'Growth Catalysts'],
    sectorPlaceholder: 'e.g. Interdisciplinary AI & Product Design',
    contextPlaceholder: 'Describe personal goals, upcoming academic transitions, or skills you want evaluated over the next 3-7 years.',
  },
  {
    id: 'city_hometown',
    title: 'City & Hometown Analysis',
    subtitle: 'Local economic vitality, growing sectors, urban infrastructure trajectories, and employment hubs.',
    imagePath: '/src/assets/images/prediction_city_hometown_1794981808384.jpg',
    focusDimensions: ['Economic Vitality', 'Growing Industries', 'Infrastructure Scenarios', 'Local Employment'],
    sectorPlaceholder: 'e.g. Clean Energy, Software Outsourcing, Logistics',
    contextPlaceholder: 'Specify local context, university presence, industrial corridors, or municipal projects to evaluate.',
  },
  {
    id: 'country_analysis',
    title: 'Country Analysis',
    subtitle: 'Macroeconomic trajectories, technology adoption curves, emerging professions, and education reform.',
    imagePath: '/src/assets/images/prediction_country_macro_1794981809296.jpg',
    focusDimensions: ['Macro Trends', 'Emerging Professions', 'Tech Adoption', 'Education Ecosystem'],
    sectorPlaceholder: 'e.g. Semiconductor Supply Chain & Digital Services',
    contextPlaceholder: 'Describe demographic, regulatory, export, or workforce questions for this national outlook.',
  },
  {
    id: 'business_intelligence',
    title: 'Business Intelligence',
    subtitle: 'Regional venture opportunities, sector growth potential, competitive risks, and 5-year market scenarios.',
    imagePath: '/src/assets/images/prediction_business_intel_1794981808839.jpg',
    focusDimensions: ['Market Opportunity', 'Sector Growth', 'Competitive Risk', 'Capital Efficiency'],
    sectorPlaceholder: 'e.g. B2B Agri-Tech SaaS or Cold-Chain Logistics',
    contextPlaceholder: 'Outline target customer segment, capital constraints, or regional expansion assumptions.',
  },
];
