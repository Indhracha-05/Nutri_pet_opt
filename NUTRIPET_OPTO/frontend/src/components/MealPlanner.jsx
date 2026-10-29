import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE = "http://localhost:8000";

const ACTIVITY_LEVELS = [
  { value: "inactive", label: "Inactive", desc: "Sedentary / recovering" },
  { value: "normal", label: "Normal", desc: "Typical daily activity" },
  { value: "active", label: "Active", desc: "Regular exercise / agility" },
  { value: "working", label: "Working", desc: "High-energy working animal" },
];

const COMMON_INGREDIENTS = [
  "Chicken Breast", "Beef", "Salmon", "Egg", "Sweet Potato",
  "Brown Rice", "Carrot", "Broccoli", "Pumpkin", "Spinach",
  "Lamb", "Turkey", "Tuna", "Oats", "Blueberries",
];

// ── Macro Bar ─────────────────────────────────────────────────────────────────
function MacroBar({ label, value, pct, colorBg }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-sans">
        <span className="text-[#777b86]">{label}</span>
        <span className="text-[#17191c] font-mono">
          {value}g <span className="text-[#a3a6af]">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#e2e2e4] w-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorBg}`}
          style={{ width: `${Math.min(100, pct)}%`, transition: "width 0.4s ease" }}
        />
      </div>
    </div>
  );
}

