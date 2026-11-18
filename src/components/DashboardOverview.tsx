import React from 'react';
import { ArrowUpRight, Compass, Edit3, History, Play, Plus, Trash2, Users } from 'lucide-react';
import { PREDICTION_CATEGORIES } from '../config/predictionCategories';
import type {
  CareerAssessment,
  FuturePrediction,
  ModelId,
  PersonalProfile,
} from '../types/intelligence';

interface DashboardOverviewProps {
  profiles: PersonalProfile[];
  activeProfile: PersonalProfile | null;
  assessments: CareerAssessment[];
  predictions: FuturePrediction[];
  preferredModel: ModelId;
  hfConfigured: boolean;
  onSelectProfile: (profile: PersonalProfile) => void;
  onCreateProfile: () => void;
  onEditProfile: (profile: PersonalProfile) => void;
  onDeleteProfile: (profileId: string) => void;
  onRunAssessment: (profile: PersonalProfile) => void;
  onOpenAssessment: (assessment: CareerAssessment) => void;
  onNavigateTab: (tab: 'overview' | 'profiles' | 'assessment' | 'timeline' | 'predictions') => void;
}

export function DashboardOverview({
  profiles,
  activeProfile,
  assessments,
  predictions,
  preferredModel,
  hfConfigured,
  onSelectProfile,
  onCreateProfile,
  onEditProfile,
  onDeleteProfile,
  onRunAssessment,
  onOpenAssessment,
  onNavigateTab,
}: DashboardOverviewProps) {
  const latestAssessment = assessments[0] || null;

  return (
    <div className="space-y-8">
      {/* Executive Summary Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-xs font-mono text-blue-600">Personal Intelligence Workspace</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            {activeProfile
              ? `Intelligence Overview — ${activeProfile.basic.name}`
              : 'Welcome to Meridian Personal Intelligence'}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {activeProfile
              ? 'Analyze personal academics, intrinsic interests, skills, and regional context with modular Qwen3-8B reasoning and track how recommendations evolve over time.'
              : 'Create a profile for yourself or a child to generate independent career guidance, longitudinal validation, and strategic future forecasts.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onCreateProfile}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Profile
          </button>
          {activeProfile && (
            <button
              type="button"
              onClick={() => onRunAssessment(activeProfile)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4" />
              Run Career Assessment
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Managed Profiles</p>
          <p className="text-2xl font-mono font-semibold tabular-nums text-slate-900 mt-1">
            {profiles.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Self, children &amp; dependents</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Saved Assessments</p>
          <p className="text-2xl font-mono font-semibold tabular-nums text-slate-900 mt-1">
            {assessments.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {activeProfile ? `For ${activeProfile.basic.name}` : 'Select a profile'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Future Forecasts</p>
          <p className="text-2xl font-mono font-semibold tabular-nums text-slate-900 mt-1">
            {predictions.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Across 4 prediction categories</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Active Reasoning Engine</p>
          <p className="text-sm font-mono font-semibold text-slate-900 mt-2 truncate">
            {preferredModel}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {hfConfigured ? 'Direct Hugging Face Router' : 'Server-side hybrid routing'}
          </p>
        </div>
      </div>

      {/* Latest Career Recommendation & Saved Profiles Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Latest Recommendation Spotlight */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Latest Career Recommendation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {latestAssessment
                  ? `${latestAssessment.profileSnapshot.basic.name} · ${latestAssessment.modelVersion}`
                  : 'No career assessment generated for the selected profile yet'}
              </p>
            </div>
            {latestAssessment && (
              <button
                type="button"
                onClick={() => onOpenAssessment(latestAssessment)}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0"
              >
                Open Full Report
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {latestAssessment ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <p className="text-xs font-mono text-blue-600">Primary Recommendation</p>
                  <p className="text-lg font-semibold text-slate-900 mt-0.5">
                    {latestAssessment.primaryRecommendation.title}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-500">Alignment Score</p>
                  <p className="text-xl font-mono font-semibold tabular-nums text-slate-900">
                    {latestAssessment.primaryRecommendation.suitabilityScore}/100
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {latestAssessment.primaryRecommendation.reasoning}
              </p>

              {latestAssessment.alternativeRecommendations.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Alternative Recommendations
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {latestAssessment.alternativeRecommendations.slice(0, 2).map((alt, i) => (
                      <div
                        key={alt.title}
                        className="p-3 border border-slate-200 rounded-lg flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-mono text-slate-400">Rank #{i + 2}</p>
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {alt.title}
                          </p>
                        </div>
                        <span className="text-xs font-mono tabular-nums text-slate-700 shrink-0">
                          {alt.suitabilityScore}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm text-slate-600">
                {activeProfile
                  ? `Ready to analyze ${activeProfile.basic.name}'s profile (${activeProfile.completenessScore}% complete).`
                  : 'Create your first personal or child profile to begin.'}
              </p>
              {activeProfile ? (
                <button
                  type="button"
                  onClick={() => onRunAssessment(activeProfile)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Play className="w-4 h-4" />
                  Generate First Career Assessment
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onCreateProfile}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  <Plus className="w-4 h-4" />
                  Create Personal Profile
                </button>
              )}
            </div>
          )}
        </div>

        {/* Saved Profiles List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-600" />
              <h2 className="text-base font-semibold text-slate-900">Saved Profiles</h2>
            </div>
            <button
              type="button"
              onClick={onCreateProfile}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              + New Profile
            </button>
          </div>

          {profiles.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              No profiles created yet. Add a profile for yourself or a child.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {profiles.map((prof) => {
                const selected = activeProfile?.id === prof.id;
                return (
                  <div
                    key={prof.id}
                    className={`py-3 flex items-center justify-between gap-3 ${
                      selected ? 'bg-slate-50 -mx-3 px-3 rounded-lg' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectProfile(prof)}
                      className="text-left min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {prof.basic.name}
                        </p>
                        <span className="text-[11px] text-slate-500 capitalize">
                          · {prof.relationship}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {[
                          prof.basic.age ? `Age ${prof.basic.age}` : null,
                          prof.basic.city || prof.basic.country || null,
                          `${prof.completenessScore}% complete`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditProfile(prof)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md"
                        title="Edit profile"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateTab('timeline')}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md"
                        title="View timeline"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProfile(prof.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md"
                        title="Delete profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Prediction Categories Quick Launch */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Available Future Prediction Categories
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('predictions')}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Open Prediction Hub →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PREDICTION_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onNavigateTab('predictions')}
              className="text-left p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-slate-50/60 transition-colors"
            >
              <p className="text-sm font-semibold text-slate-900">{cat.title}</p>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{cat.subtitle}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
