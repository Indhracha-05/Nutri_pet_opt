"""
Exploratory Data Analysis for NutriPet_Opto.

Covers DA1 Rubric 4 (8 marks — highest weight!):
  - Statistical Analysis: correlations and summary statistics with interpretation
  - Visualization: clear, labelled plots showing patterns/trends
  - Insights: meaningful observations and data-driven conclusions

Generates 10+ plots saved to backend/ml/plots/

Usage:
    cd backend
    python ml/eda.py
"""
import os
import sys
import warnings
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns

warnings.filterwarnings("ignore")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

ML_DIR = os.path.dirname(__file__)
PLOTS_DIR = os.path.join(ML_DIR, "plots")


def ensure_plots_dir():
    os.makedirs(PLOTS_DIR, exist_ok=True)


def load_data() -> pd.DataFrame:
    """Load processed dataset (or raw if processed doesn't exist)."""
    processed_path = os.path.join(ML_DIR, "processed_data.csv")
    raw_path = os.path.join(ML_DIR, "training_data.csv")
    path = processed_path if os.path.exists(processed_path) else raw_path
    df = pd.read_csv(path)
    print(f"📂 Loaded: {path} ({df.shape[0]} rows × {df.shape[1]} cols)")
    return df


def summary_statistics(df: pd.DataFrame):
    """Generate and save summary statistics."""
    print("\n📊 Summary Statistics")
    print("-" * 50)

    numeric_cols = [
        "protein_g", "fat_g", "carbs_g", "fiber_g", "sugar_g", "calories",
        "omega3_mg", "omega6_mg", "bioavailability_score", "glycemic_index",
        "ingredient_cost_usd", "toxin_flag", "protein_match", "fat_match",
        "carb_tolerance", "sugar_risk", "omega_balance", "digestibility_index",
    ]
    numeric_cols = [c for c in numeric_cols if c in df.columns]

    stats = df[numeric_cols].describe().T
    stats["skewness"] = df[numeric_cols].skew()
    stats["kurtosis"] = df[numeric_cols].kurtosis()

    # Save to CSV
    stats_path = os.path.join(ML_DIR, "summary_statistics.csv")
    stats.to_csv(stats_path)
    print(stats.to_string())
    print(f"\n  → Saved to {stats_path}")

    return stats


def plot_grade_distribution(df: pd.DataFrame):
    """1. Grade distribution histogram."""
    fig, ax = plt.subplots(figsize=(10, 6))
    grade_order = ["A", "B", "C", "D", "E", "F"]
    colors = ["#2ecc71", "#27ae60", "#f1c40f", "#e67e22", "#e74c3c", "#c0392b"]

    grade_counts = df["health_grade"].value_counts().reindex(grade_order, fill_value=0)
    bars = ax.bar(grade_counts.index, grade_counts.values, color=colors, edgecolor="white",
                  linewidth=1.5)

    # Add value labels
    for bar, val in zip(bars, grade_counts.values):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 5,
                f"{val}\n({val/len(df)*100:.1f}%)", ha="center", va="bottom", fontweight="bold")

    ax.set_xlabel("Health Grade", fontsize=13)
    ax.set_ylabel("Count", fontsize=13)
    ax.set_title("Distribution of Health Grades (A–F)", fontsize=15, fontweight="bold")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    plt.tight_layout()
    fig.savefig(os.path.join(PLOTS_DIR, "grade_distribution.png"), dpi=150, bbox_inches="tight")
    plt.close(fig)
    print("  ✅ grade_distribution.png")


