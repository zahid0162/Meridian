import React, { useState } from 'react';
import { ArrowRight, GitCompare, History, Play, Trash2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CareerAssessment, PersonalProfile } from '../types/intelligence';

interface HistoricalComparisonViewProps {
  profile: PersonalProfile;
  assessments: CareerAssessment[];
  onRunComparativeAssessment: (baselineAssessment: CareerAssessment) => void;
  onSelectAssessment: (assessment: CareerAssessment) => void;
  onDeleteAssessment: (assessmentId: string) => Promise<void>;
}

function formatDate(ts: unknown): string {
  if (ts && typeof ts === 'object' && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return 'Recent';
}

export function HistoricalComparisonView({
  profile,
  assessments,
  onRunComparativeAssessment,
  onSelectAssessment,
  onDeleteAssessment,
}: HistoricalComparisonViewProps) {
  const withComparisons = assessments.filter((a) => a.historicalComparison !== null);
  const [selectedComparativeId, setSelectedComparativeId] = useState<string>(
    withComparisons[0]?.id || ''
  );
  const [baselineIdForNewRun, setBaselineIdForNewRun] = useState<string>(assessments[0]?.id || '');

  const activeComparative =
    assessments.find((a) => a.id === selectedComparativeId && a.historicalComparison) ||
    withComparisons[0] ||
    null;

  // Manual side-by-side comparison between any two saved assessments
  const [leftId, setLeftId] = useState<string>(assessments[1]?.id || assessments[0]?.id || '');
  const [rightId, setRightId] = useState<string>(assessments[0]?.id || '');
  const leftAssessment = assessments.find((a) => a.id === leftId);
  const rightAssessment = assessments.find((a) => a.id === rightId);

  const manualScoreDiffData = (() => {
    if (!leftAssessment || !rightAssessment) return [];
    const map = new Map<string, { career: string; previous: number; current: number }>();
    const leftList = [leftAssessment.primaryRecommendation, ...leftAssessment.alternativeRecommendations];
    const rightList = [rightAssessment.primaryRecommendation, ...rightAssessment.alternativeRecommendations];
    leftList.forEach((c) => {
      map.set(c.title, { career: c.title, previous: c.suitabilityScore, current: 0 });
    });
    rightList.forEach((c) => {
      const existing = map.get(c.title);
      if (existing) {
        existing.current = c.suitabilityScore;
      } else {
        map.set(c.title, { career: c.title, previous: 0, current: c.suitabilityScore });
      }
    });
    return Array.from(map.values());
  })();

  return (
    <div className="space-y-8">
      {/* Header & Comparative Run Trigger */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-mono text-blue-600 mb-1">Longitudinal Validation Engine</p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Historical Timeline &amp; Assessment Validation — {profile.basic.name}
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Compare updated academic grades, evolving hobbies, and new skills against earlier assessments to verify which predictions held true and uncover newly unlocked trajectories.
          </p>
        </div>

        {assessments.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <select
              value={baselineIdForNewRun || assessments[0]?.id}
              onChange={(e) => setBaselineIdForNewRun(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  Baseline: {formatDate(a.createdAt)} · {a.primaryRecommendation.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const target =
                  assessments.find((a) => a.id === baselineIdForNewRun) || assessments[0];
                if (target) onRunComparativeAssessment(target);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4" />
              Run Comparative Re-Assessment
            </button>
          </div>
        )}
      </div>

      {assessments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <History className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900">No saved assessments yet</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Run an initial career assessment for {profile.basic.name} to establish a longitudinal baseline.
          </p>
        </div>
      ) : (
        <>
          {/* AI-Generated Longitudinal Comparison Report */}
          {activeComparative?.historicalComparison && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <p className="text-xs font-mono text-blue-600">AI Longitudinal Validation</p>
                  <h2 className="text-lg font-semibold text-slate-900 mt-0.5">
                    {activeComparative.historicalComparison.previousPrimaryCareer} →{' '}
                    {activeComparative.historicalComparison.currentPrimaryCareer}
                  </h2>
                </div>
                {withComparisons.length > 1 && (
                  <select
                    value={activeComparative.id}
                    onChange={(e) => setSelectedComparativeId(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {withComparisons.map((a) => (
                      <option key={a.id} value={a.id}>
                        {formatDate(a.createdAt)} · {a.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {activeComparative.historicalComparison.suitabilityDeltas.length > 0 && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeComparative.historicalComparison.suitabilityDeltas}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="career" tick={{ fontSize: 11, fill: '#334155' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="previousScore" name="Previous Assessment" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="currentScore" name="Current Assessment" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 mb-2">Changes in Interests</h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                    {activeComparative.historicalComparison.interestChanges.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 mb-2">Changes in Academic Performance</h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                    {activeComparative.historicalComparison.academicChanges.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 mb-2">Newly Developed Skills</h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                    {activeComparative.historicalComparison.newlyDevelopedSkills.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <h3 className="text-xs font-semibold text-emerald-700 mb-2">
                    Previous Predictions Still Relevant
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                    {activeComparative.historicalComparison.predictionsStillRelevant.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-amber-700 mb-2">
                    Predictions No Longer Supported
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                    {activeComparative.historicalComparison.predictionsNoLongerSupported.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-blue-700 mb-2">
                    Newly Identified Opportunities
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                    {activeComparative.historicalComparison.newlyIdentifiedOpportunities.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Manual Snapshot Side-by-Side Comparison when >= 2 assessments exist */}
          {assessments.length >= 2 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-blue-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Side-by-Side Snapshot Comparison
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={leftId}
                    onChange={(e) => setLeftId(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {assessments.map((a) => (
                      <option key={a.id} value={a.id}>
                        Earlier: {formatDate(a.createdAt)} · {a.primaryRecommendation.title}
                      </option>
                    ))}
                  </select>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <select
                    value={rightId}
                    onChange={(e) => setRightId(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {assessments.map((a) => (
                      <option key={a.id} value={a.id}>
                        Later: {formatDate(a.createdAt)} · {a.primaryRecommendation.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {leftAssessment && rightAssessment && (
                <>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={manualScoreDiffData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="career" tick={{ fontSize: 11, fill: '#334155' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="previous" name={formatDate(leftAssessment.createdAt)} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="current" name={formatDate(rightAssessment.createdAt)} fill="#0f172a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
                    <div className="space-y-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="font-semibold text-slate-900">
                        Snapshot A · {formatDate(leftAssessment.createdAt)}
                      </p>
                      <p className="text-slate-600">
                        Age: {leftAssessment.profileSnapshot.basic.age ?? 'N/A'} · Level:{' '}
                        {leftAssessment.profileSnapshot.education.currentLevel || 'Unspecified'} · Grade:{' '}
                        {leftAssessment.profileSnapshot.education.overallGrade || 'N/A'}
                      </p>
                      <p className="text-slate-600">
                        Primary Career: <span className="font-medium text-slate-900">{leftAssessment.primaryRecommendation.title}</span>
                      </p>
                      <p className="text-slate-600">
                        Skills: {leftAssessment.profileSnapshot.skills.technicalSkills.concat(leftAssessment.profileSnapshot.skills.existingSkills).join(', ') || 'None listed'}
                      </p>
                    </div>
                    <div className="space-y-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="font-semibold text-slate-900">
                        Snapshot B · {formatDate(rightAssessment.createdAt)}
                      </p>
                      <p className="text-slate-600">
                        Age: {rightAssessment.profileSnapshot.basic.age ?? 'N/A'} · Level:{' '}
                        {rightAssessment.profileSnapshot.education.currentLevel || 'Unspecified'} · Grade:{' '}
                        {rightAssessment.profileSnapshot.education.overallGrade || 'N/A'}
                      </p>
                      <p className="text-slate-600">
                        Primary Career: <span className="font-medium text-slate-900">{rightAssessment.primaryRecommendation.title}</span>
                      </p>
                      <p className="text-slate-600">
                        Skills: {rightAssessment.profileSnapshot.skills.technicalSkills.concat(rightAssessment.profileSnapshot.skills.existingSkills).join(', ') || 'None listed'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Chronological Assessment Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Saved Assessment Timeline</h2>
            <div className="divide-y divide-slate-200">
              {assessments.map((a) => (
                <div
                  key={a.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono">{formatDate(a.createdAt)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{a.modelVersion}</span>
                      {a.historicalComparison && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-blue-700 font-medium">Includes Longitudinal Comparison</span>
                        </>
                      )}
                    </div>
                    <p className="text-base font-semibold text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-600">
                      Primary Recommendation: <span className="font-medium text-slate-900">{a.primaryRecommendation.title}</span>{' '}
                      ({a.primaryRecommendation.suitabilityScore}/100)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectAssessment(a)}
                      className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Open Report
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAssessment(a.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete assessment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
