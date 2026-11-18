import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface TagInputProps {
  label: string;
  helper?: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  suggestions?: string[];
}

export function TagInput({
  label,
  helper,
  values,
  onChange,
  placeholder = 'Type and press Enter',
  maxItems = 20,
  suggestions = [],
}: TagInputProps) {
  const [draft, setDraft] = useState('');

  const addItem = (raw: string) => {
    const cleaned = raw.trim();
    if (!cleaned) return;
    if (values.includes(cleaned) || values.length >= maxItems) {
      setDraft('');
      return;
    }
    onChange([...values, cleaned]);
    setDraft('');
  };

  const removeItem = (item: string) => {
    onChange(values.filter((v) => v !== item));
  };

  const unusedSuggestions = suggestions.filter((s) => !values.includes(s)).slice(0, 6);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <label className="block text-sm font-medium text-slate-800">{label}</label>
        <span className="text-xs font-mono tabular-nums text-slate-400">
          {values.length}/{maxItems}
        </span>
      </div>
      {helper && <p className="text-xs text-slate-500">{helper}</p>}

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addItem(draft);
            }
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
        />
        <button
          type="button"
          onClick={() => addItem(draft)}
          disabled={!draft.trim() || values.length >= maxItems}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200/70 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {values.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => removeItem(item)}
              title={`Remove ${item}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-md hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
            >
              <span>{item}</span>
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-slate-400 mr-1">Quick add:</span>
          {unusedSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addItem(s)}
              className="px-2 py-0.5 text-xs text-slate-600 border border-slate-200 rounded-md hover:border-blue-400 hover:text-blue-700 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