def plot_caloric_density(df: pd.DataFrame):
    """2. Caloric density distribution."""
    if "predicted_caloric_density" not in df.columns:
        return
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # Histogram
    axes[0].hist(df["predicted_caloric_density"], bins=30, color="#3498db",
                 edgecolor="white", alpha=0.8)
    axes[0].set_xlabel("Predicted Caloric Density", fontsize=12)
    axes[0].set_ylabel("Frequency", fontsize=12)
    axes[0].set_title("Caloric Density Distribution", fontsize=14, fontweight="bold")
    axes[0].axvline(df["predicted_caloric_density"].mean(), color="red", linestyle="--",
                    label=f"Mean: {df['predicted_caloric_density'].mean():.3f}")
    axes[0].legend()

    # By grade
    grade_order = ["A", "B", "C", "D", "E", "F"]
    colors = ["#2ecc71", "#27ae60", "#f1c40f", "#e67e22", "#e74c3c", "#c0392b"]
    grade_data = [df[df["health_grade"] == g]["predicted_caloric_density"].values
                  for g in grade_order if g in df["health_grade"].values]
    grade_labels = [g for g in grade_order if g in df["health_grade"].values]
    bp = axes[1].boxplot(grade_data, labels=grade_labels, patch_artist=True)
    for patch, color in zip(bp["boxes"], colors[:len(grade_labels)]):
        patch.set_facecolor(color)
        patch.set_alpha(0.7)
    axes[1].set_xlabel("Health Grade", fontsize=12)
    axes[1].set_ylabel("Caloric Density", fontsize=12)
    axes[1].set_title("Caloric Density by Grade", fontsize=14, fontweight="bold")

    plt.tight_layout()
    fig.savefig(os.path.join(PLOTS_DIR, "caloric_density_distribution.png"), dpi=150, bbox_inches="tight")
    plt.close(fig)
    print("  ✅ caloric_density_distribution.png")


def plot_correlation_heatmap(df: pd.DataFrame):
    """3. Feature correlation heatmap."""
    feature_cols = [
        "toxin_flag", "protein_match", "fat_match", "carb_tolerance",
        "sugar_risk", "omega_balance", "bioavailability_match",
        "glycemic_risk", "digestibility_index", "fiber_compatibility",
    ]
    feature_cols = [c for c in feature_cols if c in df.columns]

    corr = df[feature_cols].corr()

    fig, ax = plt.subplots(figsize=(12, 10))
    mask = np.triu(np.ones_like(corr, dtype=bool))
    sns.heatmap(corr, mask=mask, annot=True, fmt=".2f", cmap="RdYlGn",
                center=0, square=True, linewidths=0.5, ax=ax,
                cbar_kws={"shrink": 0.8})
    ax.set_title("Feature Correlation Heatmap", fontsize=15, fontweight="bold")
    plt.tight_layout()
    fig.savefig(os.path.join(PLOTS_DIR, "correlation_heatmap.png"), dpi=150, bbox_inches="tight")
    plt.close(fig)
    print("  ✅ correlation_heatmap.png")

    # Print top correlations
    print("\n  Top 5 Feature Correlations:")
    corr_pairs = []
    for i in range(len(feature_cols)):
        for j in range(i+1, len(feature_cols)):
            corr_pairs.append((feature_cols[i], feature_cols[j], corr.iloc[i, j]))
    corr_pairs.sort(key=lambda x: abs(x[2]), reverse=True)
    for f1, f2, val in corr_pairs[:5]:
        print(f"    {f1} ↔ {f2}: {val:.3f}")


def plot_protein_vs_grade(df: pd.DataFrame):
    """4. Protein match by grade."""
    fig, ax = plt.subplots(figsize=(10, 6))
    grade_order = ["A", "B", "C", "D", "E", "F"]
    colors = ["#2ecc71", "#27ae60", "#f1c40f", "#e67e22", "#e74c3c", "#c0392b"]

    data = [df[df["health_grade"] == g]["protein_match"].values
            for g in grade_order if g in df["health_grade"].values]
    labels = [g for g in grade_order if g in df["health_grade"].values]

    bp = ax.boxplot(data, labels=labels, patch_artist=True, widths=0.6)
    for patch, color in zip(bp["boxes"], colors[:len(labels)]):
        patch.set_facecolor(color)
        patch.set_alpha(0.7)

    ax.set_xlabel("Health Grade", fontsize=13)
    ax.set_ylabel("Protein Match Score", fontsize=13)
    ax.set_title("Protein Match Score Distribution by Health Grade", fontsize=15, fontweight="bold")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    plt.tight_layout()
    fig.savefig(os.path.join(PLOTS_DIR, "protein_vs_grade.png"), dpi=150, bbox_inches="tight")
    plt.close(fig)
    print("  ✅ protein_vs_grade.png")


