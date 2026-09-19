import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = "http://localhost:8000";

const DIET_ICONS = {
  carnivore: "🥩",
  herbivore: "🌿",
  omnivore: "🍽️"
};

const SPECIES_ICONS = {
  "Dog": "🐶",
  "Cat": "🐱",
  "Rabbit": "🐰",
  "Hamster": "🐹",
  "Guinea Pig": "🐹",
  "Ferret": "🦡",
  "Bird": "🦜",
  "Horse": "🐴",
  "Fish": "🐟",
  "Turtle": "🐢"
};

const CATEGORY_ICONS = {
  "Meat": "🥩", "Seafood": "🐟", "Dairy/Egg": "🥚",
  "Vegetable": "🥦", "Fruit": "🍎", "Grain/Bean": "🌾",
  "Seed/Nut": "🌰", "Other": "🧪", "Toxic": "☠️"
};

// Diet type -> standard allowed categories
const DIET_CATEGORY_MAP = {
  carnivore: ["Meat", "Seafood", "Dairy/Egg", "Other", "Toxic"],
  herbivore: ["Vegetable", "Fruit", "Grain/Bean", "Seed/Nut", "Other", "Toxic"],
  omnivore: ["Meat", "Seafood", "Dairy/Egg", "Vegetable", "Fruit", "Grain/Bean", "Seed/Nut", "Other", "Toxic"],
};

// Known toxic foods to always include regardless of diet type
const ALWAYS_INCLUDED_FOODS = [
  "Chocolate (Dark)", "Chocolate (Milk)", "Garlic", "Onion (Raw)",
  "Grapes", "Raisins", "Avocado", "Xylitol", "Macadamia Nuts", "Alcohol", "Caffeine"
];

// Popular quick-test foods for 1-click testing (Safe + Toxic test cases)
const QUICK_TEST_FOODS = [
  { name: "Chicken Breast", icon: "🍗", isToxic: false },
  { name: "Salmon", icon: "🐟", isToxic: false },
  { name: "Beef", icon: "🥩", isToxic: false },
  { name: "Broccoli", icon: "🥦", isToxic: false },
  { name: "Apple", icon: "🍎", isToxic: false },
  { name: "Chocolate (Dark)", icon: "🍫", isToxic: true },
  { name: "Garlic", icon: "🧄", isToxic: true },
  { name: "Grapes", icon: "🍇", isToxic: true },
  { name: "Avocado", icon: "🥑", isToxic: true },
];

