import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = "http://localhost:8000";

const DIET_ICONS = { carnivore: "🥩", herbivore: "🌿", omnivore: "🍽️" };
const CATEGORY_ICONS = {
  "Meat": "🥩", "Seafood": "🐟", "Dairy/Egg": "🥚",
  "Vegetable": "🥦", "Fruit": "🍎", "Grain/Bean": "🌾",
  "Seed/Nut": "🌰", "Other": "🧪", "Toxic": "☠️"
};

const DIET_CATEGORY_MAP = {
  carnivore: ["Meat", "Seafood", "Dairy/Egg", "Other"],
  herbivore: ["Vegetable", "Fruit", "Grain/Bean", "Seed/Nut", "Other"],
  omnivore: ["Meat", "Seafood", "Dairy/Egg", "Vegetable", "Fruit", "Grain/Bean", "Seed/Nut", "Other"],
};

export default function InputForm({ onAnalyze, onCategoryAnalyze, isLoading }) {
  const [speciesList, setSpeciesList] = useState([]);
  const [allFoods, setAllFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  const [selectedSpeciesName, setSelectedSpeciesName] = useState('');
  const [selectedFoodName, setSelectedFoodName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [mode, setMode] = useState('specific'); // 'specific' | 'category'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchError(null);
        const [sRes, fRes, cRes] = await Promise.all([
          axios.get(`${API_BASE}/species`),
          axios.get(`${API_BASE}/foods`),
          axios.get(`${API_BASE}/categories`),
        ]);
        
        setSpeciesList(sRes.data);
        setAllFoods(fRes.data);
        setAllCategories(cRes.data.filter(c => c !== 'Toxic'));

        if (sRes.data.length > 0) setSelectedSpeciesName(sRes.data[0].name);
        if (fRes.data.length > 0) setSelectedFoodName(fRes.data[0].name);
      } catch (err) {
        console.error("Failed to fetch data", err);
        setFetchError("Backend connection failed. Please ensure the backend is running.");
      }
    };
    fetchData();
  }, []);

  const selectedSpecies = speciesList.find(s => s.name === selectedSpeciesName);
  const dietType = selectedSpecies?.digestive_type?.toLowerCase() || 'omnivore';
  const allowedCats = DIET_CATEGORY_MAP[dietType] || DIET_CATEGORY_MAP.omnivore;

  // Filter foods whenever species or allFoods changes
  useEffect(() => {
    if (!selectedSpeciesName) return;
    const filtered = allFoods.filter(f => allowedCats.includes(f.category));
    setFilteredFoods(filtered);
    
    // Auto-select first compatible food if current selection is invalid
    if (filtered.length > 0 && (!selectedFoodName || !filtered.find(f => f.name === selectedFoodName))) {
      setSelectedFoodName(filtered[0].name);
    }
    
    // Reset category if restricted
    if (selectedCategory && !allowedCats.includes(selectedCategory)) {
      setSelectedCategory('');
    }
  }, [selectedSpeciesName, allFoods, dietType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'specific') {
      if (!selectedSpeciesName || !selectedFoodName) return;
      onAnalyze({ species_name: selectedSpeciesName, food_name: selectedFoodName });
    } else {
      if (!selectedSpeciesName || !selectedCategory) return;
      onCategoryAnalyze({ species_name: selectedSpeciesName, category: selectedCategory });
    }
  };

  if (fetchError) {
    return (
      <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-300 text-sm">
        <p className="font-bold mb-1">❌ Connection Error</p>
        <p>{fetchError}</p>
        <p className="mt-2 text-xs opacity-70">Check if the backend terminal is running on port 8000.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pet Species Dropdown */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-purple-300 mb-2 flex items-center gap-2">
          🐾 Pet Species
        </label>
        <select
          value={selectedSpeciesName}
          onChange={(e) => setSelectedSpeciesName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-white/20 text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all appearance-none cursor-pointer"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}
        >
          {speciesList.length === 0 && <option>Loading species...</option>}
          {speciesList.map(s => (
            <option key={s.species_id} value={s.name}>
              {DIET_ICONS[s.digestive_type?.toLowerCase()] || '🐾'} {s.name} ({s.digestive_type})
            </option>
          ))}
        </select>
        {speciesList.length > 0 && (
          <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs">
            <span className="text-purple-300 font-bold uppercase">{dietType}</span>
            <span className="text-white/40">— showing only compatible foods</span>
          </div>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-xl overflow-hidden border border-white/10 p-1 bg-white/5">
        <button
          type="button"
          onClick={() => setMode('specific')}
          className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${mode === 'specific' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
        >
          Specific Food
        </button>
        <button
          type="button"
          onClick={() => setMode('category')}
          className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${mode === 'category' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
        >
          Branch Analysis
        </button>
      </div>

      {/* Food Item Dropdown */}
      {mode === 'specific' && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-purple-300 mb-2 flex items-center gap-2">
            🍽️ Food Item
          </label>
          <select
            value={selectedFoodName}
            onChange={(e) => setSelectedFoodName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-white/20 text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}
          >
            {filteredFoods.length === 0 && <option>No compatible foods found</option>}
            {filteredFoods.map(f => (
              <option key={f.food_id} value={f.name}>
                {CATEGORY_ICONS[f.category] || '🍴'} {f.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Category Grid Selection */}
      {mode === 'category' && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-purple-300 mb-2 flex items-center gap-2">
            🗂️ Food Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {allCategories.filter(c => allowedCats.includes(c)).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{CATEGORY_ICONS[cat] || '🍴'}</span>
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || (mode === 'specific' ? !selectedFoodName : !selectedCategory)}
        className={`w-full py-4 px-6 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
          isLoading
            ? 'bg-gray-700 cursor-not-allowed text-gray-400'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-xl shadow-purple-500/20 hover:shadow-purple-400/40 hover:-translate-y-0.5'
        }`}
      >
        {isLoading ? "Running AI..." : "🚀 Run AI Analysis"}
      </button>

      {speciesList.length === 0 && !fetchError && (
        <p className="text-[10px] text-white/30 text-center animate-pulse">
          Wait... connecting to database
        </p>
      )}
    </form>
  );
}