def plot_sugar_vs_grade(df: pd.DataFrame):
    """5. Sugar risk by grade."""
    fig, ax = plt.subplots(figsize=(10, 6))
    grade_order = ["A", "B", "C", "D", "E", "F"]
    colors = ["#2ecc71", "#27ae60", "#f1c40f", "#e67e22", "#e74c3c", "#c0392b"]

    data = [df[df["health_grade"] == g]["sugar_risk"].values
            for g in grade_order if g in df["health_grade"].values]
    labels = [g for g in grade_order if g in df["health_grade"].values]

    bp = ax.boxplot(data, labels=labels, patch_artist=True, widths=0.6)
    for patch, color in zip(bp["boxes"], colors[:len(labels)]):
        patch.set_facecolor(color)
        patch.set_alpha(0.7)

    ax.set_xlabel("Health Grade", fontsize=13)
    ax.set_ylabel("Sugar Risk Score", fontsize=13)
    ax.set_title("Sugar Risk Score Distribution by Health Grade", fontsize=15, fontweight="bold")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    plt.tight_layout()
    fig.savefig(os.path.join(PLOTS_DIR, "sugar_vs_grade.png"), dpi=150, bbox_inches="tight")
    plt.close(fig)
    print("  ✅ sugar_vs_grade.png")


