import React, { useState } from 'react';
import { Compass, Download, Sparkles, Trash2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PREDICTION_CATEGORIES } from '../config/predictionCategories';
import { exportFuturePredictionPdf } from '../lib/pdfExporter';
import type {
  FuturePrediction,
  ModelId,
  PersonalProfile,
  PredictionCategoryId,
} from '../types/intelligence';
import { AssessmentProgressOverlay } from './AssessmentProgressOverlay';

interface FuturePredictionsViewProps {
  profiles: PersonalProfile[];
  predictions: FuturePrediction[];
  preferredModel: ModelId;
  onGeneratePrediction: (input: {
    category: PredictionCategoryId;
    subjectTitle: string;
    country: string;
    city: string;
    focusSector: string;
    inputContext: string;
    linkedProfileId: string;
  }) => Promise<FuturePrediction>;
  onDeletePrediction: (predictionId: string) => Promise<void>;
}

export function FuturePredictionsView({
  profiles,
  predictions,
  preferredModel,
  onGeneratePrediction,
  onDeletePrediction,
}: FuturePredictionsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<PredictionCategoryId>('city_hometown');
  const [subjectTitle, setSubjectTitle] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [focusSector, setFocusSector] = useState('');
  const [inputContext, setInputContext] = useState('');
  const [linkedProfileId, setLinkedProfileId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePrediction, setActivePrediction] = useState<FuturePrediction | null>(
    predictions[0] || null
  );
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const activeCategoryMeta =
    PREDICTION_CATEGORIES.find((c) => c.id === selectedCategory) || PREDICTION_CATEGORIES[0];

  const handleSelectProfile = (profileId: string) => {
    setLinkedProfileId(profileId);
    const matched = profiles.find((p) => p.id === profileId);
    if (matched) {
      if (!country) setCountry(matched.basic.country);
      if (!city) setCity(matched.basic.city);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectTitle.trim()) {
      setError('Please provide a clear title or subject for this forecast.');
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const created = await onGeneratePrediction({
        category: selectedCategory,
        subjectTitle: subjectTitle.trim(),
        country: country.trim(),
        city: city.trim(),
        focusSector: focusSector.trim(),
        inputContext: inputContext.trim(),
        linkedProfileId,
      });
      setActivePrediction(created);
      setSubjectTitle('');
      setInputContext('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate prediction.');
    } finally {
      setGenerating(false);
    }
  };

  if (generating) {
    return (
      <AssessmentProgressOverlay
        subjectName={subjectTitle || activeCategoryMeta.title}
        model={preferredModel}
        mode="prediction"
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Category Selector Grid */}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-mono text-blue-600">Extensible Intelligence Modules</p>
          <h1 className="text-2xl font-semibold text-slate-900 mt-0.5">
            Future Prediction &amp; Strategic Analysis
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Select an analytical domain to generate structured, epistemically transparent forecasts separating facts, assumptions, and projections.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 pt-2">
          {PREDICTION_CATEGORIES.map((cat) => {
            const isSelected = cat.id === selectedCategory;
            const imgBroken = brokenImages[cat.id];
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-left bg-white rounded-xl overflow-hidden border transition-all ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-600/15'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  {!imgBroken ? (
                    <img
                      src={cat.imagePath}
                      alt={cat.title}
                      referrerPolicy="no-referrer"
                      onError={() => setBrokenImages((prev) => ({ ...prev, [cat.id]: true }))}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500 p-4">
                      <Compass className="w-6 h-6 mb-1.5" />
                      <span className="text-xs font-medium">{cat.title}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">{cat.title}</h2>
                    {isSelected && (
                      <span className="text-[11px] font-mono text-blue-600 font-medium">Selected</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {cat.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Request Builder + Saved Reports List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">
              Configure {activeCategoryMeta.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Focus areas: {activeCategoryMeta.focusDimensions.join(' · ')}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-800 mb-1">
              Forecast Subject Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={subjectTitle}
              onChange={(e) => setSubjectTitle(e.target.value)}
              placeholder={`e.g. ${activeCategoryMeta.title} Outlook 2026–2032`}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Pakistan, Germany, Canada"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">City / Hometown</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Lahore, Munich, Austin"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Target Industry / Sector
              </label>
              <input
                type="text"
                value={focusSector}
                onChange={(e) => setFocusSector(e.target.value)}
                placeholder={activeCategoryMeta.sectorPlaceholder}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Link Personal Profile (Optional)
              </label>
              <select
                value={linkedProfileId}
                onChange={(e) => handleSelectProfile(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="">Standalone macro/location analysis</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.basic.name} ({p.relationship})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-800 mb-1">
              Context, Constraints &amp; Strategic Questions
            </label>
            <textarea
              rows={3}
              value={inputContext}
              onChange={(e) => setInputContext(e.target.value)}
              placeholder={activeCategoryMeta.contextPlaceholder}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-4">
            <span className="text-xs font-mono text-slate-500">Engine: {preferredModel}</span>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              Generate Forecast Report
            </button>
          </div>
        </form>

        {/* Saved Predictions Library */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Saved Forecasts</h2>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              {predictions.length} reports
            </span>
          </div>

          {predictions.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center border border-dashed border-slate-200 rounded-lg">
              Generated city, country, personal development, and business intelligence reports will appear here.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
              {predictions.map((pred) => {
                const isActive = activePrediction?.id === pred.id;
                return (
                  <div
                    key={pred.id}
                    className={`py-3 flex items-start justify-between gap-3 ${
                      isActive ? 'bg-blue-50/40 -mx-2 px-2 rounded-lg' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActivePrediction(pred)}
                      className="text-left min-w-0 flex-1"
                    >
                      <p className="text-xs font-mono text-blue-600">
                        {pred.category.replace('_', ' ')}
                      </p>
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {pred.subjectTitle}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {[pred.targetLocation.city, pred.targetLocation.country]
                          .filter(Boolean)
                          .join(', ') || 'Global'}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDeletePrediction(pred.id);
                        if (activePrediction?.id === pred.id) {
                          setActivePrediction(null);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 shrink-0"
                      title="Delete forecast"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Active Forecast Detail Dashboard */}
      {activePrediction && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-mono text-blue-600">
                  {activePrediction.category.replace('_', ' ')}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {[activePrediction.targetLocation.city, activePrediction.targetLocation.country]
                    .filter(Boolean)
                    .join(', ') || 'Global'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{activePrediction.modelVersion}</span>
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">
                {activePrediction.subjectTitle}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed pt-1 whitespace-pre-line">
                {activePrediction.executiveSummary}
              </p>
            </div>

            <button
              type="button"
              onClick={() => exportFuturePredictionPdf(activePrediction)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>

          {/* Dimension Scores Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-3">
                Structural Dimension Indicators
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activePrediction.keyDimensions} layout="vertical" margin={{ left: 10, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={140}
                      tick={{ fontSize: 11, fill: '#0f172a' }}
                    />
                    <Tooltip />
                    <Bar dataKey="score" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900">Dimension Rationales</h3>
              <div className="divide-y divide-slate-100">
                {activePrediction.keyDimensions.map((d) => (
                  <div key={d.label} className="py-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900">{d.label}</span>
                      <span className="font-mono text-slate-600">
                        {d.score}/100 · {d.outlook}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{d.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Opportunities & Risks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900">Strategic Opportunities</h3>
              <div className="space-y-3">
                {activePrediction.opportunities.map((o) => (
                  <div key={o.title} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-mono">{o.horizon}</span>
                      <span>Impact: {o.potentialImpact}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{o.title}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Prerequisites: {o.prerequisites.join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900">Risks &amp; Mitigations</h3>
              <div className="space-y-3">
                {activePrediction.risksAndChallenges.map((r) => (
                  <div key={r.title} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-900">{r.title}</span>
                      <span
                        className={`font-mono font-medium ${
                          r.severity === 'High'
                            ? 'text-red-700'
                            : r.severity === 'Moderate'
                            ? 'text-amber-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {r.severity} Severity
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{r.mitigation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Multi-Horizon Scenarios */}
          <div className="pt-6 border-t border-slate-200 space-y-3">
            <h3 className="text-base font-semibold text-slate-900">Future Timeline Scenarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activePrediction.timelineScenarios.map((s) => (
                <div key={s.horizon} className="p-4 border border-slate-200 rounded-lg space-y-1.5">
                  <p className="text-xs font-mono text-blue-600">{s.horizon}</p>
                  <p className="text-sm font-semibold text-slate-900">{s.scenarioTitle}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Verified Facts vs Assumptions vs AI Forecasts */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-semibold text-emerald-700 mb-2">Verified Facts</p>
              <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                {activePrediction.verifiedFacts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-2">Explicit Assumptions</p>
              <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                {activePrediction.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-2">AI-Generated Forecasts</p>
              <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                {activePrediction.aiForecasts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          </div>

          {activePrediction.dataLimitations && (
            <p className="text-xs text-slate-500 pt-4 border-t border-slate-100">
              Data Limitations: {activePrediction.dataLimitations}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
