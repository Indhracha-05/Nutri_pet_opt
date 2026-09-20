import React from 'react';
import NutrientRadar from './NutrientRadar';
import GraphView from './GraphView';

export default function AnalysisResult({ result }) {
  if (!result) return null;

  const {
    health_grade,
    predicted_caloric_density,
    confidence,
    is_toxic,
    toxicity_reason,
    explanation_text,
    top_factors,
    graph_features,
    graph_data,
  } = result;

  return (
    <div className="space-y-6">
      {/* Top Floating Card: Grade & Diagnostic Summary */}
      <div className="card-floating space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#ececec] gap-4">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-inputs bg-[#f2f2f3] flex items-center justify-center text-4xl font-serif text-[#17191c]">
              {health_grade}
            </div>
            <div>
              <span className="text-xs text-[#979799] uppercase tracking-wider block">
                Health Evaluation
              </span>
              <h3 className="text-2xl font-serif text-[#17191c] mt-0.5">
                Grade {health_grade} Assessment
              </h3>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-[#a3a6af] block font-sans">Model Confidence</span>
            <span className="text-xl font-mono text-[#17191c]">
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Toxicity Callout Banner (Accent Peach surface per Steep) */}
        {is_toxic && (
          <div className="card-peach space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base text-[#5d2a1a]">
                ⚠️ Toxicity Risk Identified
              </span>
            </div>
            <p className="text-sm text-[#5d2a1a] leading-relaxed">
              This ingredient contains <strong className="font-semibold">{toxicity_reason}</strong>, which presents known biological toxicity for this species.
            </p>
          </div>
        )}

        {/* Narrative Explanation */}
        <div className="space-y-2">
          <span className="text-xs text-[#979799] uppercase tracking-wider block">
            Nutritional Rationale
          </span>
          <p className="whitespace-pre-wrap text-sm text-[#17191c] leading-relaxed font-sans">
            {explanation_text}
          </p>
        </div>
      </div>

      {/* Metrics & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nutrient Radar */}
        <div className="card-floating h-full flex flex-col justify-between">
          <div className="mb-4">
            <span className="text-xs text-[#979799] uppercase tracking-wider block">
              Nutrient Compatibility
            </span>
            <h4 className="font-serif text-lg text-[#17191c] mt-0.5">
              Biological Profile Radar
            </h4>
          </div>
          <div className="h-64">
            <NutrientRadar features={graph_features} />
          </div>
        </div>

        {/* Influencing Factors & Caloric Density */}
        <div className="card-floating flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs text-[#979799] uppercase tracking-wider block">
                Explainability Weights
              </span>
              <h4 className="font-serif text-lg text-[#17191c] mt-0.5">
                Top Influencing Features
              </h4>
            </div>

            <ul className="divide-y divide-[#ececec]">
              {top_factors && top_factors.map((tf, index) => (
                <li key={index} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-[#17191c] capitalize font-sans">
                    {tf.feature.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-4 font-mono text-xs">
                    <span className="text-[#777b86]">val: {tf.value.toFixed(2)}</span>
                    <span className="text-[#17191c] font-semibold">
                      imp: {tf.importance.toFixed(2)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Caloric Density Indicator */}
          <div className="pt-4 border-t border-[#ececec] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#777b86]">Caloric Density Index</span>
              <span className="font-mono text-[#17191c]">
                {(predicted_caloric_density * 100).toFixed(0)} / 100
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#f2f2f3] w-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, Math.max(0, predicted_caloric_density * 100))}%` }}
                className="h-full rounded-full bg-[#5d2a1a] transition-all duration-500"
              />
            </div>
            <p className="text-[11px] text-[#a3a6af] text-right">
              Relative energy mass index
            </p>
          </div>
        </div>
      </div>

      {/* Graph Visualizer */}
      {graph_data && (
        <div className="h-[460px] w-full">
          <GraphView graphData={graph_data} />
        </div>
      )}
    </div>
  );
}
