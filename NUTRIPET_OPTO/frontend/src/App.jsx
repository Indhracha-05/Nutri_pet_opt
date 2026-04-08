import React, { useState } from 'react';
import axios from 'axios';
import InputForm from './components/InputForm';
import AnalysisResult from './components/AnalysisResult';
import CategoryResult from './components/CategoryResult';

const API_BASE = "http://localhost:8000";

function App() {
  const [result, setResult] = useState(null);
  const [categoryResult, setCategoryResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalysis = async ({ species_name, food_name }) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCategoryResult(null);

    try {
      const response = await axios.post(`${API_BASE}/analyze`, { species_name, food_name });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to analyze. Please check backend connection or inputs.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryAnalysis = async ({ species_name, category }) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCategoryResult(null);

    try {
      const response = await axios.post(`${API_BASE}/analyze/category`, { species_name, category, limit: 5 });
      setCategoryResult(response.data);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to analyze category. Please check backend connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 py-10 px-4">
      {/* Ambient glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-700/20 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-pink-700/15 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-semibold uppercase tracking-widest text-purple-300 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            AI-Powered · Knowledge Graph · ML Analysis
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 tracking-tight">
            🐾 NutriPet_Opto
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Real-time nutritional compatibility & toxicity analysis for your pet — powered by ML trained on veterinary guidelines.
          </p>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Input */}
          <div className="lg:col-span-4 space-y-5">
            {/* Form card */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
              <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-600/30">🔬</span>
                New Analysis
              </h2>
              <InputForm
                onAnalyze={handleAnalysis}
                onCategoryAnalyze={handleCategoryAnalysis}
                isLoading={isLoading}
              />
            </div>

            {/* Disclaimer */}
            <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-500/20 text-xs text-blue-300/80 leading-relaxed">
              <strong className="text-blue-300">⚠ Disclaimer:</strong> This tool uses AI models and public databases for educational purposes.
              Always consult a veterinarian for professional dietary advice.
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-8">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-72 space-y-5 text-white/50">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-purple-800 border-t-purple-400 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">🐾</div>
                </div>
                <p className="text-base font-medium animate-pulse">Running AI analysis...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-500/40 text-red-300 px-6 py-4 rounded-xl flex items-start gap-3">
                <span className="text-red-400 text-xl mt-0.5">⚠</span>
                <div>
                  <p className="font-bold text-red-200">Analysis Failed</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {!isLoading && !error && !result && !categoryResult && (
              <div className="flex flex-col items-center justify-center min-h-[400px] rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] space-y-4 text-white/30">
                <div className="text-7xl opacity-60">🐾</div>
                <p className="text-lg font-medium">Select a pet and food to begin analysis</p>
                <p className="text-sm">Try the <span className="text-purple-400">Food Category</span> mode to compare multiple foods at once</p>
              </div>
            )}

            {!isLoading && result && <AnalysisResult result={result} />}
            {!isLoading && categoryResult && <CategoryResult data={categoryResult} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
