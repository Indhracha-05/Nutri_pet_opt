"""
Knowledge Graph Engine for NutriPet_Opto.

Uses NetworkX to build a directed graph encoding species–food–nutrient–toxin
relationships. Extracts features for the ML grading model and produces
Cytoscape.js-compatible JSON for frontend visualization.
"""
import networkx as nx
import numpy as np
from typing import Optional


def build_graph(species_list: list[dict], food_list: list[dict], toxicity_list: list[dict]) -> nx.DiGraph:
    """
    Build a knowledge graph from species, food, and toxicity data.

    Node types: Species, Food, Nutrient, ToxicCompound
    Edge types: contains, intolerant_to, requires, high_in, sensitive_to
    """
    G = nx.DiGraph()

    # --- Add Species nodes ---
    for sp in species_list:
        G.add_node(
            f"species:{sp['name']}",
            node_type="Species",
            label=sp["name"],
            protein_req=sp["protein_requirement"],
            fat_tol=sp["fat_tolerance"],
            carb_tol=sp["carb_tolerance"],
            omega3_req=sp["omega3_requirement"],
            omega6_req=sp["omega6_requirement"],
            digestive_type=sp["digestive_type"],
        )

        # Species → requires → Nutrient nodes
        for nutrient, value in [
            ("Protein", sp["protein_requirement"]),
            ("Omega-3", sp["omega3_requirement"]),
            ("Omega-6", sp["omega6_requirement"]),
        ]:
            nutrient_node = f"nutrient:{nutrient}"
            if not G.has_node(nutrient_node):
                G.add_node(nutrient_node, node_type="Nutrient", label=nutrient)
            G.add_edge(f"species:{sp['name']}", nutrient_node, relation="requires", min_value=value)

        # Species sensitivities
        sensitivities = sp.get("known_sensitivities", "")
        if sensitivities:
            for sens in str(sensitivities).split(","):
                sens = sens.strip()
                if sens:
                    compound_node = f"compound:{sens}"
                    if not G.has_node(compound_node):
                        G.add_node(compound_node, node_type="ToxicCompound", label=sens)
                    G.add_edge(f"species:{sp['name']}", compound_node, relation="sensitive_to")

    # --- Add Food nodes ---
    for food in food_list:
        food_node = f"food:{food['name']}"
        G.add_node(
            food_node,
            node_type="Food",
            label=food["name"],
            protein_g=food["protein_g"],
            fat_g=food["fat_g"],
            carbs_g=food["carbs_g"],
            fiber_g=food["fiber_g"],
            sugar_g=food["sugar_g"],
            calories=food["calories"],
            omega3_mg=food["omega3_mg"],
            omega6_mg=food["omega6_mg"],
            bioavailability=food["bioavailability_score"],
            glycemic_index=food["glycemic_index"],
            cost_usd=food["ingredient_cost_usd"],
        )

        # Food → contains → Nutrient edges (for dominant nutrients)
        macros = {
            "Protein": food["protein_g"],
            "Fat": food["fat_g"],
            "Carbs": food["carbs_g"],
            "Fiber": food["fiber_g"],
            "Sugar": food["sugar_g"],
            "Omega-3": food["omega3_mg"],
            "Omega-6": food["omega6_mg"],
        }
        for nutrient, value in macros.items():
            nutrient_node = f"nutrient:{nutrient}"
            if not G.has_node(nutrient_node):
                G.add_node(nutrient_node, node_type="Nutrient", label=nutrient)
            G.add_edge(food_node, nutrient_node, relation="contains", amount=value)

        # "high_in" edges for dominant macros
        total_macro = food["protein_g"] + food["fat_g"] + food["carbs_g"]
        if total_macro > 0:
            if food["protein_g"] / total_macro > 0.4:
                G.add_edge(food_node, "nutrient:Protein", relation="high_in")
            if food["fat_g"] / total_macro > 0.4:
                G.add_edge(food_node, "nutrient:Fat", relation="high_in")
            if food["carbs_g"] / total_macro > 0.4:
                G.add_edge(food_node, "nutrient:Carbs", relation="high_in")
        if food["sugar_g"] > 10:
            if not G.has_node("nutrient:Sugar"):
                G.add_node("nutrient:Sugar", node_type="Nutrient", label="Sugar")
            G.add_edge(food_node, "nutrient:Sugar", relation="high_in")

    # --- Add Toxicity edges ---
    for tox in toxicity_list:
        species_node = f"species:{tox['species_name']}"
        food_node = f"food:{tox['food_name']}"
        compound_node = f"compound:{tox['toxic_compound']}"

        if not G.has_node(compound_node):
            G.add_node(compound_node, node_type="ToxicCompound", label=tox["toxic_compound"])

        # Food → contains → ToxicCompound
        G.add_edge(food_node, compound_node, relation="contains_toxin", severity=tox["severity"])

        # Species → intolerant_to → ToxicCompound
        G.add_edge(species_node, compound_node, relation="intolerant_to", severity=tox["severity"])

    return G


