import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { ModelId } from '../types/intelligence';

const ASSESSMENT_STAGES = [
  {
    title: 'Analyzing personal & regional context',
    detail: 'Structuring age, geographic environment, languages, and available educational resources.',
  },
  {
    title: 'Evaluating interests and academic performance',
    detail: 'Cross-referencing subject strengths, grades, hobbies, and intrinsic motivation signals.',
  },
  {
    title: 'Identifying suitable opportunities',
    detail: 'Mapping regional labor markets, educational pathways, and emerging domain intersections.',
  },
  {
    title: 'Comparing potential career directions',
    detail: 'Weighing primary and alternative recommendations independently with trade-off analysis.',
  },
  {
    title: 'Preparing the final structured assessment',
    detail: 'Separating verified profile facts from analytical assumptions and forward forecasts.',
  },
];

interface AssessmentProgressOverlayProps {
  subjectName: string;
  model: ModelId;
  mode?: 'career' | 'prediction';
}

export function AssessmentProgressOverlay({
  subjectName,
  model,
  mode = 'career',
}: AssessmentProgressOverlayProps) {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStage((prev) => (prev < ASSESSMENT_STAGES.length - 1 ? prev + 1 : prev));
    }, 2400);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-2xl mx-auto my-8">
      <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-mono text-blue-600 mb-1">
            {mode === 'career' ? 'Career Intelligence Pipeline' : 'Future Intelligence Pipeline'}
          </p>
          <h2 className="text-xl font-semibold text-slate-900">
            Synthesizing {mode === 'career' ? 'Assessment' : 'Forecast'} for {subjectName}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Reasoning Engine</p>
          <p className="text-xs font-mono text-slate-800">{model}</p>
        </div>
      </div>

      <div className="py-6 space-y-4">
        {ASSESSMENT_STAGES.map((stage, idx) => {
          const isCompleted = idx < activeStage;
          const isCurrent = idx === activeStage;
          return (
            <div
              key={stage.title}
              className={`flex items-start gap-4 p-3.5 rounded-lg border transition-colors ${
                isCurrent
                  ? 'bg-blue-50/50 border-blue-200'
                  : isCompleted
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-white border-slate-100 opacity-60'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isCompleted ? (
                  <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-mono tabular-nums">
                    {idx + 1}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  {idx + 1}. {stage.title}
                </p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{stage.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 pt-4 border-t border-slate-100">
        Direct personal identifiers are redacted before inference. Evaluating multi-factor alignment and constructing structured visualizations.
      </p>
    </div>
  );
}
