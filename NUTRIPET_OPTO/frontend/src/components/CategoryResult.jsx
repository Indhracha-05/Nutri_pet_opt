import React, { useState } from 'react';
import NutrientRadar from './NutrientRadar';

function MiniCard({ item, isExpanded, onToggle }) {
  const { food_name, category, analysis } = item;
  const { health_grade, confidence, is_toxic, explanation_text, predicted_caloric_density, graph_features } = analysis;

  return (
    <div className="rounded-inputs bg-[#f2f2f3] transition-colors hover:bg-[#eaeaea] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-inputs bg-[#ffffff] flex items-center justify-center font-serif text-lg text-[#17191c]">
            {health_grade}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <p className="font-serif text-base text-[#17191c]">{food_name}</p>
              {is_toxic && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fbe1d1] text-[#5d2a1a] font-medium">
                  Toxin
                </span>
              )}
            </div>
            <p className="text-xs text-[#777b86]">
              {category} · Confidence {(confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:block text-right">
            <span className="text-xs font-mono text-[#777b86] block">
              {(predicted_caloric_density * 100).toFixed(0)} cal-idx
            </span>
          </div>
          <span className="text-xs text-[#777b86] font-mono">
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 pt-3 border-t border-[#e2e2e4] space-y-4 bg-[#ffffff]">
          {is_toxic ? (
            <div className="p-3 rounded-inputs bg-[#fbe1d1] text-xs text-[#5d2a1a]">
              <strong>Toxicity Warning:</strong> {explanation_text}
            </div>
          ) : (
            <p className="text-xs text-[#17191c] leading-relaxed font-sans">
              {explanation_text}
            </p>
          )}

          <div className="h-56 bg-[#ffffff] p-2">
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
    <div className="space-y-6">
      {/* Category Header */}
      <div className="card-floating space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-[#979799] uppercase tracking-wider block">
              Category Comparative Evaluation
            </span>
            <h2 className="text-2xl font-serif text-[#17191c] mt-0.5">
              {category} for {species}
            </h2>
            <p className="text-xs text-[#777b86] mt-0.5 capitalize">
              Diet biology: {diet_type} · Ranked by bioavailability
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {Object.entries(gradeCount).map(([g, c]) => (
              <span
                key={g}
                className="px-3 py-1 rounded-full text-xs font-mono bg-[#f2f2f3] text-[#17191c]"
              >
                Grade {g}: {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Results List */}
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

      <p className="text-xs text-[#a3a6af] text-center font-sans">
        Click any food item above to expand detailed radar charts.
      </p>
    </div>
  );
}
