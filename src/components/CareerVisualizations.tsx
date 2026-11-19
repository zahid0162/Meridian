import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Globe2,
  Lightbulb,
  MapPin,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CareerAssessment, CareerRecommendation } from '../types/intelligence';
import { exportCareerAssessmentPdf } from '../lib/pdfExporter';

interface CareerVisualizationsProps {
  assessment: CareerAssessment;
  onDeleteAssessment: (assessmentId: string) => Promise<void>;
  onOpenTimeline?: () => void;
}

export function CareerVisualizations({
  assessment,
  onDeleteAssessment,
  onOpenTimeline,
}: CareerVisualizationsProps) {
  const allCareers: { rank: number; data: CareerRecommendation }[] = [
    { rank: 1, data: assessment.primaryRecommendation },
    ...assessment.alternativeRecommendations.map((alt, i) => ({ rank: i + 2, data: alt })),
  ];

  const [selectedRank, setSelectedRank] = useState<number>(1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);

  const activeCareer = allCareers.find((c) => c.rank === selectedRank)?.data || assessment.primaryRecommendation;

  const handleCopyBrief = async () => {
    const lines = [
      `${assessment.title} — ${assessment.profileSnapshot.basic.name}`,
      `Model: ${assessment.modelVersion} | Data Sufficiency: ${assessment.dataSufficiency.status}`,
      '',
      `Primary Recommendation (#1): ${assessment.primaryRecommendation.title} (${assessment.primaryRecommendation.suitabilityScore}/100 alignment score)`,
      `Reasoning: ${assessment.primaryRecommendation.reasoning}`,
      `Estimated Salary Band: ${assessment.primaryRecommendation.estimatedSalaryRange}`,
      '',
      'Alternative Directions:',
      ...assessment.alternativeRecommendations.map(
        (alt, idx) => `- #${idx + 2} ${alt.title} (${alt.suitabilityScore}/100): ${alt.reasoning}`
      ),
      '',
      'Immediate Next Steps:',
      ...assessment.primaryRecommendation.shortTermPlan.map((step) => `- ${step}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedBrief(true);
      window.setTimeout(() => setCopiedBrief(false), 2000);
    } catch {
      // Clipboard unavailable in restricted context
    }
  };

  const suitabilityChartData = allCareers.map((c) => ({
    name: c.data.title.length > 22 ? `${c.data.title.slice(0, 20)}...` : c.data.title,
    fullTitle: c.data.title,
    score: c.data.suitabilityScore,
    rank: `#${c.rank}`,
  }));

  const createdLabel =
    assessment.createdAt &&
    typeof assessment.createdAt === 'object' &&
    'toDate' in assessment.createdAt &&
    typeof (assessment.createdAt as { toDate: () => Date }).toDate === 'function'
      ? (assessment.createdAt as { toDate: () => Date }).toDate().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'Saved Assessment';

  const sufficiencyColor =
    assessment.dataSufficiency.status === 'sufficient'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : assessment.dataSufficiency.status === 'partial'
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-red-700 bg-red-50 border-red-200';

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDeleteAssessment(assessment.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Report Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{assessment.profileSnapshot.basic.name}</span>
              <span aria-hidden="true">·</span>
              <span>{createdLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{assessment.modelVersion}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                Snapshot Completeness {assessment.profileSnapshot.completenessScore}%
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              {assessment.title}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed pt-1 whitespace-pre-line">
              {assessment.summaryAnalysis}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => exportCareerAssessmentPdf(assessment)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              Export PDF Report
            </button>

            <button
              type="button"
              onClick={handleCopyBrief}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              {copiedBrief ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copied Brief</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Brief</span>
                </>
              )}
            </button>

            {onOpenTimeline && (
              <button
                type="button"
                onClick={onOpenTimeline}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                Timeline &amp; History
              </button>
            )}

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:text-red-700 hover:border-red-200 hover:bg-red-50 transition-colors"
                title="Delete this assessment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                <span className="text-xs font-medium text-red-800">Delete?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-semibold text-red-700 hover:underline"
                >
                  {deleting ? 'Removing...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Data Sufficiency Calibration Banner */}
        <div className={`mt-6 p-4 rounded-lg border ${sufficiencyColor}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              {assessment.dataSufficiency.status === 'sufficient' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span className="text-xs font-semibold uppercase tracking-wider">
                Data Sufficiency: {assessment.dataSufficiency.status}
              </span>
            </div>
            <span className="text-xs">
              Scores represent analytical profile alignment, not guaranteed success probabilities.
            </span>
          </div>
          <p className="text-xs mt-1.5 leading-relaxed">{assessment.dataSufficiency.confidenceNote}</p>
          {assessment.dataSufficiency.missingInformation.length > 0 && (
            <p className="text-xs mt-1.5 font-medium">
              Recommended additions for higher precision: {assessment.dataSufficiency.missingInformation.join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Primary Recommendation Spotlight + Interactive Career Explorer */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-6 sm:p-8 bg-slate-900 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-mono text-blue-300 mb-1">
                Primary Independent Recommendation
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {assessment.primaryRecommendation.title}
              </h2>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                {assessment.primaryRecommendation.reasoning}
              </p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg px-5 py-4 shrink-0 text-left md:text-right">
              <p className="text-xs text-slate-400">Assessment Alignment Score</p>
              <p className="text-3xl font-mono font-semibold tabular-nums text-white mt-0.5">
                {assessment.primaryRecommendation.suitabilityScore}
                <span className="text-base text-slate-400 font-normal">/100</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {assessment.primaryRecommendation.estimatedSalaryRange}
              </p>
            </div>
          </div>
        </div>

        {/* Career Switcher Tabs */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-medium text-slate-500 mr-2 whitespace-nowrap">
            Explore Recommendations:
          </span>
          {allCareers.map((c) => {
            const isSelected = c.rank === selectedRank;
            return (
              <button
                key={c.rank}
                type="button"
                onClick={() => setSelectedRank(c.rank)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="font-mono opacity-75">#{c.rank}</span>
                <span>{c.data.title}</span>
                <span className="font-mono tabular-nums opacity-80">{c.data.suitabilityScore}</span>
              </button>
            );
          })}
        </div>

        {/* Active Career Deep Dive */}
        <div className="p-6 sm:p-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="max-w-3xl">
              <p className="text-xs font-mono text-blue-600 mb-1">
                {selectedRank === 1 ? 'Rank #1 Primary Direction' : `Rank #${selectedRank} Alternative Direction`}
              </p>
              <h3 className="text-xl font-semibold text-slate-900">{activeCareer.title}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{activeCareer.reasoning}</p>
            </div>
            <div className="text-left md:text-right shrink-0">
              <p className="text-xs text-slate-500">Suitability Alignment</p>
              <p className="text-2xl font-mono font-semibold tabular-nums text-slate-900">
                {activeCareer.suitabilityScore}/100
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Briefcase className="w-4 h-4 text-blue-600" />
                Required Skills
              </div>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {activeCareer.requiredSkills.map((s) => (
                  <li key={s} className="py-1 border-b border-slate-100 last:border-0">
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Educational Pathways &amp; Degrees
              </div>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {activeCareer.educationalPathways.map((p) => (
                  <li key={p} className="py-1 border-b border-slate-100">
                    {p}
                  </li>
                ))}
                {activeCareer.degreesCertifications.map((d) => (
                  <li key={d} className="py-1 text-xs font-mono text-slate-600">
                    Credential: {d}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Potential Challenges
              </div>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {activeCareer.challenges.map((ch) => (
                  <li key={ch} className="py-1 border-b border-slate-100 last:border-0">
                    {ch}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-200">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Country &amp; Regional Opportunities
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{activeCareer.countryOpportunities}</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                Future Industry Trends
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{activeCareer.futureTrends}</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                <Globe2 className="w-3.5 h-3.5 text-blue-600" />
                Estimated Salary Band
              </div>
              <p className="text-sm font-mono text-slate-900">{activeCareer.estimatedSalaryRange}</p>
              <p className="text-[11px] text-slate-400">
                Directional estimate only; varies by city, currency, employer tier, and experience.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Short-Term Action Plan (3–12 Months)</h4>
              <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-5">
                {activeCareer.shortTermPlan.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Long-Term Trajectory (2–5+ Years)</h4>
              <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-5">
                {activeCareer.longTermPlan.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Career Comparison Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Career Comparison Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any row to inspect its detailed pathway and regional outlook above.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-400">
            {allCareers.length} directions compared
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                <th className="py-2.5 px-4">Rank &amp; Career</th>
                <th className="py-2.5 px-4 text-right">Alignment</th>
                <th className="py-2.5 px-4">Estimated Salary Band</th>
                <th className="py-2.5 px-4">Core Skills</th>
                <th className="py-2.5 px-4">Primary Pathway</th>
                <th className="py-2.5 px-4">Key Challenge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {allCareers.map((c) => {
                const isSelected = c.rank === selectedRank;
                return (
                  <tr
                    key={c.rank}
                    onClick={() => setSelectedRank(c.rank)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                      <span className="font-mono text-slate-400 mr-2">#{c.rank}</span>
                      <span>{c.data.title}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {c.data.suitabilityScore}/100
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {c.data.estimatedSalaryRange}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[220px] truncate">
                      {c.data.requiredSkills.slice(0, 3).join(', ') || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[220px] truncate">
                      {c.data.educationalPathways[0] || c.data.degreesCertifications[0] || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[220px] truncate">
                      {c.data.challenges[0] || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Career Suitability Comparison */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Career Suitability Comparison</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative alignment scores across top recommended directions (0–100 assessment scale).
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={suitabilityChartData} layout="vertical" margin={{ left: 12, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fontSize: 11, fill: '#0f172a' }}
                />
                <Tooltip
                  formatter={(value) => [`${value}/100`, 'Alignment Score']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullTitle || ''}
                />
                <Bar dataKey="score" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Interest Distribution Radar */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Interest &amp; Motivation Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">{assessment.interestAnalysis.summary}</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={assessment.interestAnalysis.distribution}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11, fill: '#334155' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Radar
                  name="Affinity"
                  dataKey="affinity"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.18}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Academic Performance Visualization */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Academic Performance vs. Pathway Benchmark</h3>
            <p className="text-xs text-slate-500 mt-0.5">{assessment.academicAnalysis.summary}</p>
          </div>
          {assessment.academicAnalysis.subjectMetrics.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assessment.academicAnalysis.subjectMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#334155' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip />
                  <Bar dataKey="score" name="Profile Score" fill="#0f172a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="benchmark" name="Pathway Benchmark" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-500 p-4 text-center">
              Add subject grades in the profile to render subject-by-subject academic benchmark comparisons.
            </div>
          )}
        </div>

        {/* 4. Skills Analysis: Current vs Target */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Skills Readiness &amp; Target Gap</h3>
            <p className="text-xs text-slate-500 mt-0.5">{assessment.skillAssessment.summary}</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assessment.skillAssessment.dimensions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="skill" tick={{ fontSize: 11, fill: '#334155' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="level" name="Current Level" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Target Readiness" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Identified Strengths</h3>
          <div className="divide-y divide-slate-100">
            {assessment.strengths.map((s) => (
              <div key={s.label} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-slate-900">{s.label}</span>
                  <span className="text-xs font-mono tabular-nums text-emerald-700 font-semibold">
                    {s.score}/100
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{s.evidence}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Gaps, Risks &amp; Mitigations</h3>
          <div className="divide-y divide-slate-100">
            {assessment.weaknesses.map((w) => (
              <div key={w.label} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-medium text-slate-900">{w.label}</p>
                <p className="text-xs text-slate-600 mt-1">{w.impact}</p>
                <p className="text-xs text-blue-700 mt-1 font-medium">Mitigation: {w.mitigation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Educational & Development Roadmap Timeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Educational &amp; Career Development Roadmap</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Phased milestones sequenced across immediate, medium-term, and long-term horizons.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['Short-Term', 'Medium-Term', 'Long-Term'] as const).map((horizon) => {
            const items = assessment.roadmapMilestones.filter((m) => m.horizon === horizon);
            return (
              <div key={horizon} className="space-y-3">
                <div className="pb-2 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">{horizon}</span>
                  <span className="text-xs font-mono tabular-nums text-slate-400">
                    {items.length} milestones
                  </span>
                </div>
                {items.length === 0 ? (
                  <p className="text-xs text-slate-400">No milestones specified for this horizon.</p>
                ) : (
                  <div className="space-y-3">
                    {items.map((m, idx) => (
                      <div key={`${m.title}-${idx}`} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span className="font-mono">{m.timeframe}</span>
                          <span>{m.category}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-900">{m.title}</p>
                        <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc pl-4">
                          {m.actions.map((a) => (
                            <li key={a}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Epistemic Separation: Facts vs Assumptions vs Forecasts */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-blue-600" />
          <h3 className="text-base font-semibold text-slate-900">
            Epistemic Transparency: Facts, Assumptions &amp; Forecasts
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div>
            <p className="text-xs font-semibold text-emerald-700 mb-2">Verified Profile Facts</p>
            <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
              {assessment.epistemicMarkers.verifiedFacts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700 mb-2">Analytical Assumptions</p>
            <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
              {assessment.epistemicMarkers.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-700 mb-2">AI-Generated Forecasts</p>
            <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
              {assessment.epistemicMarkers.aiForecasts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
