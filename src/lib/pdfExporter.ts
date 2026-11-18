import { jsPDF } from 'jspdf';
import type { CareerAssessment, FuturePrediction } from '../types/intelligence';

function formatTimestamp(ts: unknown): string {
  if (!ts) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

class PdfCursor {
  doc: jsPDF;
  y = 20;
  pageWidth: number;
  margin = 16;
  contentWidth: number;

  constructor(title: string, subtitle: string) {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4' });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.contentWidth = this.pageWidth - this.margin * 2;

    // Header band
    this.doc.setFillColor(15, 23, 42);
    this.doc.rect(0, 0, this.pageWidth, 28, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.text('MERIDIAN INTELLIGENCE REPORT', this.margin, 12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(203, 213, 225);
    this.doc.text(`${title}  |  ${subtitle}`, this.margin, 20);
    this.y = 38;
  }

  ensureSpace(needed = 14) {
    if (this.y + needed > 278) {
      this.doc.addPage();
      this.y = 20;
    }
  }

  heading(text: string) {
    this.ensureSpace(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.setTextColor(15, 23, 42);
    this.doc.text(text, this.margin, this.y);
    this.y += 2;
    this.doc.setDrawColor(226, 232, 240);
    this.doc.line(this.margin, this.y, this.pageWidth - this.margin, this.y);
    this.y += 5;
  }

  subheading(text: string) {
    this.ensureSpace(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(37, 99, 235);
    this.doc.text(text, this.margin, this.y);
    this.y += 4.5;
  }

  paragraph(text: string) {
    if (!text) return;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(51, 65, 85);
    const lines = this.doc.splitTextToSize(text, this.contentWidth) as string[];
    for (const line of lines) {
      this.ensureSpace(5);
      this.doc.text(line, this.margin, this.y);
      this.y += 4.5;
    }
    this.y += 2;
  }

  bullets(items: string[]) {
    if (!items || items.length === 0) return;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(51, 65, 85);
    for (const item of items) {
      const lines = this.doc.splitTextToSize(`• ${item}`, this.contentWidth - 4) as string[];
      for (const line of lines) {
        this.ensureSpace(5);
        this.doc.text(line, this.margin + 2, this.y);
        this.y += 4.4;
      }
    }
    this.y += 2;
  }
}

export function exportCareerAssessmentPdf(assessment: CareerAssessment): void {
  const name = assessment.profileSnapshot.basic.name || 'Profile Subject';
  const dateLabel = formatTimestamp(assessment.createdAt);
  const pdf = new PdfCursor(assessment.title, `${name} · ${dateLabel}`);

  pdf.heading('1. Profile Snapshot & Model Metadata');
  pdf.paragraph(
    `Subject: ${name} (${assessment.profileSnapshot.relationship}) | Age: ${
      assessment.profileSnapshot.basic.age ?? 'Not provided'
    } | Location: ${[assessment.profileSnapshot.basic.city, assessment.profileSnapshot.basic.country]
      .filter(Boolean)
      .join(', ') || 'Not specified'}`
  );
  pdf.paragraph(
    `Education: ${assessment.profileSnapshot.education.currentLevel || 'Unspecified'} | Model: ${
      assessment.modelVersion
    } (${assessment.providerUsed}) | Data Sufficiency: ${assessment.dataSufficiency.status.toUpperCase()}`
  );
  pdf.paragraph(assessment.dataSufficiency.confidenceNote);

  pdf.heading('2. Overall Profile Synthesis');
  pdf.paragraph(assessment.summaryAnalysis);

  pdf.heading('3. Primary Career Recommendation');
  const p = assessment.primaryRecommendation;
  pdf.subheading(`${p.title} — Alignment Assessment Score: ${p.suitabilityScore}/100 (Analytical indicator, not a guarantee)`);
  pdf.paragraph(p.reasoning);
  pdf.paragraph(`Estimated Compensation Band: ${p.estimatedSalaryRange}`);
  pdf.paragraph(`Regional Outlook: ${p.countryOpportunities}`);
  pdf.paragraph(`Future Industry Trends: ${p.futureTrends}`);
  pdf.subheading('Required Skills');
  pdf.bullets(p.requiredSkills);
  pdf.subheading('Educational Pathways & Credentials');
  pdf.bullets([...p.educationalPathways, ...p.degreesCertifications]);
  pdf.subheading('Potential Challenges');
  pdf.bullets(p.challenges);

  if (assessment.alternativeRecommendations.length > 0) {
    pdf.heading('4. Alternative Career Directions');
    assessment.alternativeRecommendations.forEach((alt, idx) => {
      pdf.subheading(`#${idx + 2}: ${alt.title} — Alignment Score: ${alt.suitabilityScore}/100`);
      pdf.paragraph(alt.reasoning);
      pdf.paragraph(`Regional Outlook: ${alt.countryOpportunities}`);
    });
  }

  pdf.heading('5. Strengths & Development Priorities');
  pdf.bullets(assessment.strengths.map((s) => `${s.label} (${s.score}/100): ${s.evidence}`));
  pdf.subheading('Identified Gaps & Mitigations');
  pdf.bullets(assessment.weaknesses.map((w) => `${w.label}: ${w.impact} -> Mitigation: ${w.mitigation}`));

  pdf.heading('6. Development Roadmap');
  assessment.roadmapMilestones.forEach((m) => {
    pdf.subheading(`[${m.horizon} · ${m.timeframe}] ${m.title}`);
    pdf.bullets(m.actions);
  });

  if (assessment.historicalComparison) {
    const hc = assessment.historicalComparison;
    pdf.heading('7. Longitudinal Historical Comparison');
    pdf.paragraph(`Previous Primary: ${hc.previousPrimaryCareer}  ->  Current Primary: ${hc.currentPrimaryCareer}`);
    pdf.subheading('Changes in Interests & Academics');
    pdf.bullets([...hc.interestChanges, ...hc.academicChanges]);
    pdf.subheading('Newly Developed Skills & Opportunities');
    pdf.bullets([...hc.newlyDevelopedSkills, ...hc.newlyIdentifiedOpportunities]);
    pdf.subheading('Prior Predictions Validation');
    pdf.bullets([
      ...hc.predictionsStillRelevant.map((x) => `Validated: ${x}`),
      ...hc.predictionsNoLongerSupported.map((x) => `Superseded: ${x}`),
    ]);
  }

  pdf.heading('Epistemic Transparency: Facts vs. Assumptions vs. Forecasts');
  pdf.subheading('Verified Profile Facts');
  pdf.bullets(assessment.epistemicMarkers.verifiedFacts);
  pdf.subheading('Analytical Assumptions');
  pdf.bullets(assessment.epistemicMarkers.assumptions);
  pdf.subheading('AI-Generated Forecasts');
  pdf.bullets(assessment.epistemicMarkers.aiForecasts);

  const safeSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  pdf.doc.save(`meridian-career-report-${safeSlug}.pdf`);
}

export function exportFuturePredictionPdf(prediction: FuturePrediction): void {
  const dateLabel = formatTimestamp(prediction.createdAt);
  const pdf = new PdfCursor(prediction.subjectTitle, `${prediction.category.replace('_', ' ')} · ${dateLabel}`);

  pdf.heading('1. Forecast Scope & Model Metadata');
  pdf.paragraph(
    `Location: ${[prediction.targetLocation.city, prediction.targetLocation.country].filter(Boolean).join(', ') || 'Global'} | Focus Sector: ${
      prediction.targetLocation.focusSector || 'Cross-sector'
    } | Model: ${prediction.modelVersion}`
  );
  pdf.paragraph(prediction.executiveSummary);

  pdf.heading('2. Structural Dimensions');
  pdf.bullets(
    prediction.keyDimensions.map((d) => `${d.label} (${d.score}/100 · ${d.outlook}): ${d.rationale}`)
  );

  pdf.heading('3. Strategic Opportunities');
  pdf.bullets(
    prediction.opportunities.map(
      (o) => `${o.title} [${o.horizon} · Impact: ${o.potentialImpact}] — Enablers: ${o.prerequisites.join(', ')}`
    )
  );

  pdf.heading('4. Risks & Mitigation');
  pdf.bullets(
    prediction.risksAndChallenges.map((r) => `${r.title} (${r.severity} Severity): ${r.mitigation}`)
  );

  pdf.heading('5. Multi-Horizon Timeline Scenarios');
  prediction.timelineScenarios.forEach((s) => {
    pdf.subheading(`${s.horizon} — ${s.scenarioTitle}`);
    pdf.paragraph(s.description);
  });

  pdf.heading('6. Epistemic Separation & Data Limitations');
  pdf.subheading('Verified Facts');
  pdf.bullets(prediction.verifiedFacts);
  pdf.subheading('Assumptions');
  pdf.bullets(prediction.assumptions);
  pdf.subheading('AI Forecasts');
  pdf.bullets(prediction.aiForecasts);
  pdf.paragraph(`Data Limitations: ${prediction.dataLimitations}`);

  const safeSlug = prediction.subjectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  pdf.doc.save(`meridian-prediction-${safeSlug}.pdf`);
}
