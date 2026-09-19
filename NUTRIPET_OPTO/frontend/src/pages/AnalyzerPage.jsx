import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import InputForm from '../components/InputForm';
import AnalysisResult from '../components/AnalysisResult';
import CategoryResult from '../components/CategoryResult';
import MealPlanner from '../components/MealPlanner';

const API_BASE = "http://localhost:8000";

const TABS = [
  { id: "analysis", label: "🔬 Food Safety & AI Grading", desc: "Single food & category analysis" },
  { id: "planner", label: "📅 Smart Meal Planner", desc: "Day-wise raw ingredient planner" },
];

function AnalyzerPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("analysis");
  const [species, setSpecies] = useState([]);

  const [result, setResult] = useState(null);
  const [categoryResult, setCategoryResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch species once for both tabs
  useEffect(() => {
    axios.get(`${API_BASE}/species`).then(r => setSpecies(r.data)).catch(() => { });
  }, []);

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
      setError(err.response?.data?.detail || "Failed to analyze. Please check backend connection or inputs.");
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
      setError(err.response?.data?.detail || "Failed to analyze category. Please check backend connection.");
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

      <div className="relative max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          {/* Back button */}
          <div className="flex justify-start mb-2">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm text-white/40 hover:text-white/80 transition-colors group px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:-translate-x-0.5 transition-transform">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Home
            </button>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 tracking-tight">
            🐾 NutriPet_Opto
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Real-time nutritional compatibility &amp; toxicity analysis for your pet — powered by ML trained on veterinary guidelines.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center">
          <div className="flex gap-1 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            {TABS.map(tab => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/40"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }`}
              >
                <span className="relative z-10">{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-white/50 font-normal whitespace-nowrap">
                    {tab.desc}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Food Safety & AI Grading Tab */}
        {activeTab === "analysis" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            {/* Left Column: Input */}
            <div className="lg:col-span-4 space-y-5">
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
        )}

        {/* Smart Meal Planner Tab */}
        {activeTab === "planner" && (
          <div className="animate-fade-in">
            <MealPlanner species={species} />
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyzerPage;
