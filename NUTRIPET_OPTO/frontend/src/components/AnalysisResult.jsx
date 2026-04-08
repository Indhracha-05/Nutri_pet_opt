import React from 'react';
import NutrientRadar from './NutrientRadar';
import GraphView from './GraphView';

const GRADE_STYLES = {
    A: { bg: 'from-emerald-500 to-green-600', glow: 'shadow-emerald-500/40' },
    B: { bg: 'from-teal-500 to-emerald-600', glow: 'shadow-teal-500/40' },
    C: { bg: 'from-yellow-500 to-amber-600', glow: 'shadow-yellow-500/40' },
    D: { bg: 'from-orange-500 to-red-500', glow: 'shadow-orange-500/40' },
    E: { bg: 'from-red-500 to-rose-600', glow: 'shadow-red-500/40' },
    F: { bg: 'from-red-700 to-rose-900', glow: 'shadow-red-700/40' },
};

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

    const gs = GRADE_STYLES[health_grade] || GRADE_STYLES.C;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Grade Header */}
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                <div className={`p-8 text-center bg-gradient-to-br ${gs.bg} shadow-xl ${gs.glow}`}>
                    <h2 className="text-7xl font-extrabold text-white drop-shadow-xl tracking-tight">{health_grade}</h2>
                    <p className="mt-2 text-xl font-bold text-white/80 uppercase tracking-widest">Health Grade</p>
                    <div className="mt-2 inline-block px-4 py-1.5 bg-white/15 rounded-full text-sm text-white/90 backdrop-blur-sm font-medium">
                        Confidence: {(confidence * 100).toFixed(1)}%
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {is_toxic && (
                        <div className="bg-red-900/40 border border-red-500/40 rounded-xl p-4 flex items-start gap-3">
                            <span className="text-red-400 text-2xl flex-shrink-0">☠</span>
                            <div>
                                <h3 className="text-base font-bold text-red-300">Toxicity Alert!</h3>
                                <p className="mt-1 text-sm text-red-300/80">
                                    This food contains <span className="font-bold text-red-200">{toxicity_reason}</span> which is toxic to this species.
                                </p>
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="text-sm font-bold text-white/70 uppercase tracking-wide mb-2 flex items-center gap-2">
                            <span className="p-1 rounded bg-purple-600/30">📋</span> Analysis Report
                        </h4>
                        <p className="whitespace-pre-wrap text-white/60 leading-relaxed text-sm">{explanation_text}</p>
                    </div>
                </div>
            </div>

            {/* Visualizations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-full">
                    <NutrientRadar features={graph_features} />
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col h-full">
                    <div className="mb-5 flex-grow">
                        <h4 className="font-bold text-white/70 uppercase tracking-wide text-sm mb-4 pb-2 border-b border-white/10 flex items-center gap-2">
                            <span className="p-1 rounded bg-purple-600/30">📊</span>
                            Top Influencing Factors
                        </h4>
                        <ul className="space-y-2">
                            {top_factors && top_factors.map((tf, index) => (
                                <li key={index} className="flex justify-between items-center text-sm p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                    <span className="font-medium text-white/70 capitalize">{tf.feature.replace(/_/g, ' ')}</span>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-xs text-white/40 font-mono">Val: {tf.value.toFixed(2)}</span>
                                        <span className="text-xs font-bold text-purple-300 bg-purple-600/30 px-2.5 py-1 rounded-md">Imp: {tf.importance.toFixed(2)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pt-5 border-t border-white/10">
                        <h4 className="font-bold text-white/70 uppercase tracking-wide text-sm mb-3 flex justify-between items-center">
                            <span>Caloric Density</span>
                            <span className="text-purple-300 bg-purple-600/20 px-2 py-0.5 rounded text-xs font-mono">{(predicted_caloric_density * 100).toFixed(0)}/100</span>
                        </h4>
                        <div className="relative pt-1">
                            <div className="overflow-hidden h-2.5 rounded-full bg-white/10">
                                <div
                                    style={{ width: `${predicted_caloric_density * 100}%` }}
                                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-out shadow-sm shadow-purple-400/30"
                                />
                            </div>
                            <p className="text-xs text-white/30 text-right mt-1">Higher = More calories per gram</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Graph Visualizer */}
            {graph_data && (
                <div className="h-[500px] w-full animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <GraphView graphData={graph_data} />
                </div>
            )}
        </div>
    );
}