def check_toxicity(graph: nx.DiGraph, species_name: str, food_name: str) -> tuple[bool, Optional[str], Optional[str]]:
    """
    Check if a food is toxic to a species.

    Returns:
        (is_toxic, toxic_compound, severity) or (False, None, None)
    """
    species_node = f"species:{species_name}"
    food_node = f"food:{food_name}"

    if not graph.has_node(species_node) or not graph.has_node(food_node):
        return False, None, None

    # Find compounds that the food contains AND the species is intolerant to
    food_compounds = set()
    for _, target, data in graph.out_edges(food_node, data=True):
        if data.get("relation") == "contains_toxin":
            food_compounds.add((target, data.get("severity", "unknown")))

    species_intolerances = set()
    for _, target, data in graph.out_edges(species_node, data=True):
        if data.get("relation") in ("intolerant_to", "sensitive_to"):
            species_intolerances.add(target)

    # Check intersection
    severity_rank = {"lethal": 4, "high": 3, "moderate": 2, "low": 1, "unknown": 0}
    worst_compound = None
    worst_severity = None
    worst_rank = -1

    for compound_node, severity in food_compounds:
        if compound_node in species_intolerances:
            rank = severity_rank.get(severity, 0)
            if rank > worst_rank:
                worst_rank = rank
                worst_compound = graph.nodes[compound_node].get("label", compound_node)
                worst_severity = severity

    if worst_compound:
        return True, worst_compound, worst_severity
    return False, None, None


def extract_graph_features(graph: nx.DiGraph, species_name: str, food_name: str) -> dict:
    """
    Extract numerical features from the knowledge graph for ML model input.

    Returns dict with keys:
        toxin_flag, protein_match, fat_match, carb_tolerance,
        sugar_risk, omega_balance, bioavailability_match,
        glycemic_risk, digestibility_index, fiber_compatibility
    """
    species_node = f"species:{species_name}"
    food_node = f"food:{food_name}"

    # Default features (all zero / neutral)
    features = {
        "toxin_flag": 0.0,
        "protein_match": 0.0,
        "fat_match": 0.0,
        "carb_tolerance": 0.0,
        "sugar_risk": 0.0,
        "omega_balance": 0.0,
        "bioavailability_match": 0.0,
        "glycemic_risk": 0.0,
        "digestibility_index": 0.0,
        "fiber_compatibility": 0.0,
    }

    if not graph.has_node(species_node) or not graph.has_node(food_node):
        return features

    sp = graph.nodes[species_node]
    fd = graph.nodes[food_node]

    # 1. Toxin flag
    is_toxic, _, severity = check_toxicity(graph, species_name, food_name)
    if is_toxic:
        severity_map = {"lethal": 1.0, "high": 0.8, "moderate": 0.5, "low": 0.2}
        features["toxin_flag"] = severity_map.get(severity, 0.5)

    # 2. Protein match: how well food protein aligns with species requirement
    protein_req = sp.get("protein_req", 18.0)
    protein_food = fd.get("protein_g", 0.0)
    # Score: 1.0 if food protein >= requirement, decreases as gap grows
    if protein_req > 0:
        features["protein_match"] = min(protein_food / protein_req, 2.0) / 2.0
    else:
        features["protein_match"] = 0.5

    # 3. Fat match: penalize if fat exceeds species tolerance
    fat_tol = sp.get("fat_tol", 25.0)
    fat_food = fd.get("fat_g", 0.0)
    if fat_tol > 0:
        ratio = fat_food / fat_tol
        features["fat_match"] = max(0, 1.0 - max(0, ratio - 1.0))  # 1.0 if within tolerance
    else:
        features["fat_match"] = 0.5

    # 4. Carb tolerance: penalize if carbs exceed species tolerance
    carb_tol = sp.get("carb_tol", 50.0)
    carbs_food = fd.get("carbs_g", 0.0)
    if carb_tol > 0:
        ratio = carbs_food / carb_tol
        features["carb_tolerance"] = max(0, 1.0 - max(0, ratio - 0.8) * 2)
    else:
        features["carb_tolerance"] = 0.5

    # 5. Sugar risk: higher sugar = higher risk (penalty)
    sugar = fd.get("sugar_g", 0.0)
    features["sugar_risk"] = min(sugar / 20.0, 1.0)  # Normalized: 20g+ = max risk

    # 6. Omega balance: how well omega-3/6 match species requirements
    omega3_food = fd.get("omega3_mg", 0.0)
    omega6_food = fd.get("omega6_mg", 0.0)
    omega3_req = sp.get("omega3_req", 50.0)
    omega6_req = sp.get("omega6_req", 500.0)

    omega3_score = min(omega3_food / max(omega3_req, 1), 2.0) / 2.0
    omega6_score = min(omega6_food / max(omega6_req, 1), 2.0) / 2.0
    features["omega_balance"] = (omega3_score + omega6_score) / 2.0

    # 7. Bioavailability match
    bioavail = fd.get("bioavailability", 0.5)
    features["bioavailability_match"] = bioavail

    # 8. Glycemic risk: high GI = higher risk for most pets
    gi = fd.get("glycemic_index", 50.0)
    features["glycemic_risk"] = min(gi / 100.0, 1.0)

    # 9. Digestibility index: based on digestive type compatibility
    digestive_type = sp.get("digestive_type", "omnivore")
    protein_food = fd.get("protein_g", 0.0)
    carbs_food = fd.get("carbs_g", 0.0)

    if digestive_type == "carnivore":
        # Carnivores digest protein well, not carbs
        total = protein_food + carbs_food + 0.01
        features["digestibility_index"] = (protein_food / total) * bioavail
    elif digestive_type == "herbivore":
        # Herbivores digest carbs/fiber well, not excess protein
        fiber = fd.get("fiber_g", 0.0)
        total = protein_food + carbs_food + fiber + 0.01
        features["digestibility_index"] = ((carbs_food + fiber) / total) * bioavail
    else:
        # Omnivores handle both reasonably
        features["digestibility_index"] = bioavail * 0.85

    # 10. Fiber compatibility
    fiber = fd.get("fiber_g", 0.0)
    if digestive_type == "herbivore":
        features["fiber_compatibility"] = min(fiber / 10.0, 1.0)
    elif digestive_type == "carnivore":
        features["fiber_compatibility"] = max(0, 1.0 - fiber / 15.0)
    else:
        features["fiber_compatibility"] = max(0, 1.0 - abs(fiber - 3.0) / 10.0)

    # Clamp all features to [0, 1]
    for key in features:
        features[key] = float(np.clip(features[key], 0.0, 1.0))

    return features