def plot_toxicity_vs_grade(df: pd.DataFrame):
    """6. Toxicity flag vs grade."""
    fig, ax = plt.subplots(figsize=(10, 6))

    # Create toxic/non-toxic groups
    df_toxic = df[df["toxin_flag"] > 0]
    df_safe = df[df["toxin_flag"] == 0]

    grade_order = ["A", "B", "C", "D", "E", "F"]
    toxic_counts = df_toxic["health_grade"].value_counts().reindex(grade_order, fill_value=0)
    safe_counts = df_safe["health_grade"].value_counts().reindex(grade_order, fill_value=0)

    x = np.arange(len(grade_order))
    width = 0.35
    ax.bar(x - width/2, safe_counts.values, width, label="Non-Toxic", color="#2ecc71", alpha=0.8)
    ax.bar(x + width/2, toxic_counts.values, width, label="Toxic", color="#e74c3c", alpha=0.8)

    ax.set_xlabel("Health Grade", fontsize=13)
    ax.set_ylabel("Count", fontsize=13)
    ax.set_title("Toxicity Flag vs Health Grade Distribution", fontsize=15, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(grade_order)
    ax.legend(fontsize=12)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    plt.tight_layout()
    fig.savefig(os.path.join(PLOTS_DIR, "toxicity_vs_grade.png"), dpi=150, bbox_inches="tight")
    plt.close(fig)
    print("  ✅ toxicity_vs_grade.png")


def plot_omega_balance(df: pd.DataFrame):
    """7. Omega-3/6 ratio analysis."""
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    # Omega ratio by species
    if "species" in df.columns:
        species_omega = df.groupby("species")[["omega3_mg", "omega6_mg"]].mean()
        species_omega.plot(kind="bar", ax=axes[0], color=["#3498db", "#e67e22"], alpha=0.8)
        axes[0].set_title("Avg Omega-3/6 by Species", fontsize=14, fontweight="bold")
        axes[0].set_ylabel("mg per 100g (food avg)", fontsize=12)
        axes[0].tick_params(axis="x", rotation=45)
        axes[0].legend(["Omega-3", "Omega-6"])

    # Omega balance vs grade
    grade_order = ["A", "B", "C", "D", "E", "F"]
    data = [df[df["health_grade"] == g]["omega_balance"].values
            for g in grade_order if g in df["health_grade"].values]
    labels = [g for g in grade_order if g in df["health_grade"].values]
    colors = ["#2ecc71", "#27ae60", "#f1c40f", "#e67e22", "#e74c3c", "#c0392b"]

    bp = axes[1].boxplot(data, labels=labels, patch_artist=True)
    for patch, color in zip(bp["boxes"], colors[:len(labels)]):
        patch.set_facecolor(color)
        patch.set_alpha(0.7)
    axes[1].set_title("Omega Balance Score by Grade", fontsize=14, fontweight="bold")
    axes[1].set_ylabel("Omega Balance Score", fontsize=12)
    axes[1].set_xlabel("Health Grade", fontsize=12)

    plt.tight_layout()
    fig.savefig(os.path.join(PLOTS_DIR, "omega_balance.png"), dpi=150, bbox_inches="tight")
    plt.close(fig)
    print("  ✅ omega_balance.png")


def plot_glycemic_vs_grade(df: pd.DataFrame):
    """8. Glycemic index impact on grade."""
    fig, ax = plt.subplots(figsize=(10, 6))

    grade_order = ["A", "B", "C", "D", "E", "F"]
    for g, color in zip(grade_order, ["#2ecc71", "#27ae60", "#f1c40f", "#e67e22", "#e74c3c", "#c0392b"]):
        subset = df[df["health_grade"] == g]
        if len(subset) > 0:
            ax.scatter(subset["glycemic_index"], subset["glycemic_risk"],
                      alpha=0.3, label=f"Grade {g}", color=color, s=15)

    ax.set_xlabel("Glycemic Index", fontsize=13)
    ax.set_ylabel("Glycemic Risk Score", fontsize=13)
    ax.set_title("Glycemic Index vs Risk Score by Health Grade", fontsize=15, fontweight="bold")
    ax.legend(fontsize=10, markerscale=3)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    plt.tight_layout()
    fig.savefig(os.path.join(PLOTS_DIR, "glycemic_vs_grade.png"), dpi=150, bbox_inches="tight")
    plt.close(fig)
    print("  ✅ glycemic_vs_grade.png")


def plot_cost_analysis(df: pd.DataFrame):
    """9. Ingredient cost vs nutritional value."""
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    # Cost vs bioavailability
    scatter = axes[0].scatter(df["ingredient_cost_usd"], df["bioavailability_score"],
                              c=df["calories"], cmap="YlOrRd", alpha=0.4, s=15)
    axes[0].set_xlabel("Ingredient Cost (USD/100g)", fontsize=12)
    axes[0].set_ylabel("Bioavailability Score", fontsize=12)
    axes[0].set_title("Cost vs Bioavailability (color=calories)", fontsize=14, fontweight="bold")
    plt.colorbar(scatter, ax=axes[0], label="Calories")

    # Cost distribution by grade
    grade_order = ["A", "B", "C", "D", "E", "F"]
    data = [df[df["health_grade"] == g]["ingredient_cost_usd"].values
            for g in grade_order if g in df["health_grade"].values]
    labels = [g for g in grade_order if g in df["health_grade"].values]
    colors = ["#2ecc71", "#27ae60", "#f1c40f", "#e67e22", "#e74c3c", "#c0392b"]

    bp = axes[1].boxplot(data, labels=labels, patch_artist=True)
    for patch, color in zip(bp["boxes"], colors[:len(labels)]):
        patch.set_facecolor(color)
        patch.set_alpha(0.7)
    axes[1].set_title("Ingredient Cost by Grade", fontsize=14, fontweight="bold")
    axes[1].set_ylabel("Cost (USD/100g)", fontsize=12)
    axes[1].set_xlabel("Health Grade", fontsize=12)

    plt.tight_layout()
    fig.savefig(os.path.join(PLOTS_DIR, "cost_analysis.png"), dpi=150, bbox_inches="tight")
    plt.close(fig)
    print("  ✅ cost_analysis.png")


def plot_species_comparison(df: pd.DataFrame):
    """10. Species-specific grade distribution."""
    if "species" not in df.columns:
        return
    fig, ax = plt.subplots(figsize=(12, 7))

    grade_order = ["A", "B", "C", "D", "E", "F"]
    species_list = sorted(df["species"].unique())
    colors = ["#2ecc71", "#27ae60", "#f1c40f", "#e67e22", "#e74c3c", "#c0392b"]

    # Stacked bar per species
    x = np.arange(len(species_list))
    width = 0.7
    bottoms = np.zeros(len(species_list))

    for grade, color in zip(grade_order, colors):
        counts = [len(df[(df["species"] == sp) & (df["health_grade"] == grade)])
                  for sp in species_list]
        ax.bar(x, counts, width, bottom=bottoms, label=f"Grade {grade}", color=color, alpha=0.85)
        bottoms += counts

    ax.set_xlabel("Species", fontsize=13)
    ax.set_ylabel("Count", fontsize=13)
    ax.set_title("Grade Distribution by Pet Species", fontsize=15, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(species_list, rotation=45, ha="right")
    ax.legend(title="Grade", fontsize=10)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    plt.tight_layout()
    fig.savefig(os.path.join(PLOTS_DIR, "species_comparison.png"), dpi=150, bbox_inches="tight")
    plt.close(fig)
    print("  ✅ species_comparison.png")


def main():
    print("🐾 NutriPet_Opto — Exploratory Data Analysis")
    print("=" * 55)

    ensure_plots_dir()
    df = load_data()

    # Summary statistics
    stats = summary_statistics(df)

    # Generate all plots
    print("\n📈 Generating Visualizations...")
    print("-" * 40)

    plot_grade_distribution(df)
    plot_caloric_density(df)
    plot_correlation_heatmap(df)
    plot_protein_vs_grade(df)
    plot_sugar_vs_grade(df)
    plot_toxicity_vs_grade(df)
    plot_omega_balance(df)
    plot_glycemic_vs_grade(df)
    plot_cost_analysis(df)
    plot_species_comparison(df)

    print(f"\n✅ All plots saved to: {PLOTS_DIR}/")
    print(f"   Total plots generated: 10")

    # Quick insights
    print("\n" + "=" * 55)
    print("💡 KEY INSIGHTS")
    print("=" * 55)

    # 1. Grade distribution
    grade_counts = df["health_grade"].value_counts()
    most_common = grade_counts.idxmax()
    print(f"\n  1. Most common grade: {most_common} ({grade_counts[most_common]} records, "
          f"{grade_counts[most_common]/len(df)*100:.1f}%)")

    # 2. Toxic foods impact
    toxic_count = (df["toxin_flag"] > 0).sum()
    toxic_pct = toxic_count / len(df) * 100
    print(f"\n  2. Toxic food-species pairs: {toxic_count} ({toxic_pct:.1f}% of dataset)")
    if toxic_count > 0:
        toxic_grades = df[df["toxin_flag"] > 0]["health_grade"].value_counts()
        print(f"     Toxic pairs grade distribution: {dict(toxic_grades)}")

    # 3. Species patterns
    if "species" in df.columns:
        species_avg = df.groupby("species")["protein_match"].mean().sort_values(ascending=False)
        print(f"\n  3. Species with highest avg protein match: {species_avg.index[0]} ({species_avg.iloc[0]:.3f})")
        print(f"     Species with lowest avg protein match: {species_avg.index[-1]} ({species_avg.iloc[-1]:.3f})")

    # 4. Feature impact
    grade_map = {"A": 5, "B": 4, "C": 3, "D": 2, "E": 1, "F": 0}
    df["grade_numeric"] = df["health_grade"].map(grade_map)
    feature_cols = ["toxin_flag", "protein_match", "fat_match", "carb_tolerance",
                    "sugar_risk", "omega_balance", "glycemic_risk", "digestibility_index"]
    feature_cols = [c for c in feature_cols if c in df.columns]
    correlations = df[feature_cols + ["grade_numeric"]].corr()["grade_numeric"].drop("grade_numeric")
    most_impactful = correlations.abs().idxmax()
    print(f"\n  4. Most impactful feature on grade: {most_impactful} (r={correlations[most_impactful]:.3f})")

    print(f"\n{'=' * 55}")
    print("✅ EDA complete!")


if __name__ == "__main__":
    main()
