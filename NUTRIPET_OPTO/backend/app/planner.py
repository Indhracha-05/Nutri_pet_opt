"""
Meal Plan Optimizer for NutriPet_Opto.

Calculates veterinary-standard caloric requirements (RER/MER) and uses
constrained linear optimization to compute exact daily food portions (grams & calories)
based on user-provided available raw ingredients, pet species, and weight.
"""
import numpy as np
from scipy.optimize import linprog
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session

from .models import Species, Food
from .knowledge_graph import check_toxicity

# Activity level multipliers for Maintenance Energy Requirement (MER)
ACTIVITY_MULTIPLIERS = {
    "dog": {
        "inactive": 1.2,
        "normal": 1.6,
        "active": 2.0,
        "working": 3.0
    },
    "cat": {
        "inactive": 1.0,
        "normal": 1.2,
        "active": 1.4,
        "working": 1.6
    },
    "rabbit": {
        "inactive": 1.0,
        "normal": 1.1,
        "active": 1.2,
        "working": 1.3
    },
    "default": {
        "inactive": 1.0,
        "normal": 1.3,
        "active": 1.6,
        "working": 2.0
    }
}


def calculate_energy_requirements(species_name: str, weight_kg: float, activity_level: str = "normal") -> Tuple[float, float]:
    """
    Calculate Resting Energy Requirement (RER) and Maintenance Energy Requirement (MER).
    Formula (WSAVA/NRC):
      RER = 70 * (weight_kg ** 0.75)
      MER = RER * activity_multiplier
    """
    if weight_kg <= 0:
        weight_kg = 5.0  # default fallback

    rer = 70.0 * (weight_kg ** 0.75)
    
    species_key = species_name.lower()
    multipliers = ACTIVITY_MULTIPLIERS.get(species_key, ACTIVITY_MULTIPLIERS["default"])
    factor = multipliers.get(activity_level.lower(), 1.4)
    
    mer = rer * factor
    return round(rer, 1), round(mer, 1)


