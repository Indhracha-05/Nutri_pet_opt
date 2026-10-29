import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import InputForm from '../components/InputForm';
import AnalysisResult from '../components/AnalysisResult';
import CategoryResult from '../components/CategoryResult';
import MealPlanner from '../components/MealPlanner';
import NotificationCenter from '../components/NotificationCenter';

const API_BASE = "http://localhost:8000";

const TABS = [
  { id: "analysis", label: "Food Safety & AI Grading" },
  { id: "planner", label: "Smart Meal Planner" },
];

function AnalyzerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "analysis");
  const [species, setSpecies] = useState([]);

  const [result, setResult] = useState(null);
  const [categoryResult, setCategoryResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
    <div className="min-h-screen bg-[#ffffff] text-[#17191c] flex flex-col justify-between selection:bg-[#fbe1d1] selection:text-[#5d2a1a]">
      {/* Steep Navigation Bar */}
      <header className="border-b border-[#ececec] bg-[#ffffff]">
        <div className="max-w-[1200px] mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-sans text-[#777b86] hover:text-[#17191c] transition-colors flex items-center gap-1"
            >
              <span>←</span>
              <span>Home</span>
            </button>
            <div className="h-4 w-px bg-[#ececec]" />
            <span className="font-serif text-xl text-[#17191c]">
              NutriPet
            </span>
          </div>

          {/* Header Action & Pill Tab Switcher */}
          <div className="flex items-center gap-3">
            <NotificationCenter />

            <button
              onClick={() => navigate('/pets')}
              className="px-4 py-2 text-xs font-sans rounded-full border border-[#ececec] text-[#17191c] hover:bg-[#fafafb] transition-all flex items-center gap-1.5"
            >
              <span>🐾</span>
              <span>Pet Profiles & Care</span>
            </button>

            <div className="flex items-center gap-2 bg-[#f2f2f3] p-1 rounded-full">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2 text-xs font-sans rounded-full transition-all ${
                      isActive
                        ? "bg-[#17191c] text-[#ffffff]"
                        : "text-[#777b86] hover:text-[#17191c]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-[1200px] mx-auto px-8 py-12 flex-1 w-full space-y-8">
        {activeTab === "analysis" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Inputs */}
            <div className="lg:col-span-4 space-y-6">
              <div className="card-floating space-y-6">
                <div>
                  <span className="text-xs text-[#979799] block mb-1">
                    Query Parameters
                  </span>
                  <h2 className="text-2xl font-serif text-[#17191c]">
                    Dietary Evaluation
                  </h2>
                </div>

                <InputForm
                  onAnalyze={handleAnalysis}
                  onCategoryAnalyze={handleCategoryAnalysis}
                  isLoading={isLoading}
                />
              </div>

              {/* Quiet Disclaimer Box */}
              <div className="p-5 rounded-inputs bg-[#fafafb] border border-[#ececec] text-xs text-[#777b86] leading-relaxed space-y-1">
                <p className="font-medium text-[#17191c]">Clinical Guidance Note</p>
                <p>
                  Assessments are computed using veterinary biochemistry heuristics and verified toxicity datasets. Informational only.
                </p>
              </div>
            </div>

            {/* Right Column: Output */}
            <div className="lg:col-span-8">
              {isLoading && (
                <div className="flex flex-col items-center justify-center min-h-[420px] rounded-cards bg-[#f2f2f3] space-y-4 text-[#777b86]">
                  <div className="w-8 h-8 border-2 border-[#ececec] border-t-[#17191c] rounded-full animate-spin" />
                  <p className="text-sm font-sans font-medium text-[#17191c]">
                    Computing metabolic evaluation...
                  </p>
                </div>
              )}

              {error && (
                <div className="p-6 rounded-cards bg-[#fbe1d1] text-[#5d2a1a] space-y-1">
                  <p className="font-serif font-bold text-base">Analysis Error</p>
                  <p className="text-xs">{error}</p>
                </div>
              )}

              {!isLoading && !error && !result && !categoryResult && (
                <div className="flex flex-col items-center justify-center min-h-[460px] rounded-cards bg-[#fafafb] border border-dashed border-[#ececec] p-12 text-center space-y-3">
                  <div className="text-2xl text-[#a3a6af]">◈</div>
                  <h3 className="text-xl font-serif text-[#17191c]">
                    Awaiting Dietary Query
                  </h3>
                  <p className="text-sm text-[#777b86] max-w-md leading-relaxed">
                    Select a pet species and food item on the left to review biological health grading, toxicity risks, and nutrient profiles.
                  </p>
                </div>
              )}

              {!isLoading && result && <AnalysisResult result={result} />}
              {!isLoading && categoryResult && <CategoryResult data={categoryResult} />}
            </div>
          </div>
        )}

        {/* Tab 2: Smart Meal Planner */}
        {activeTab === "planner" && (
          <div>
            <MealPlanner species={species} />
          </div>
        )}
      </main>

      {/* Steep Footer */}
      <footer className="border-t border-[#ececec] bg-[#ffffff] py-8 px-8">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-[#a3a6af] gap-2">
          <span>NutriPet System</span>
          <span>Steep Minimalist Editorial Style</span>
        </div>
      </footer>
    </div>
  );
}

export default AnalyzerPage;