export default function InputForm({ onAnalyze, onCategoryAnalyze, isLoading }) {
  const [speciesList, setSpeciesList] = useState([]);
  const [allFoods, setAllFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  // Selected values
  const [selectedSpeciesName, setSelectedSpeciesName] = useState('');
  const [selectedFoodName, setSelectedFoodName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [mode, setMode] = useState('specific'); // 'specific' | 'category'

  // Typable input text states
  const [speciesQuery, setSpeciesQuery] = useState('');
  const [foodQuery, setFoodQuery] = useState('');

  // Dropdown open states
  const [isSpeciesOpen, setIsSpeciesOpen] = useState(false);
  const [isFoodOpen, setIsFoodOpen] = useState(false);

  // Active keyboard highlight index
  const [speciesHighlight, setSpeciesHighlight] = useState(0);
  const [foodHighlight, setFoodHighlight] = useState(0);

  const speciesBoxRef = useRef(null);
  const foodBoxRef = useRef(null);

  // Initial Fetch
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

        if (sRes.data.length > 0) {
          setSelectedSpeciesName(sRes.data[0].name);
          setSpeciesQuery(sRes.data[0].name);
        }
        if (fRes.data.length > 0) {
          setSelectedFoodName(fRes.data[0].name);
          setFoodQuery(fRes.data[0].name);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
        setFetchError("Backend connection failed. Please ensure the backend is running.");
      }
    };
    fetchData();
  }, []);

  const selectedSpecies = speciesList.find(
    s => s.name.toLowerCase() === selectedSpeciesName.toLowerCase()
  );
  const dietType = selectedSpecies?.digestive_type?.toLowerCase() || 'omnivore';
  const allowedCats = DIET_CATEGORY_MAP[dietType] || DIET_CATEGORY_MAP.omnivore;

  // Filter foods whenever species changes (Respects veg/non-veg diet + always retains toxic items)
  useEffect(() => {
    if (!selectedSpeciesName) return;

    const filtered = allFoods.filter(f => {
      const isAllowedCat = allowedCats.includes(f.category);
      const isAlwaysIncluded = ALWAYS_INCLUDED_FOODS.some(
        name => name.toLowerCase() === f.name.toLowerCase()
      );
      return isAllowedCat || isAlwaysIncluded;
    });

    setFilteredFoods(filtered);

    // If current selected food is not compatible with new species diet, switch to first compatible food
    if (filtered.length > 0 && (!selectedFoodName || !filtered.find(f => f.name.toLowerCase() === selectedFoodName.toLowerCase()))) {
      setSelectedFoodName(filtered[0].name);
      setFoodQuery(filtered[0].name);
    }

    if (selectedCategory && !allowedCats.includes(selectedCategory)) {
      setSelectedCategory('');
    }
  }, [selectedSpeciesName, allFoods, dietType]);

  // Click outside listener to close suggestion dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (speciesBoxRef.current && !speciesBoxRef.current.contains(event.target)) {
        setIsSpeciesOpen(false);
      }
      if (foodBoxRef.current && !foodBoxRef.current.contains(event.target)) {
        setIsFoodOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered lists for typable inputs
  const matchingSpecies = speciesList.filter(s =>
    s.name.toLowerCase().includes(speciesQuery.toLowerCase().trim()) ||
    s.digestive_type.toLowerCase().includes(speciesQuery.toLowerCase().trim())
  );

  // Search within filteredFoods first, or fallback to allFoods if user types a specific query
  const matchingFoods = (foodQuery.trim() ? allFoods : filteredFoods).filter(f =>
    f.name.toLowerCase().includes(foodQuery.toLowerCase().trim()) ||
    f.category.toLowerCase().includes(foodQuery.toLowerCase().trim())
  );

  // Selection handlers
  const handleSelectSpecies = (species) => {
    setSelectedSpeciesName(species.name);
    setSpeciesQuery(species.name);
    setIsSpeciesOpen(false);
  };

  const handleSelectFood = (food) => {
    setSelectedFoodName(food.name);
    setFoodQuery(food.name);
    setIsFoodOpen(false);
  };

  // Keyboard navigation for Species input
  const handleSpeciesKeyDown = (e) => {
    if (!isSpeciesOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsSpeciesOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSpeciesHighlight(prev => (prev < matchingSpecies.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSpeciesHighlight(prev => (prev > 0 ? prev - 1 : matchingSpecies.length - 1));
    } else if (e.key === 'Enter') {
      if (isSpeciesOpen && matchingSpecies[speciesHighlight]) {
        e.preventDefault();
        handleSelectSpecies(matchingSpecies[speciesHighlight]);
      }
    } else if (e.key === 'Escape') {
      setIsSpeciesOpen(false);
    }
  };

  // Keyboard navigation for Food input
  const handleFoodKeyDown = (e) => {
    if (!isFoodOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsFoodOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFoodHighlight(prev => (prev < matchingFoods.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFoodHighlight(prev => (prev > 0 ? prev - 1 : matchingFoods.length - 1));
    } else if (e.key === 'Enter') {
      if (isFoodOpen && matchingFoods[foodHighlight]) {
        e.preventDefault();
        handleSelectFood(matchingFoods[foodHighlight]);
      }
    } else if (e.key === 'Escape') {
      setIsFoodOpen(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'specific') {
      const targetSpecies = selectedSpeciesName || matchingSpecies[0]?.name;
      const targetFood = selectedFoodName || matchingFoods[0]?.name;
      if (!targetSpecies || !targetFood) return;
      onAnalyze({ species_name: targetSpecies, food_name: targetFood });
    } else {
      const targetSpecies = selectedSpeciesName || matchingSpecies[0]?.name;
      if (!targetSpecies || !selectedCategory) return;
      onCategoryAnalyze({ species_name: targetSpecies, category: selectedCategory });
    }
  };

  if (fetchError) {
    return (
      <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-300 text-sm">
        <p className="font-bold mb-1">❌ Connection Error</p>
        <p>{fetchError}</p>
        <p className="mt-2 text-xs opacity-70">Check if the backend is running on port 8000.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mode Switcher */}
      <div className="flex rounded-xl overflow-hidden border border-white/10 p-1 bg-white/5">
        <button
          type="button"
          onClick={() => setMode('specific')}
          className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${mode === 'specific'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
              : 'text-white/40 hover:text-white/70'
            }`}
        >
          Specific Food
        </button>
        <button
          type="button"
          onClick={() => setMode('category')}
          className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${mode === 'category'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
              : 'text-white/40 hover:text-white/70'
            }`}
        >
          Branch Analysis
        </button>
      </div>

      {/* BOX 1: TYPABLE PET SPECIES */}
      <div ref={speciesBoxRef} className="relative">
        <label className="block text-xs font-bold uppercase tracking-widest text-purple-300 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">🐾 Pet Species</span>
          <span className="text-[10px] text-white/40 lowercase">type to search</span>
        </label>

        <div className="relative">
          <input
            type="text"
            value={speciesQuery}
            onChange={(e) => {
              setSpeciesQuery(e.target.value);
              setIsSpeciesOpen(true);
              setSpeciesHighlight(0);
            }}
            onFocus={() => setIsSpeciesOpen(true)}
            onKeyDown={handleSpeciesKeyDown}
            placeholder="Type species (e.g. Dog, Cat, Rabbit, Horse)..."
            className="w-full px-4 py-3 pr-10 rounded-xl bg-gray-900 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 text-sm transition-all"
          />

          {/* Dropdown Toggle / Clear Icon */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1">
            {speciesQuery && (
              <button
                type="button"
                onClick={() => {
                  setSpeciesQuery('');
                  setIsSpeciesOpen(true);
                }}
                className="text-white/30 hover:text-white/70 text-xs px-1"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsSpeciesOpen(!isSpeciesOpen)}
              className="text-white/40 hover:text-white/70 p-1"
            >
              <svg className={`w-4 h-4 transition-transform ${isSpeciesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Species Suggestions Popup */}
        {isSpeciesOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl bg-gray-900 border border-purple-500/40 backdrop-blur-xl shadow-2xl divide-y divide-white/5 animate-fade-in">
            {matchingSpecies.length === 0 ? (
              <div className="p-3 text-center text-white/40 text-xs">
                No species matching "{speciesQuery}"
              </div>
            ) : (
              matchingSpecies.map((s, idx) => {
                const isSelected = selectedSpeciesName.toLowerCase() === s.name.toLowerCase();
                const isHighlighted = speciesHighlight === idx;
                return (
                  <div
                    key={s.species_id}
                    onClick={() => handleSelectSpecies(s)}
                    onMouseEnter={() => setSpeciesHighlight(idx)}
                    className={`px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm transition-colors ${isSelected
                        ? 'bg-purple-600/30 text-white font-bold'
                        : isHighlighted
                          ? 'bg-white/10 text-white'
                          : 'text-white/80 hover:bg-white/5'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{SPECIES_ICONS[s.name] || DIET_ICONS[s.digestive_type?.toLowerCase()] || '🐾'}</span>
                      <span>{s.name}</span>
                      <span className="text-xs text-white/40 capitalize">({s.digestive_type})</span>
                    </div>
                    {isSelected && (
                      <span className="text-xs text-purple-300 font-bold">✓</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Diet Compatibility Badge */}
        {selectedSpecies && (
          <div className="mt-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs">
            <span className="text-purple-300 font-bold uppercase flex items-center gap-1.5">
              <span>{DIET_ICONS[dietType] || '🍽️'}</span>
              <span>{dietType}</span>
            </span>
            <span className="text-white/40">{filteredFoods.length} compatible & test foods</span>
          </div>
        )}
      </div>

      {/* BOX 2: TYPABLE FOOD ITEM (SPECIFIC MODE) */}
      {mode === 'specific' && (
        <div ref={foodBoxRef} className="relative space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-purple-300 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">🍽️ Food Item</span>
            <span className="text-[10px] text-white/40 lowercase">type to search & match</span>
          </label>

          <div className="relative">
            <input
              type="text"
              value={foodQuery}
              onChange={(e) => {
                setFoodQuery(e.target.value);
                setIsFoodOpen(true);
                setFoodHighlight(0);
              }}
              onFocus={() => setIsFoodOpen(true)}
              onKeyDown={handleFoodKeyDown}
              placeholder="Type food (e.g. Salmon, Chicken, Chocolate, Garlic)..."
              className="w-full px-4 py-3 pr-10 rounded-xl bg-gray-900 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 text-sm transition-all"
            />

            {/* Dropdown Toggle / Clear Icon */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1">
              {foodQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setFoodQuery('');
                    setIsFoodOpen(true);
                  }}
                  className="text-white/30 hover:text-white/70 text-xs px-1"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsFoodOpen(!isFoodOpen)}
                className="text-white/40 hover:text-white/70 p-1"
              >
                <svg className={`w-4 h-4 transition-transform ${isFoodOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Food Suggestions Popup */}
          {isFoodOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl bg-gray-900 border border-purple-500/40 backdrop-blur-xl shadow-2xl divide-y divide-white/5 animate-fade-in">
              {matchingFoods.length === 0 ? (
                <div className="p-3 text-center text-white/40 text-xs">
                  No foods matching "{foodQuery}"
                </div>
              ) : (
                matchingFoods.map((f, idx) => {
                  const isSelected = selectedFoodName.toLowerCase() === f.name.toLowerCase();
                  const isHighlighted = foodHighlight === idx;
                  const isToxicItem = f.category === 'Toxic' || ALWAYS_INCLUDED_FOODS.some(name => name.toLowerCase() === f.name.toLowerCase());

                  return (
                    <div
                      key={f.food_id}
                      onClick={() => handleSelectFood(f)}
                      onMouseEnter={() => setFoodHighlight(idx)}
                      className={`px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm transition-colors ${isSelected
                          ? 'bg-purple-600/30 text-white font-bold'
                          : isHighlighted
                            ? 'bg-white/10 text-white'
                            : 'text-white/80 hover:bg-white/5'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base flex-shrink-0">{CATEGORY_ICONS[f.category] || '🍴'}</span>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-medium">{f.name}</p>
                            {isToxicItem && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                                ☠ Toxin Test
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/40">
                            {f.category} · {f.calories} kcal · {f.protein_g}g protein
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-xs text-purple-300 font-bold ml-2 flex-shrink-0">✓</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Quick-Test Suggestions Pills (Safe + Toxic test items) */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                ⚡ Quick Test Foods:
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TEST_FOODS.map(f => {
                const isSelected = selectedFoodName.toLowerCase() === f.name.toLowerCase();
                return (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => {
                      const match = allFoods.find(food => food.name.toLowerCase() === f.name.toLowerCase());
                      if (match) handleSelectFood(match);
                      else {
                        setSelectedFoodName(f.name);
                        setFoodQuery(f.name);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 border ${isSelected
                        ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                        : !f.isToxic
                          ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                          : 'bg-red-500/10 border-red-500/25 text-red-300/90 hover:bg-red-500/20 hover:text-red-200'
                      }`}
                  >
                    <span>{f.icon}</span>
                    <span>{f.name}</span>
                    {f.isToxic && <span className="text-[9px] text-red-400 font-bold">⚠️</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY GRID (BRANCH MODE) */}
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
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${selectedCategory === cat
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

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={isLoading || (mode === 'category' ? !selectedCategory : (!selectedFoodName && !foodQuery))}
        className={`w-full py-4 px-6 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-2 ${isLoading
            ? 'bg-gray-700 cursor-not-allowed text-gray-400'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-xl shadow-purple-500/20 hover:shadow-purple-400/40 hover:-translate-y-0.5 cursor-pointer'
          }`}
      >
        {isLoading ? "Running AI..." : "🚀 Run AI Analysis"}
      </button>

      {speciesList.length === 0 && !fetchError && (
        <p className="text-[10px] text-white/30 text-center animate-pulse">
          Connecting to database...
        </p>
      )}
    </form>
  );
}