def optimize_daily_meal(
    available_foods: List[Food],
    species: Species,
    target_calories: float,
    seed_offset: int = 0
) -> Tuple[List[Dict[str, Any]], Dict[str, float]]:
    """
    Use linear programming to find ingredient quantities (grams) matching target calories
    and species macro tolerances (protein, fat, carbs) with natural variety.
    """
    n = len(available_foods)
    if n == 0:
        return [], {}

    # Food properties per 100g
    calories_per_100g = np.array([f.calories for f in available_foods])
    protein_per_100g = np.array([f.protein_g for f in available_foods])
    fat_per_100g = np.array([f.fat_g for f in available_foods])
    carbs_per_100g = np.array([f.carbs_g for f in available_foods])
    bioavailability = np.array([f.bioavailability_score for f in available_foods])
    costs = np.array([f.ingredient_cost_usd for f in available_foods])

    # Variables x_i = units of 100g (e.g. x_i = 1.5 means 150 grams)
    # Objective: Maximize bioavailability match while slightly favoring balanced cost/variety
    # Small permutation per day (seed_offset) for rotational variety
    np.random.seed(42 + seed_offset)
    variation_weights = 1.0 + 0.15 * np.sin(seed_offset + np.arange(n))
    c = -(bioavailability * variation_weights - 0.05 * costs)

    # Equality Constraint: Total Calories = target_calories
    A_eq = [calories_per_100g]
    b_eq = [target_calories]

    # Inequality Constraints:
    # 1. Total Protein >= minimum required % of target calories (4 kcal per g protein)
    # protein_calories >= target_calories * (species.protein_requirement / 100)
    # sum(x_i * protein_per_100g * 4) >= target_calories * (min_protein_pct / 100)
    min_protein_pct = max(species.protein_requirement * 0.7, 10.0)  # relaxed minimum
    A_ub = []
    b_ub = []

    # - sum(x_i * protein_per_100g * 4) <= - target_calories * (min_protein_pct / 100)
    A_ub.append(-protein_per_100g * 4.0)
    b_ub.append(-target_calories * (min_protein_pct / 100.0))

    # Upper bound for individual ingredient weight to prevent single-ingredient domination
    # Max 60% of total daily calories from any single ingredient if >= 2 ingredients available
    bounds = []
    max_cal_per_item = target_calories * 0.65 if n > 1 else target_calories
    min_weight = 0.05 if n <= 4 else 0.02  # At least 5g - 2g if included

    for i in range(n):
        cal = calories_per_100g[i]
        if cal > 0:
            max_units = max_cal_per_item / cal
        else:
            max_units = 3.0  # max 300g for non-caloric/leafy items
        bounds.append((0.0, max(max_units, 0.5)))

    # Solve linear program
    res = linprog(
        c=c,
        A_ub=A_ub if len(A_ub) > 0 else None,
        b_ub=b_ub if len(b_ub) > 0 else None,
        A_eq=A_eq,
        b_eq=b_eq,
        bounds=bounds,
        method="highs"
    )

    # If strict constraint was infeasible, fallback to calorie-proportional optimization
    if not res.success or res.x is None:
        # Fallback: Proportional allocation weighted by bioavailability & calorie content
        weights = bioavailability / (calories_per_100g + 1e-5)
        weights /= weights.sum()
        cal_alloc = target_calories * weights
        x_res = cal_alloc / calories_per_100g
    else:
        x_res = res.x

    # Format portions
    portions = []
    total_g = 0.0
    total_cal = 0.0
    total_p = 0.0
    total_f = 0.0
    total_c = 0.0

    for i, food in enumerate(available_foods):
        grams = float(round(x_res[i] * 100.0, 1))
        if grams < 1.0:
            continue
        
        cals = float(round((grams / 100.0) * food.calories, 1))
        p_g = float(round((grams / 100.0) * food.protein_g, 1))
        f_g = float(round((grams / 100.0) * food.fat_g, 1))
        c_g = float(round((grams / 100.0) * food.carbs_g, 1))
        cost = float(round((grams / 100.0) * food.ingredient_cost_usd, 2))

        total_g += grams
        total_cal += cals
        total_p += p_g
        total_f += f_g
        total_c += c_g

        portions.append({
            "food_id": food.food_id,
            "food_name": food.name,
            "category": food.category,
            "grams": grams,
            "calories": cals,
            "protein_g": p_g,
            "fat_g": f_g,
            "carbs_g": c_g,
            "cost_usd": cost,
            "percent_of_meal": 0.0  # calculated below
        })

    # Calculate percent of meal weight
    if total_g > 0:
        for p in portions:
            p["percent_of_meal"] = round((p["grams"] / total_g) * 100.0, 1)

    macro_summary = {
        "total_grams": round(total_g, 1),
        "total_calories": round(total_cal, 1),
        "protein_g": round(total_p, 1),
        "fat_g": round(total_f, 1),
        "carbs_g": round(total_c, 1),
        "protein_cal_pct": round((total_p * 4.0 / max(total_cal, 1.0)) * 100.0, 1),
        "fat_cal_pct": round((total_f * 9.0 / max(total_cal, 1.0)) * 100.0, 1),
        "carbs_cal_pct": round((total_c * 4.0 / max(total_cal, 1.0)) * 100.0, 1),
    }

    return portions, macro_summary


