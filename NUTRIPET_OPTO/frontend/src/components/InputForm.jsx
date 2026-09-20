import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = "http://localhost:8000";

const ALWAYS_INCLUDED_FOODS = [
  "Chocolate (Dark)", "Chocolate (Milk)", "Garlic", "Onion (Raw)",
  "Grapes", "Raisins", "Avocado", "Xylitol", "Macadamia Nuts", "Alcohol", "Caffeine"
];

const QUICK_TEST_FOODS = [
  { name: "Chicken Breast", isToxic: false },
  { name: "Salmon", isToxic: false },
  { name: "Beef", isToxic: false },
  { name: "Broccoli", isToxic: false },
  { name: "Apple", isToxic: false },
  { name: "Chocolate (Dark)", isToxic: true },
  { name: "Garlic", isToxic: true },
  { name: "Grapes", isToxic: true },
  { name: "Avocado", isToxic: true },
];

const DIET_CATEGORY_MAP = {
  carnivore: ["Meat", "Seafood", "Dairy/Egg", "Other", "Toxic"],
  herbivore: ["Vegetable", "Fruit", "Grain/Bean", "Seed/Nut", "Other", "Toxic"],
  omnivore: ["Meat", "Seafood", "Dairy/Egg", "Vegetable", "Fruit", "Grain/Bean", "Seed/Nut", "Other", "Toxic"],
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

  const [speciesQuery, setSpeciesQuery] = useState('');
  const [foodQuery, setFoodQuery] = useState('');

  const [isSpeciesOpen, setIsSpeciesOpen] = useState(false);
  const [isFoodOpen, setIsFoodOpen] = useState(false);

  const [speciesHighlight, setSpeciesHighlight] = useState(0);
  const [foodHighlight, setFoodHighlight] = useState(0);

  const speciesBoxRef = useRef(null);
  const foodBoxRef = useRef(null);

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

    if (filtered.length > 0 && (!selectedFoodName || !filtered.find(f => f.name.toLowerCase() === selectedFoodName.toLowerCase()))) {
      setSelectedFoodName(filtered[0].name);
      setFoodQuery(filtered[0].name);
    }

    if (selectedCategory && !allowedCats.includes(selectedCategory)) {
      setSelectedCategory('');
    }
  }, [selectedSpeciesName, allFoods, dietType]);

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

  const matchingSpecies = speciesList.filter(s =>
    s.name.toLowerCase().includes(speciesQuery.toLowerCase().trim()) ||
    s.digestive_type.toLowerCase().includes(speciesQuery.toLowerCase().trim())
  );

  const matchingFoods = (foodQuery.trim() ? allFoods : filteredFoods).filter(f =>
    f.name.toLowerCase().includes(foodQuery.toLowerCase().trim()) ||
    f.category.toLowerCase().includes(foodQuery.toLowerCase().trim())
  );

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
      <div className="p-4 rounded-inputs bg-[#fbe1d1] text-[#5d2a1a] text-xs">
        <p className="font-bold">Database Error</p>
        <p className="mt-1">{fetchError}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pill Mode Switcher */}
      <div className="flex bg-[#f2f2f3] p-1 rounded-full">
        <button
          type="button"
          onClick={() => setMode('specific')}
          className={`flex-1 py-1.5 text-xs font-sans rounded-full transition-all ${
            mode === 'specific'
              ? 'bg-[#17191c] text-[#ffffff]'
              : 'text-[#777b86] hover:text-[#17191c]'
          }`}
        >
          Single Food
        </button>
        <button
          type="button"
          onClick={() => setMode('category')}
          className={`flex-1 py-1.5 text-xs font-sans rounded-full transition-all ${
            mode === 'category'
              ? 'bg-[#17191c] text-[#ffffff]'
              : 'text-[#777b86] hover:text-[#17191c]'
          }`}
        >
          Category Search
        </button>
      </div>

      {/* SPECIES SELECTION */}
      <div ref={speciesBoxRef} className="relative space-y-1.5">
        <label className="block text-xs font-sans text-[#777b86]">
          Pet Species
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
            placeholder="Type species (e.g. Dog, Cat, Rabbit)..."
            className="steep-input"
          />

          <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2 text-xs text-[#a3a6af]">
            {speciesQuery && (
              <button
                type="button"
                onClick={() => {
                  setSpeciesQuery('');
                  setIsSpeciesOpen(true);
                }}
                className="hover:text-[#17191c]"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsSpeciesOpen(!isSpeciesOpen)}
              className="hover:text-[#17191c]"
            >
              ▾
            </button>
          </div>
        </div>

        {/* Species Suggestions Popup */}
        {isSpeciesOpen && (
          <div className="absolute z-50 left-0 right-0 mt-2 max-h-56 overflow-y-auto bg-[#ffffff] border border-[#ececec] rounded-inputs shadow-subtle divide-y divide-[#ececec]">
            {matchingSpecies.length === 0 ? (
              <div className="p-3 text-center text-[#a3a6af] text-xs">
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
                    className={`px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${
                      isSelected
                        ? 'bg-[#f2f2f3] text-[#17191c] font-medium'
                        : isHighlighted
                        ? 'bg-[#fafafb] text-[#17191c]'
                        : 'text-[#17191c] hover:bg-[#fafafb]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{s.name}</span>
                      <span className="text-xs text-[#979799] capitalize">({s.digestive_type})</span>
                    </div>
                    {isSelected && <span className="text-xs text-[#17191c]">✓</span>}
                  </div>
                );
              })
            )}
          </div>
        )}

        {selectedSpecies && (
          <div className="p-3 rounded-inputs bg-[#f2f2f3] flex items-center justify-between text-xs text-[#777b86]">
            <span className="capitalize text-[#17191c]">
              {selectedSpecies.digestive_type} Diet
            </span>
            <span>
              {filteredFoods.length} compatible foods
            </span>
          </div>
        )}
      </div>

      {/* FOOD ITEM SELECTION */}
      {mode === 'specific' && (
        <div ref={foodBoxRef} className="relative space-y-1.5">
          <label className="block text-xs font-sans text-[#777b86]">
            Food Ingredient
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
              placeholder="Search ingredient (e.g. Chicken, Salmon, Chocolate)..."
              className="steep-input"
            />

            <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2 text-xs text-[#a3a6af]">
              {foodQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setFoodQuery('');
                    setIsFoodOpen(true);
                  }}
                  className="hover:text-[#17191c]"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsFoodOpen(!isFoodOpen)}
                className="hover:text-[#17191c]"
              >
                ▾
              </button>
            </div>
          </div>

          {/* Food Suggestions Popup */}
          {isFoodOpen && (
            <div className="absolute z-50 left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-[#ffffff] border border-[#ececec] rounded-inputs shadow-subtle divide-y divide-[#ececec]">
              {matchingFoods.length === 0 ? (
                <div className="p-3 text-center text-[#a3a6af] text-xs">
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
                      className={`px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${
                        isSelected
                          ? 'bg-[#f2f2f3] text-[#17191c] font-medium'
                          : isHighlighted
                          ? 'bg-[#fafafb] text-[#17191c]'
                          : 'text-[#17191c] hover:bg-[#fafafb]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{f.name}</p>
                          {isToxicItem && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#fbe1d1] text-[#5d2a1a]">
                              Toxin Test
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#979799]">
                          {f.category} · {f.calories} kcal · {f.protein_g}g protein
                        </p>
                      </div>
                      {isSelected && <span className="text-xs text-[#17191c]">✓</span>}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Quick-Test Items */}
          <div className="pt-2 space-y-2">
            <span className="text-xs text-[#979799] block font-sans">
              Quick Test Candidates:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TEST_FOODS.map((f) => {
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
                    className={`chip-pill ${isSelected ? 'selected' : ''} ${f.isToxic && !isSelected ? 'text-[#5d2a1a] bg-[#fbe1d1]/50 border-[#fbe1d1]' : ''}`}
                  >
                    <span>{f.name}</span>
                    {f.isToxic && <span className="text-[10px] text-[#5d2a1a]">!</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY GRID */}
      {mode === 'category' && (
        <div className="space-y-2">
          <label className="block text-xs font-sans text-[#777b86]">
            Food Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {allCategories.filter(c => allowedCats.includes(c)).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`p-3 text-left rounded-inputs text-xs font-sans transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#17191c] text-[#ffffff]'
                    : 'bg-[#f2f2f3] text-[#17191c] hover:bg-[#eaeaea]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={isLoading || (mode === 'category' ? !selectedCategory : (!selectedFoodName && !foodQuery))}
        className="btn-pill-filled w-full py-3.5 text-sm"
      >
        {isLoading ? "Analyzing..." : "Evaluate Ingredient →"}
      </button>
    </form>
  );
}