// ── Ingredient Tag Input ──────────────────────────────────────────────────────
function IngredientTagInput({ tags, setTags, suggestions }) {
  const [input, setInput] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const inputRef = useRef(null);

  const add = (val) => {
    const clean = val.trim();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setInput("");
    setFiltered([]);
    setShowDrop(false);
    inputRef.current?.focus();
  };

  const remove = (t) => setTags(tags.filter(x => x !== t));

  const onChange = (e) => {
    const v = e.target.value;
    setInput(v);
    if (v.length > 0) {
      setFiltered(suggestions.filter(s => s.toLowerCase().includes(v.toLowerCase()) && !tags.includes(s)));
      setShowDrop(true);
    } else {
      setShowDrop(false);
    }
  };

  const onKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      add(input);
    }
    if (e.key === "Backspace" && !input && tags.length) {
      remove(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-3">
      <div
        className="min-h-[48px] flex flex-wrap gap-2 items-center p-2.5 bg-[#ffffff] border border-[#ececec] rounded-inputs cursor-text focus-within:border-[#17191c]"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1.5 px-3 py-1 text-xs font-sans rounded-full bg-[#f2f2f3] text-[#17191c]">
            {t}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(t); }}
              className="text-[#777b86] hover:text-[#5d2a1a] ml-1 text-xs"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setShowDrop(false), 200)}
          placeholder={tags.length ? "" : "Type ingredient and press Enter..."}
          className="flex-1 min-w-[180px] bg-transparent outline-none text-sm text-[#17191c] placeholder-[#a3a6af]"
        />
      </div>

      {showDrop && filtered.length > 0 && (
        <div className="relative z-30">
          <div className="absolute w-full top-0 bg-[#ffffff] border border-[#ececec] rounded-inputs shadow-subtle max-h-48 overflow-y-auto divide-y divide-[#ececec]">
            {filtered.slice(0, 10).map(s => (
              <button
                key={s}
                type="button"
                onMouseDown={() => add(s)}
                className="w-full text-left px-4 py-2 text-xs text-[#17191c] hover:bg-[#fafafb] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick-add options */}
      <div className="flex flex-wrap gap-1.5">
        {COMMON_INGREDIENTS.filter(c => !tags.includes(c)).slice(0, 8).map(c => (
          <button
            key={c}
            type="button"
            onClick={() => add(c)}
            className="chip-pill text-xs py-1 px-3"
          >
            + {c}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Day Card ──────────────────────────────────────────────────────────────────
function DayCard({ day, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const { day_number, total_grams, total_calories, macro_summary, meals } = day;

  return (
    <div className="card-floating overflow-hidden p-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-[#fafafb] transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <span className="w-8 h-8 rounded-full bg-[#f2f2f3] flex items-center justify-center font-mono text-xs font-semibold text-[#17191c]">
            {day_number}
          </span>
          <div>
            <p className="font-serif text-base text-[#17191c]">Day {day_number} Schedule</p>
            <p className="text-xs text-[#777b86]">
              {Math.round(total_grams)}g total food mass · {Math.round(total_calories)} kcal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex gap-4 text-xs font-mono text-[#777b86]">
            <span>P: {macro_summary.protein_g}g</span>
            <span>F: {macro_summary.fat_g}g</span>
            <span>C: {macro_summary.carbs_g}g</span>
          </div>
          <span className="text-xs text-[#a3a6af] font-mono">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#ececec] divide-y divide-[#ececec] bg-[#ffffff]">
          {meals.map((meal, mi) => (
            <div key={mi} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-[#979799]">
                  {meal.meal_name}
                </span>
                <span className="text-xs font-mono text-[#777b86]">
                  {meal.total_grams}g · {Math.round(meal.total_calories)} kcal
                </span>
              </div>
              <div className="space-y-1.5">
                {meal.portions.map((p, pi) => (
                  <div key={pi} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#17191c] font-medium">{p.food_name}</span>
                      <span className="text-[10px] text-[#979799]">({p.category})</span>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-[#777b86]">
                      <span>{p.grams}g</span>
                      <span>{Math.round(p.calories)} kcal</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Macro Breakdown */}
          <div className="p-5 space-y-3 bg-[#fafafb]">
            <p className="text-xs text-[#979799] uppercase tracking-wider">
              Energy Distribution
            </p>
            <MacroBar label="Protein" value={macro_summary.protein_g} pct={macro_summary.protein_cal_pct} colorBg="bg-[#17191c]" />
            <MacroBar label="Fat" value={macro_summary.fat_g} pct={macro_summary.fat_cal_pct} colorBg="bg-[#5d2a1a]" />
            <MacroBar label="Carbohydrates" value={macro_summary.carbs_g} pct={macro_summary.carbs_cal_pct} colorBg="bg-[#777b86]" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Planner Component ────────────────────────────────────────────────────
export default function MealPlanner({ species }) {
  const [selectedSpecies, setSelectedSpecies] = useState(species?.[0]?.name || "");
  const [weightKg, setWeightKg] = useState(10);
  const [weightUnit, setWeightUnit] = useState("kg");
  const [activityLevel, setActivityLevel] = useState("normal");
  const [targetCaloriesOverride, setTargetCaloriesOverride] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [days, setDays] = useState(3);
  const [mealsPerDay, setMealsPerDay] = useState(2);
  const [allFoods, setAllFoods] = useState([]);

  // Pet Profile Integration
  const [petsList, setPetsList] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [saveStatus, setSaveStatus] = useState(null);

  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/foods`).then(r => setAllFoods(r.data.map(f => f.name))).catch(() => { });
    axios.get(`${API_BASE}/pets`).then(r => setPetsList(r.data)).catch(() => { });
  }, []);

  useEffect(() => {
    if (species?.length && !selectedSpecies) setSelectedSpecies(species[0].name);
  }, [species]);

  const handleSelectPet = (id) => {
    setSelectedPetId(id);
    if (!id) return;
    const pet = petsList.find(p => p.pet_id === parseInt(id));
    if (pet) {
      setSelectedSpecies(pet.species_name);
      setWeightKg(pet.weight_kg);
      setWeightUnit("kg");
      setActivityLevel(pet.activity_level || "normal");
    }
  };

  const handleSavePlanToPet = async () => {
    if (!selectedPetId) {
      alert("Please select a pet profile to save this diet to.");
      return;
    }
    const pet = petsList.find(p => p.pet_id === parseInt(selectedPetId));
    if (!pet || !plan) return;

    setSaveStatus("saving");
    try {
      const day1 = plan.daily_plans?.[0];
      const portions = day1?.ingredients?.map(ing => ({
        food_name: ing.food_name,
        category: ing.category,
        grams: ing.grams,
        calories: ing.calories
      })) || [];

      await axios.post(`${API_BASE}/pets/${pet.pet_id}/diets`, {
        diet_name: `${pet.name}'s Calibrated ${plan.days_planned}-Day Regimen`,
        diet_type: "Raw",
        daily_calories_target: plan.daily_target_calories,
        meals_per_day: plan.meals_per_day,
        schedule_time: "Morning & Evening Portions",
        ingredients_json: JSON.stringify(portions),
        is_active: true,
        notes: `Formulated by Smart Meal Planner. RER: ${Math.round(plan.rer_kcal)} kcal, MER: ${Math.round(plan.mer_kcal)} kcal. Target: ${Math.round(plan.daily_target_calories)} kcal/day.`
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const weightKgActual = weightUnit === "lbs" ? weightKg * 0.453592 : weightKg;

  const handleGenerate = async () => {
    if (!selectedSpecies) { setError("Please select a species."); return; }
    if (!ingredients.length) { setError("Please add at least one ingredient."); return; }
    setIsLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await axios.post(`${API_BASE}/plan`, {
        species_name: selectedSpecies,
        pet_weight_kg: parseFloat(weightKgActual.toFixed(2)),
        activity_level: activityLevel,
        target_calories_override: targetCaloriesOverride ? parseFloat(targetCaloriesOverride) : null,
        available_ingredients: ingredients,
        days,
        meals_per_day: mealsPerDay,
      });
      setPlan(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate meal plan.");
    } finally {
      setIsLoading(false);
    }
  };

  const toxicWarnings = plan?.warnings?.filter(w => w.includes("EXCLUDED")) || [];
  const infoWarnings = plan?.warnings?.filter(w => !w.includes("EXCLUDED")) || [];

  return (
    <div className="space-y-8">
      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Pet Profile */}
        <div className="lg:col-span-2 space-y-5 card-floating">
          <div>
            <span className="text-xs text-[#979799] uppercase tracking-wider block mb-1">
              Pet Profile
            </span>
            <h2 className="text-2xl font-serif text-[#17191c]">
              Biological Targets
            </h2>
          </div>

          {/* Auto-Fill from Pet Profile */}
          {petsList.length > 0 && (
            <div className="space-y-1.5 p-3 rounded-inputs bg-[#fafafb] border border-[#ececec]">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#17191c] flex items-center gap-1">
                  <span>🐾</span>
                  <span>Auto-Fill from Pet Profile</span>
                </label>
                <span className="text-[10px] text-[#777b86]">Optional</span>
              </div>
              <select
                value={selectedPetId}
                onChange={e => handleSelectPet(e.target.value)}
                className="w-full px-3 py-1.5 rounded-inputs border border-[#ececec] text-xs bg-white text-[#17191c] focus:outline-none focus:border-[#17191c]"
              >
                <option value="">— Select a registered pet —</option>
                {petsList.map(p => (
                  <option key={p.pet_id} value={p.pet_id}>
                    {p.avatar_emoji || "🐾"} {p.name} ({p.species_name}, {p.weight_kg}kg, {p.activity_level})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Species */}
          <div className="space-y-1">
            <label className="text-xs font-sans text-[#777b86]">Species</label>
            <select
              id="planner-species"
              value={selectedSpecies}
              onChange={e => setSelectedSpecies(e.target.value)}
              className="steep-input"
            >
              <option value="">— Select Species —</option>
              {(species || []).map(s => (
                <option key={s.species_id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Weight */}
          <div className="space-y-1">
            <label className="text-xs font-sans text-[#777b86]">Body Weight</label>
            <div className="flex gap-2">
              <input
                id="planner-weight"
                type="number" min="0.1" step="0.1"
                value={weightKg}
                onChange={e => setWeightKg(parseFloat(e.target.value) || 0)}
                className="steep-input flex-1"
              />
              <div className="flex bg-[#f2f2f3] p-1 rounded-full text-xs">
                {["kg", "lbs"].map(u => (
                  <button
                    key={u}
                    id={`planner-unit-${u}`}
                    type="button"
                    onClick={() => setWeightUnit(u)}
                    className={`px-3 py-1.5 rounded-full transition-colors ${
                      weightUnit === u ? "bg-[#17191c] text-[#ffffff]" : "text-[#777b86] hover:text-[#17191c]"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            {weightUnit === "lbs" && (
              <p className="text-[11px] text-[#a3a6af] font-mono">≈ {weightKgActual.toFixed(2)} kg</p>
            )}
          </div>

          {/* Activity Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-sans text-[#777b86]">Activity Level</label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITY_LEVELS.map(al => (
                <button
                  key={al.value}
                  id={`planner-activity-${al.value}`}
                  type="button"
                  onClick={() => setActivityLevel(al.value)}
                  className={`text-left p-3 rounded-inputs text-xs font-sans transition-all ${
                    activityLevel === al.value
                      ? "bg-[#17191c] text-[#ffffff]"
                      : "bg-[#f2f2f3] text-[#17191c] hover:bg-[#eaeaea]"
                  }`}
                >
                  <div className="font-semibold">{al.label}</div>
                  <div className="text-[10px] opacity-75">{al.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Days & Meals */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-sans text-[#777b86]">
                Days: <span className="font-mono text-[#17191c]">{days}</span>
              </label>
              <input
                id="planner-days"
                type="range" min="1" max="7" step="1" value={days}
                onChange={e => setDays(parseInt(e.target.value))}
                className="w-full accent-[#17191c]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-sans text-[#777b86]">Meals / Day</label>
              <div className="flex bg-[#f2f2f3] p-1 rounded-full text-xs">
                {[1, 2, 3].map(m => (
                  <button
                    key={m}
                    id={`planner-meals-${m}`}
                    type="button"
                    onClick={() => setMealsPerDay(m)}
                    className={`flex-1 py-1.5 rounded-full font-mono transition-colors ${
                      mealsPerDay === m ? "bg-[#17191c] text-[#ffffff]" : "text-[#777b86] hover:text-[#17191c]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Caloric override */}
          <div className="space-y-1">
            <label className="text-xs font-sans text-[#777b86]">
              Caloric Override <span className="text-[#a3a6af]">(optional)</span>
            </label>
            <input
              id="planner-calorie-override"
              type="number" min="0" placeholder="Auto (RER × MER)"
              value={targetCaloriesOverride}
              onChange={e => setTargetCaloriesOverride(e.target.value)}
              className="steep-input"
            />
          </div>
        </div>

        {/* Right: Ingredient Input */}
        <div className="lg:col-span-3 space-y-5 card-floating">
          <div>
            <span className="text-xs text-[#979799] uppercase tracking-wider block mb-1">
              Raw Ingredients
            </span>
            <h2 className="text-2xl font-serif text-[#17191c]">
              Available Feeds
            </h2>
          </div>

          <p className="text-xs text-[#777b86] leading-relaxed">
            Enter available raw ingredients. The optimizer balances mass, energy, and macronutrient targets, excluding any known toxic ingredients automatically.
          </p>

          <IngredientTagInput
            tags={ingredients}
            setTags={setIngredients}
            suggestions={[...new Set([...allFoods, ...COMMON_INGREDIENTS])]}
          />

          {ingredients.length > 0 && (
            <div className="text-xs text-[#777b86] flex items-center justify-between">
              <span>{ingredients.length} ingredient{ingredients.length !== 1 ? "s" : ""} selected</span>
              <button
                type="button"
                onClick={() => setIngredients([])}
                className="text-[#5d2a1a] hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          <button
            id="planner-generate-btn"
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !selectedSpecies || !ingredients.length}
            className="btn-pill-filled w-full py-3.5 text-sm"
          >
            {isLoading ? "Generating Balanced Formulation..." : `Generate ${days}-Day Formulation →`}
          </button>

          {error && (
            <div className="p-4 rounded-inputs bg-[#fbe1d1] text-[#5d2a1a] text-xs">
              <span className="font-bold">Formulation Error: </span>
              <span>{error}</span>
            </div>
          )}

          {!plan && !isLoading && !error && (
            <div className="p-6 rounded-inputs bg-[#fafafb] border border-dashed border-[#ececec] text-center space-y-1">
              <p className="text-sm font-serif text-[#17191c]">No Plan Generated</p>
              <p className="text-xs text-[#a3a6af]">
                Specify your pet's parameters and ingredients above to compute exact feeding portions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Generated Plan Output */}
      {plan && (
        <div className="space-y-6">
          {/* Excluded Toxic Ingredients Banner */}
          {toxicWarnings.length > 0 && (
            <div className="card-peach space-y-1">
              <p className="text-xs font-serif font-bold text-[#5d2a1a] uppercase tracking-wider">
                ⚠️ Hazardous Ingredients Excluded from Plan
              </p>
              {toxicWarnings.map((w, i) => (
                <p key={i} className="text-xs text-[#5d2a1a]">{w}</p>
              ))}
            </div>
          )}

          {infoWarnings.length > 0 && (
            <div className="p-5 rounded-cards bg-[#f2f2f3] space-y-1">
              <p className="text-xs font-bold text-[#17191c] uppercase tracking-wider">
                ℹ️ Formulation Notes
              </p>
              {infoWarnings.map((w, i) => (
                <p key={i} className="text-xs text-[#777b86]">{w}</p>
              ))}
            </div>
          )}

          {/* Metric Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Daily Target", value: `${Math.round(plan.daily_target_calories)} kcal`, sub: "Maintenance Energy" },
              { label: "RER", value: `${Math.round(plan.rer_kcal)} kcal`, sub: "Resting Energy Req." },
              { label: "Body Mass", value: `${plan.pet_weight_kg} kg`, sub: plan.species_name },
              { label: "Duration", value: `${plan.days_planned} Days`, sub: `${plan.meals_per_day} meals / day` },
            ].map((c, i) => (
              <div key={i} className="card-floating text-center space-y-1">
                <div className="text-2xl font-serif text-[#17191c]">{c.value}</div>
                <div className="text-xs font-sans text-[#777b86]">{c.label}</div>
                <div className="text-[10px] text-[#a3a6af] font-sans">{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Save to Pet Profile Card */}
          <div className="p-5 rounded-cards bg-[#fafafb] border border-[#ececec] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base">🐾</span>
                <h4 className="font-serif text-base text-[#17191c] font-medium">
                  {selectedPetId
                    ? `Save Formulation to ${petsList.find(p => p.pet_id === parseInt(selectedPetId))?.name}'s Profile`
                    : "Save to Registered Pet Profile"}
                </h4>
              </div>
              <p className="text-xs text-[#777b86]">
                Directly saves this computed portion breakdown as the pet's active feeding regimen in their clinical care profile.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!selectedPetId && (
                <select
                  onChange={e => handleSelectPet(e.target.value)}
                  className="px-3 py-2 rounded-inputs border border-[#ececec] text-xs bg-white text-[#17191c] focus:outline-none focus:border-[#17191c]"
                >
                  <option value="">— Select Target Pet —</option>
                  {petsList.map(p => (
                    <option key={p.pet_id} value={p.pet_id}>
                      {p.name} ({p.species_name})
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={handleSavePlanToPet}
                disabled={saveStatus === "saving" || !selectedPetId}
                className="btn-pill-filled text-xs py-2 px-5 whitespace-nowrap w-full sm:w-auto"
              >
                {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "✓ Saved as Active Diet!" : "Save as Active Diet →"}
              </button>
            </div>
          </div>

          {/* Day-by-Day Cards */}
          <div className="space-y-3">
            <h3 className="text-xs text-[#979799] uppercase tracking-wider">
              Day-by-Day Meal Portions
            </h3>
            <div className="space-y-4">
              {plan.daily_plans.map((day, i) => (
                <DayCard key={day.day_number} day={day} index={i} />
              ))}
            </div>
          </div>

          {/* Grocery Shopping List */}
          <div className="card-floating space-y-4">
            <div className="flex items-center justify-between border-b border-[#ececec] pb-3">
              <h3 className="text-lg font-serif text-[#17191c]">
                Total Ingredients ({plan.days_planned} Days)
              </h3>
            </div>

            <div className="divide-y divide-[#ececec]">
              {plan.grocery_list.map((g, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs font-sans">
                  <div>
                    <span className="font-medium text-[#17191c]">{g.food_name}</span>
                    <span className="text-[#a3a6af] ml-2">({g.category})</span>
                  </div>
                  <div className="flex items-center gap-6 font-mono">
                    <span className="text-[#17191c]">{Math.round(g.total_grams)}g</span>
                    {g.total_cost_usd > 0 && (
                      <span className="text-[#5d2a1a]">${g.total_cost_usd.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {plan.total_estimated_cost_usd > 0 && (
              <div className="flex justify-end pt-3 border-t border-[#ececec] text-xs font-sans">
                <span className="text-[#777b86]">Estimated Total: </span>
                <span className="font-mono font-bold text-[#17191c] ml-2">
                  ${plan.total_estimated_cost_usd.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