def generate_plan(
    species_name: str,
    weight_kg: float,
    activity_level: str,
    target_calories_override: float,
    available_ingredient_names: List[str],
    days: int,
    meals_per_day: int,
    db: Session,
    graph: Any
) -> Dict[str, Any]:
    """
    Main planner coordinator that checks safety, filters ingredients,
    and builds a day-wise meal schedule with portion breakdowns.
    """
    species = db.query(Species).filter(Species.name == species_name).first()
    if not species:
        raise ValueError(f"Species '{species_name}' not found")

    rer, mer = calculate_energy_requirements(species_name, weight_kg, activity_level)
    target_calories = target_calories_override if target_calories_override and target_calories_override > 0 else mer

    # Query food items for available ingredients
    warnings = []
    safe_foods = []
    excluded_toxic_foods = []

    def find_food(term: str) -> Optional[Food]:
        term = term.strip()
        # 1. Exact match
        f = db.query(Food).filter(Food.name.ilike(term)).first()
        if f:
            return f
        # 2. Substring match
        f = db.query(Food).filter(Food.name.ilike(f"%{term}%")).first()
        if f:
            return f
        # 3. Token-based match (e.g. "Brown Rice" matches "Rice (Brown Cooked)")
        words = [w for w in term.replace("(", " ").replace(")", " ").split() if len(w) > 2]
        if words:
            query = db.query(Food)
            for w in words:
                query = query.filter(Food.name.ilike(f"%{w}%"))
            f = query.first()
            if f:
                return f
        # 4. First significant word fallback
        if words:
            f = db.query(Food).filter(Food.name.ilike(f"%{words[0]}%")).first()
            if f:
                return f
        return None

    for name in available_ingredient_names:
        clean_name = name.strip()
        if not clean_name:
            continue
        
        food = find_food(clean_name)
        if not food:
            warnings.append(f"Ingredient '{clean_name}' was not found in database and was skipped.")
            continue

        # Toxicity check via Knowledge Graph
        is_toxic, toxic_compound, severity = check_toxicity(graph, species.name, food.name)
        if is_toxic:
            excluded_toxic_foods.append({
                "food_name": food.name,
                "toxic_compound": toxic_compound,
                "severity": severity
            })
            warnings.append(
                f"⚠️ EXCLUDED: {food.name} is {severity.upper()} TOXIC for {species.name}s ({toxic_compound}). Removed from meal plan."
            )
        else:
            if food not in safe_foods:
                safe_foods.append(food)


    if not safe_foods:
        raise ValueError("No safe ingredients available to formulate a meal plan. Please provide at least 1-2 safe ingredients.")

    # Generate day-wise plans
    daily_plans = []
    grocery_totals = {}

    days_count = max(1, min(days or 1, 7))
    meals_count = max(1, min(meals_per_day or 2, 3))

    meal_names_map = {
        1: ["Daily Meal"],
        2: ["Breakfast (50%)", "Dinner (50%)"],
        3: ["Breakfast (35%)", "Lunch (30%)", "Dinner (35%)"]
    }
    meal_splits = {
        1: [1.0],
        2: [0.5, 0.5],
        3: [0.35, 0.30, 0.35]
    }

    current_splits = meal_splits[meals_count]
    current_meal_names = meal_names_map[meals_count]

    for day_idx in range(1, days_count + 1):
        portions, macro_summary = optimize_daily_meal(
            available_foods=safe_foods,
            species=species,
            target_calories=target_calories,
            seed_offset=day_idx
        )

        # Break down into individual meals (e.g. Breakfast, Dinner)
        meals = []
        for m_idx, (m_name, ratio) in enumerate(zip(current_meal_names, current_splits)):
            meal_portions = []
            for p in portions:
                m_g = round(p["grams"] * ratio, 1)
                m_cal = round(p["calories"] * ratio, 1)
                meal_portions.append({
                    "food_name": p["food_name"],
                    "category": p["category"],
                    "grams": m_g,
                    "calories": m_cal,
                    "protein_g": round(p["protein_g"] * ratio, 1),
                    "fat_g": round(p["fat_g"] * ratio, 1),
                    "carbs_g": round(p["carbs_g"] * ratio, 1)
                })
            meals.append({
                "meal_name": m_name,
                "ratio": ratio,
                "total_grams": round(macro_summary["total_grams"] * ratio, 1),
                "total_calories": round(macro_summary["total_calories"] * ratio, 1),
                "portions": meal_portions
            })

        # Track grocery totals
        for p in portions:
            fname = p["food_name"]
            if fname not in grocery_totals:
                grocery_totals[fname] = {
                    "food_name": fname,
                    "category": p["category"],
                    "total_grams": 0.0,
                    "total_cost_usd": 0.0
                }
            grocery_totals[fname]["total_grams"] += p["grams"]
            grocery_totals[fname]["total_cost_usd"] += p["cost_usd"]

        daily_plans.append({
            "day_number": day_idx,
            "total_grams": macro_summary["total_grams"],
            "total_calories": macro_summary["total_calories"],
            "macro_summary": macro_summary,
            "ingredients": portions,
            "meals": meals
        })

    # Prepare grocery list summary
    grocery_list = []
    total_plan_cost = 0.0
    for g in grocery_totals.values():
        g["total_grams"] = round(g["total_grams"], 1)
        g["total_cost_usd"] = round(g["total_cost_usd"], 2)
        total_plan_cost += g["total_cost_usd"]
        grocery_list.append(g)

    return {
        "species_name": species.name,
        "pet_weight_kg": weight_kg,
        "activity_level": activity_level,
        "rer_kcal": rer,
        "mer_kcal": mer,
        "daily_target_calories": target_calories,
        "days_planned": days_count,
        "meals_per_day": meals_count,
        "warnings": warnings,
        "excluded_toxic_foods": excluded_toxic_foods,
        "daily_plans": daily_plans,
        "grocery_list": sorted(grocery_list, key=lambda x: x["total_grams"], reverse=True),
        "total_estimated_cost_usd": round(total_plan_cost, 2)
    }
