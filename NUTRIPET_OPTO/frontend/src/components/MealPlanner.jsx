import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE = "http://localhost:8000";

const ACTIVITY_LEVELS = [
  { value: "inactive", label: "Inactive 🛋️", desc: "Sedentary / recovering" },
  { value: "normal", label: "Normal 🚶", desc: "Typical daily activity" },
  { value: "active", label: "Active 🏃", desc: "Regular exercise" },
  { value: "working", label: "Working 💪", desc: "High-energy working animal" },
];

const COMMON_INGREDIENTS = [
  "Chicken Breast", "Beef", "Salmon", "Egg", "Sweet Potato",
  "Brown Rice", "Carrot", "Broccoli", "Pumpkin", "Spinach",
  "Lamb", "Turkey", "Tuna", "Oats", "Blueberries",
];

// ── Macro Bar ─────────────────────────────────────────────────────────────────
function MacroBar({ label, value, pct, color }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-white/60">
        <span>{label}</span>
        <span>{value}g <span className="text-white/30">({pct}%)</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(100, pct)}%`, transition: "width 0.6s ease" }}
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
    <div className="space-y-2">
      <div
        className="min-h-[48px] flex flex-wrap gap-2 items-center p-3 rounded-xl bg-white/5 border border-white/10 focus-within:border-purple-500/60 transition-colors cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 px-2.5 py-1 text-sm rounded-full bg-purple-600/30 text-purple-200 border border-purple-500/30">
            {t}
            <button onClick={() => remove(t)} className="text-purple-400 hover:text-red-400 ml-0.5 text-xs leading-none">✕</button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setShowDrop(false), 150)}
          placeholder={tags.length ? "" : "Type ingredient and press Enter…"}
          className="flex-1 min-w-[160px] bg-transparent outline-none text-sm text-white placeholder-white/25"
        />
      </div>

      {showDrop && filtered.length > 0 && (
        <div className="relative z-30">
          <div className="absolute w-full top-0 rounded-xl bg-gray-900 border border-white/10 shadow-2xl max-h-48 overflow-y-auto">
            {filtered.slice(0, 10).map(s => (
              <button
                key={s}
                onMouseDown={() => add(s)}
                className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-purple-700/30 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick-add pills */}
      <div className="flex flex-wrap gap-1.5">
        {COMMON_INGREDIENTS.filter(c => !tags.includes(c)).slice(0, 8).map(c => (
          <button
            key={c}
            onClick={() => add(c)}
            className="px-2.5 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-purple-600/20 hover:text-white hover:border-purple-500/40 transition-all"
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
    <div className="rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden">
      {/* Day Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300">
            {day_number}
          </span>
          <div className="text-left">
            <p className="font-semibold text-white text-sm">Day {day_number}</p>
            <p className="text-xs text-white/40">{Math.round(total_grams)}g total · {Math.round(total_calories)} kcal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex gap-3 text-xs text-white/40">
            <span>P: {macro_summary.protein_g}g</span>
            <span>F: {macro_summary.fat_g}g</span>
            <span>C: {macro_summary.carbs_g}g</span>
          </div>
          <span className={`transition-transform duration-200 text-white/40 ${expanded ? "rotate-180" : ""}`}>▾</span>
        </div>
      </button>

      {/* Expanded Meals */}
      {expanded && (
        <div className="border-t border-white/5 divide-y divide-white/5">
          {meals.map((meal, mi) => (
            <div key={mi} className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-purple-300">{meal.meal_name}</span>
                <span className="text-xs text-white/40">{meal.total_grams}g · {Math.round(meal.total_calories)} kcal</span>
              </div>
              <div className="space-y-2">
                {meal.portions.map((p, pi) => (
                  <div key={pi} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <span className="text-white/80">{p.food_name}</span>
                      <span className="text-white/30 text-[10px] px-1.5 py-0.5 rounded bg-white/5">{p.category}</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/50">
                      <span className="font-mono">{p.grams}g</span>
                      <span className="font-mono">{Math.round(p.calories)} kcal</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Macro bars */}
          <div className="px-5 py-4 space-y-2 bg-white/[0.02]">
            <p className="text-xs text-white/30 font-medium uppercase tracking-wide mb-3">Macro Breakdown</p>
            <MacroBar label="Protein" value={macro_summary.protein_g} pct={macro_summary.protein_cal_pct} color="bg-blue-500" />
            <MacroBar label="Fat" value={macro_summary.fat_g} pct={macro_summary.fat_cal_pct} color="bg-amber-500" />
            <MacroBar label="Carbs" value={macro_summary.carbs_g} pct={macro_summary.carbs_cal_pct} color="bg-green-500" />
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

  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all food names for autocomplete
  useEffect(() => {
    axios.get(`${API_BASE}/foods`).then(r => setAllFoods(r.data.map(f => f.name))).catch(() => { });
  }, []);

  // Update species when prop changes
  useEffect(() => {
    if (species?.length && !selectedSpecies) setSelectedSpecies(species[0].name);
  }, [species]);

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
      {/* ── Config Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Pet Profile */}
        <div className="lg:col-span-2 space-y-5 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-600/30">🐾</span>
            Pet Profile
          </h2>

          {/* Species */}
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wide">Species</label>
            <select
              id="planner-species"
              value={selectedSpecies}
              onChange={e => setSelectedSpecies(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500/60 transition-colors"
            >
              <option value="">— Select Species —</option>
              {(species || []).map(s => (
                <option key={s.species_id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Weight */}
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wide">Body Weight</label>
            <div className="flex gap-2">
              <input
                id="planner-weight"
                type="number" min="0.1" step="0.1"
                value={weightKg}
                onChange={e => setWeightKg(parseFloat(e.target.value) || 0)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500/60 transition-colors"
              />
              <div className="flex rounded-xl overflow-hidden border border-white/10 text-xs">
                {["kg", "lbs"].map(u => (
                  <button
                    key={u}
                    id={`planner-unit-${u}`}
                    onClick={() => setWeightUnit(u)}
                    className={`px-3 py-2 transition-colors ${weightUnit === u ? "bg-purple-600 text-white" : "bg-white/5 text-white/40 hover:bg-white/10"}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            {weightUnit === "lbs" && (
              <p className="text-[11px] text-white/25">≈ {weightKgActual.toFixed(2)} kg</p>
            )}
          </div>

          {/* Activity */}
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wide">Activity Level</label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITY_LEVELS.map(al => (
                <button
                  key={al.value}
                  id={`planner-activity-${al.value}`}
                  onClick={() => setActivityLevel(al.value)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${activityLevel === al.value
                      ? "bg-purple-600/30 border-purple-500/50 text-white"
                      : "bg-white/[0.03] border-white/10 text-white/50 hover:border-white/20"
                    }`}
                >
                  <div className="font-semibold">{al.label}</div>
                  <div className="opacity-60 mt-0.5">{al.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Days & Meals sliders */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wide">
                Days <span className="text-purple-400 font-bold">{days}</span>
              </label>
              <input
                id="planner-days"
                type="range" min="1" max="7" step="1" value={days}
                onChange={e => setDays(parseInt(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-white/20"><span>1</span><span>7</span></div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wide">Meals/Day</label>
              <div className="flex rounded-xl overflow-hidden border border-white/10">
                {[1, 2, 3].map(m => (
                  <button
                    key={m}
                    id={`planner-meals-${m}`}
                    onClick={() => setMealsPerDay(m)}
                    className={`flex-1 py-2 text-xs transition-colors ${mealsPerDay === m ? "bg-purple-600 text-white" : "bg-white/5 text-white/40 hover:bg-white/10"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional calorie override */}
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wide">
              Override Daily Calories <span className="text-white/25">(optional)</span>
            </label>
            <input
              id="planner-calorie-override"
              type="number" min="0" placeholder="Auto-calculated (RER × MER)"
              value={targetCaloriesOverride}
              onChange={e => setTargetCaloriesOverride(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500/60 placeholder-white/20 transition-colors"
            />
          </div>
        </div>

        {/* Right: Ingredient Input + Generate */}
        <div className="lg:col-span-3 space-y-5 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600/30">🥩</span>
            Available Raw Ingredients
          </h2>
          <p className="text-xs text-white/40 leading-relaxed">
            Enter the raw ingredients you have available. The planner will calculate exact grams and calories per ingredient
            per meal — and automatically flag and exclude anything toxic for your pet.
          </p>

          <IngredientTagInput
            tags={ingredients}
            setTags={setIngredients}
            suggestions={[...new Set([...allFoods, ...COMMON_INGREDIENTS])]}
          />

          {ingredients.length > 0 && (
            <div className="text-xs text-white/40 flex items-center gap-2">
              <span className="text-purple-400">{ingredients.length}</span> ingredient{ingredients.length !== 1 ? "s" : ""} selected
              <button onClick={() => setIngredients([])} className="text-red-400/60 hover:text-red-400 ml-auto transition-colors">
                Clear all
              </button>
            </div>
          )}

          <button
            id="planner-generate-btn"
            onClick={handleGenerate}
            disabled={isLoading || !selectedSpecies || !ingredients.length}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
              bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500
              disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30
              active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Plan…
              </>
            ) : (
              <>📅 Generate {days}-Day Meal Plan</>
            )}
          </button>

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
              <span className="text-red-400 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Info panel when no plan yet */}
          {!plan && !isLoading && !error && (
            <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-2">
              <div className="text-4xl opacity-40">📅</div>
              <p className="text-sm text-white/30">Enter your pet's profile &amp; ingredients, then generate a plan</p>
              <p className="text-xs text-white/20">Powered by veterinary RER/MER caloric formulas + linear optimization</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      {plan && (
        <div className="space-y-6 animate-fade-in">

          {/* Toxic Safety Banner */}
          {toxicWarnings.length > 0 && (
            <div className="p-5 rounded-2xl bg-red-900/25 border border-red-500/30 space-y-2">
              <p className="text-red-300 font-bold text-sm flex items-center gap-2">
                ☠️ Toxic Ingredients Detected &amp; Excluded from Plan
              </p>
              {toxicWarnings.map((w, i) => (
                <p key={i} className="text-xs text-red-400/80 pl-6">{w}</p>
              ))}
            </div>
          )}

          {infoWarnings.length > 0 && (
            <div className="p-4 rounded-2xl bg-yellow-900/20 border border-yellow-500/25 space-y-1.5">
              <p className="text-yellow-300 font-bold text-xs flex items-center gap-2">⚠️ Notes</p>
              {infoWarnings.map((w, i) => (
                <p key={i} className="text-xs text-yellow-400/70 pl-5">{w}</p>
              ))}
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Daily Target", value: `${Math.round(plan.daily_target_calories)} kcal`, sub: "Maintenance Energy", icon: "🔥" },
              { label: "RER", value: `${Math.round(plan.rer_kcal)} kcal`, sub: "Resting Energy Req.", icon: "💤" },
              { label: "Body Weight", value: `${plan.pet_weight_kg} kg`, sub: plan.species_name, icon: "⚖️" },
              { label: "Plan Duration", value: `${plan.days_planned} Days`, sub: `${plan.meals_per_day} meals/day`, icon: "📅" },
            ].map((c, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-1">
                <div className="text-xl">{c.icon}</div>
                <div className="text-lg font-bold text-white">{c.value}</div>
                <div className="text-[11px] text-white/40">{c.label}</div>
                <div className="text-[10px] text-white/25">{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Day Cards */}
          <div>
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">
              📋 Day-by-Day Meal Plan
            </h3>
            <div className="space-y-3">
              {plan.daily_plans.map((day, i) => (
                <DayCard key={day.day_number} day={day} index={i} />
              ))}
            </div>
          </div>

          {/* Grocery List */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                🛒 Grocery Shopping List
              </h3>
              <span className="text-xs text-white/30 bg-white/5 px-3 py-1 rounded-full">
                {plan.days_planned}-day total
              </span>
            </div>
            <div className="space-y-2">
              {plan.grocery_list.map((g, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs text-white/40">{i + 1}</span>
                    <div>
                      <p className="text-sm text-white font-medium">{g.food_name}</p>
                      <p className="text-[11px] text-white/30">{g.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <p className="text-sm font-mono font-bold text-white">{Math.round(g.total_grams)}g</p>
                    {g.total_cost_usd > 0 && (
                      <p className="text-xs text-emerald-400 font-mono w-16">${g.total_cost_usd.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {plan.total_estimated_cost_usd > 0 && (
              <div className="flex justify-end pt-2">
                <div className="px-4 py-2 rounded-xl bg-emerald-900/30 border border-emerald-500/30 text-sm">
                  <span className="text-white/50">Estimated total: </span>
                  <span className="font-bold text-emerald-400">${plan.total_estimated_cost_usd.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Vet Disclaimer */}
          <div className="p-4 rounded-xl bg-blue-900/15 border border-blue-500/15 text-xs text-blue-300/60 leading-relaxed">
            <strong className="text-blue-300/80">⚕ Veterinary Note:</strong> Caloric requirements are estimated using WSAVA/NRC
            RER × MER formulas. Actual needs may vary by breed, health status, and reproductive state.
            Always consult a licensed veterinarian before changing your pet's diet.
          </div>
        </div>
      )}
    </div>
  );
}