def graph_to_cytoscape_json(graph: nx.DiGraph, species_name: str, food_name: str) -> dict:
    """
    Extract the relevant subgraph for a species+food query and convert to
    Cytoscape.js-compatible JSON format.
    """
    species_node = f"species:{species_name}"
    food_node = f"food:{food_name}"

    # Collect relevant nodes (species, food, and their immediate neighbors)
    relevant_nodes = set()
    if graph.has_node(species_node):
        relevant_nodes.add(species_node)
        for _, target, data in graph.out_edges(species_node, data=True):
            relevant_nodes.add(target)

    if graph.has_node(food_node):
        relevant_nodes.add(food_node)
        for _, target, data in graph.out_edges(food_node, data=True):
            relevant_nodes.add(target)

    # Build Cytoscape elements
    elements = []

    # Nodes
    color_map = {
        "Species": "#4CAF50",
        "Food": "#2196F3",
        "Nutrient": "#FF9800",
        "ToxicCompound": "#F44336",
    }

    for node_id in relevant_nodes:
        if not graph.has_node(node_id):
            continue
        node_data = graph.nodes[node_id]
        node_type = node_data.get("node_type", "Unknown")
        elements.append({
            "data": {
                "id": node_id,
                "label": node_data.get("label", node_id),
                "type": node_type,
                "color": color_map.get(node_type, "#9E9E9E"),
            }
        })

    # Edges
    edge_colors = {
        "contains": "#90CAF9",
        "contains_toxin": "#EF5350",
        "requires": "#66BB6A",
        "high_in": "#FFB74D",
        "intolerant_to": "#EF5350",
        "sensitive_to": "#FF7043",
    }

    for source, target, data in graph.edges(data=True):
        if source in relevant_nodes and target in relevant_nodes:
            relation = data.get("relation", "related")
            elements.append({
                "data": {
                    "source": source,
                    "target": target,
                    "label": relation,
                    "color": edge_colors.get(relation, "#BDBDBD"),
                }
            })

    return {"elements": elements}
