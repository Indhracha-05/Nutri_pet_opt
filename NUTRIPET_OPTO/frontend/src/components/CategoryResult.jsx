import React, { useState } from 'react';
import NutrientRadar from './NutrientRadar';

const GRADE_COLORS = {
  A: { bg: 'from-emerald-500 to-green-600', badge: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  B: { bg: 'from-teal-500 to-emerald-600', badge: 'bg-teal-500', text: 'text-teal-400', border: 'border-teal-500/40' },
  C: { bg: 'from-yellow-500 to-amber-600', badge: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/40' },
  D: { bg: 'from-orange-500 to-red-500', badge: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/40' },
  E: { bg: 'from-red-500 to-rose-600', badge: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/40' },
  F: { bg: 'from-red-700 to-rose-900', badge: 'bg-red-700', text: 'text-red-300', border: 'border-red-700/40' },
};

function MiniCard({ item, isExpanded, onToggle }) {
  const { food_name, category, analysis } = item;
  const { health_grade, confidence, is_toxic, explanation_text, predicted_caloric_density, graph_features } = analysis;
  const gc = GRADE_COLORS[health_grade] || GRADE_COLORS.C;

  return (
    <div className={`rounded-2xl border ${gc.border} bg-white/5 overflow-hidden transition-all duration-300 hover:bg-white/[0.08]`}>
      {/* Row header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        {/* Grade badge */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gc.bg} flex items-center justify-center flex-shrink-0 shadow-lg`}>
          <span className="text-white text-xl font-extrabold">{health_grade}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-white truncate">{food_name}</p>
            {is_toxic && <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-red-900/60 text-red-300 border border-red-500/30">☠ Toxic</span>}
          </div>
          <p className="text-xs text-white/40 mt-0.5">{category} · Confidence: {(confidence * 100).toFixed(0)}%</p>
        </div>

        {/* Bar */}
        <div className="w-20 flex-shrink-0 hidden sm:block">
          <div className="h-1.5 w-full rounded-full bg-white/10">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${gc.bg}`}
              style={{ width: `${predicted_caloric_density * 100}%` }}
            />
          </div>
          <p className="text-xs text-white/30 mt-1 text-right">Cal density</p>
        </div>

        <span className="text-white/30 text-sm">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
          {is_toxic && (
            <div className="bg-red-900/40 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">
              ⚠ <strong>Toxicity Warning:</strong> {explanation_text}
            </div>
          )}
          {!is_toxic && (
            <p className="text-white/60 text-sm leading-relaxed">{explanation_text}</p>
          )}
          <div className="h-64">
            <NutrientRadar features={graph_features} compact />
          </div>
        </div>
      )}
    </div>
  );
}

export default function CategoryResult({ data }) {
  const { species, diet_type, category, results } = data;
  const [expanded, setExpanded] = useState(0);

  if (!results || results.length === 0) return null;

  const toggle = (i) => setExpanded(expanded === i ? null : i);

  const sortedResults = [...results].sort((a, b) => {
    const gradeOrder = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 };
    return (gradeOrder[a.analysis.health_grade] ?? 5) - (gradeOrder[b.analysis.health_grade] ?? 5);
  });

  const gradeCount = results.reduce((acc, r) => {
    acc[r.analysis.health_grade] = (acc[r.analysis.health_grade] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex flex-wrap items-start gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white">
              {category} <span className="text-white/40">for</span> {species}
            </h2>
            <p className="text-sm text-white/40 mt-1 capitalize">
              Diet type: {diet_type} · Showing top {results.length} foods by bioavailability
            </p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            {Object.entries(gradeCount).map(([g, c]) => {
              const gc = GRADE_COLORS[g] || GRADE_COLORS.C;
              return (
                <span key={g} className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${gc.bg}`}>
                  Grade {g}: {c}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Food cards */}
      <div className="space-y-3">
        {sortedResults.map((item, i) => (
          <MiniCard
            key={i}
            item={item}
            isExpanded={expanded === i}
            onToggle={() => toggle(i)}
          />
        ))}
      </div>

      <p className="text-xs text-white/25 text-center">
        Results sorted by health grade · Click each card to expand nutritional details
      </p>
    </div>
  );
}
