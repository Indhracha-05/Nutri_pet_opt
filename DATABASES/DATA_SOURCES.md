# 📊 Data Sources Documentation — NutriPet_Opto

## 1. Data Sources & Specific Files

### 1.1 USDA FoodData Central (Primary Source)
- **Source URL**: [https://fdc.nal.usda.gov/download-datasets.html](https://fdc.nal.usda.gov/download-datasets.html)
- **Specific Dataset Used**: **SR Legacy Foods (Standard Reference)**
  - File: `SR_Legacy_Foods.zip` (specifically `food.csv` and `nutrient.csv`)
  - Rationale: The Standard Reference dataset provides the most comprehensive historical data on basic commodities (fruits, vegetables, meats) used in pet food, compared to the newer branded food products.
- **Data Extracted**:
  - Proximates: Protein, Fat, Carbohydrate, Fiber, Sugar, Energy (Kcal)
  - Micronutrients: Fatty acids (Omega-3/6 markers), Calcium, Phosphorus

### 1.2 ASPCA Animal Poison Control Center
- **Source URL**: [https://www.aspca.org/pet-care/animal-poison-control](https://www.aspca.org/pet-care/animal-poison-control)
- **Specific Resources References**:
  - *“People Foods to Avoid Feeding Your Pets”* (Web List)- https://www.aspca.org/pet-care/aspca-poison-control/people-foods-avoid-feeding-your-pets
  - *“Toxic and Non-Toxic Plants List”* (Database)- https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants
- **Data Extracted**:
  - List of toxic substances (e.g., Theobromine, Xylitol, Allium compounds)
  - Severity classification (derived from "clinical signs" descriptions: mild GI upset vs. life-threatening)

### 1.3 AAFCO & NRC Guidelines
- **Source**: Association of American Feed Control Officials (2023 Official Publication) & NRC Nutrient Requirements of Dogs and Cats.
- **Specific Tables Used**:
  - *“AAFCO Dog and Cat Food Nutrient Profiles”* (Table of minimum/maximum values)
  - Used for: Determining `protein_requirement`, `fat_tolerance`, and mineral thresholds for each species.

---

## 2. Dataset Description

### 2.1 Overview
This dataset contains detailed nutritional profiles of raw and processed ingredients used in pet food, combined with species-specific nutritional requirements and known toxicity data.

- **Total records**: ~1,056 rows (8 species × 132 foods)
- **Primary format**: CSV/TSV (raw) → SQLite database (processed)

### 2.2 Tables & Attributes

#### Species Table (8 records)
| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Species name (Dog, Cat, Rabbit, etc.) |
| `protein_requirement` | Float | Minimum protein % of diet |
| `fat_tolerance` | Float | Maximum fat % tolerable |
| `carb_tolerance` | Float | Maximum carb % tolerable |
| `omega3_requirement` | Float | Min omega-3 mg/kg body weight |
| `omega6_requirement` | Float | Min omega-6 mg/kg body weight |
| `digestive_type` | String | carnivore / omnivore / herbivore |
| `known_sensitivities` | Text | Comma-separated sensitivity list |

#### Food Table (120+ records)
| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | Food item name |
| `protein_g` | Float | Protein in grams per 100g |
| `fat_g` | Float | Fat in grams per 100g |
| `carbs_g` | Float | Carbohydrates in grams per 100g |
| `fiber_g` | Float | Fiber in grams per 100g |
| `sugar_g` | Float | Sugar in grams per 100g |
| `calories` | Float | Kilocalories per 100g |
| `omega3_mg` | Float | Omega-3 fatty acids in mg per 100g |
| `omega6_mg` | Float | Omega-6 fatty acids in mg per 100g |
| `bioavailability_score` | Float | Absorption rate (0.0–1.0) |
| `glycemic_index` | Float | Glycemic index (0–100) |
| `ingredient_cost_usd` | Float | Cost per 100g in USD |

**Target Variables:**
- `predicted_caloric_density` (regression) — predicted from nutritional profile
- `health_grade` (classification) — A through F, calculated from nutritional compatibility

#### Toxicity Table (80+ records)
| Attribute | Type | Description |
|-----------|------|-------------|
| `species_name` | String (FK) | Pet species |
| `food_name` | String (FK) | Food item |
| `toxic_compound` | String | Name of toxic substance |
| `severity` | String | low / moderate / high / lethal |

---

## 3. Ethics & Bias Awareness

### 3.1 Ethical Considerations
- **Not a veterinary substitute**: This system provides informational guidance only. All predictions carry a disclaimer: *"This is not a replacement for professional veterinary consultation."*
- **No medical claims**: Outputs are based on dataset patterns, not clinical trials.
- **Data citations**: All data sources are publicly available and properly cited.

### 3.2 Bias Mitigation
- **Species diversity**: Dataset covers 8 species (dogs, cats, rabbits, hamsters, birds, fish, guinea pigs, turtles) to avoid single-species bias.
- **Food diversity**: 120+ food items spanning proteins, grains, fruits, vegetables, nuts, oils, and known toxic items.
- **Severity balance**: Toxicity data includes all severity levels (low to lethal) to avoid skewing toward extreme cases.
- **Geographic bias**: Data primarily from U.S. sources (USDA, ASPCA, AAFCO); may not reflect regional food variants.

### 3.3 Limitations
- Nutritional values are per 100g serving and may vary by preparation method.
- Toxicity severity can vary by pet size, age, and pre-existing conditions.
- Omega-3/6 and bioavailability values are approximations based on available literature.
- Cost data reflects approximate U.S. market prices and may vary by region.
