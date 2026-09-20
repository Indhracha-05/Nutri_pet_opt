import React from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    id: 'analyzer',
    category: 'Toxicity & Compatibility',
    title: 'Food Safety & AI Grading',
    description:
      'Instantly evaluate ingredients against species-specific metabolic models and verified toxin databases for clinical-grade dietary safety.',
    route: '/analyzer',
  },
  {
    id: 'category',
    category: 'Comparative Intelligence',
    title: 'Category Exploration',
    description:
      'Rank and contrast foods within nutritional groups — protein bioavailability, glycemic load, and micronutrient suitability.',
    route: '/analyzer',
  },
  {
    id: 'planner',
    category: 'Algorithmic Portions',
    title: 'Smart Meal Planner',
    description:
      'Formulate day-by-day raw feeding schedules calibrated to species resting energy requirements and activity targets down to the gram.',
    route: '/analyzer',
  },
];

const speciesHighlights = [
  {
    name: 'Canine (Dog)',
    diet: 'Omnivore',
    desc: 'Protein, healthy fats, controlled fiber and glycemic load.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXEkT5rNa_tusqAaZDf5RXNhWqIYpeaa3MDPLugU92KA&s=10',
  },
  {
    name: 'Feline (Cat)',
    diet: 'Obligate Carnivore',
    desc: 'High animal protein, essential taurine, low carbohydrate tolerance.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGGKVskN4xdw6WnI1c8N-KtrPOfot5SEvQdpsyTsX58g&s=10',
  },
  {
    name: 'Lagomorph (Rabbit)',
    diet: 'Herbivore',
    desc: 'High indigestible fiber, strictly low sugar and minimal fat.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmWe6dyJkG9aNbye1xFb2lsc7uTooosIKaEUTOaWaXbw&s=10',
  },
  {
    name: 'Equine (Horse)',
    diet: 'Herbivore',
    desc: 'High forage, continuous grazing nutritional requirements.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSknF0fwzJiLHsrj-y-_ETxW2weZNcgc6FgnR5n8t9DzQ&s=10',
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#17191c] flex flex-col justify-between selection:bg-[#fbe1d1] selection:text-[#5d2a1a]">
      {/* Steep Transparent Top Navigation */}
      <nav className="max-w-[1200px] w-full mx-auto px-8 py-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-xl font-serif text-[#17191c] tracking-tight">
            NutriPet
          </span>
          <span className="hidden md:inline text-xs font-sans text-[#777b86] pl-4 border-l border-[#ececec]">
            Pet Nutritional Intelligence
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/analyzer')}
            className="text-sm text-[#777b86] hover:text-[#17191c] transition-colors hidden sm:inline"
          >
            How it works
          </button>
          <button
            onClick={() => navigate('/analyzer')}
            className="btn-pill-filled text-sm"
          >
            Launch Analyzer
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-[1200px] mx-auto px-8 pt-12 pb-24 text-center space-y-8">
          <div className="inline-block text-xs uppercase tracking-widest text-[#777b86]">
            Veterinary Intelligence Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-serif text-[#17191c] max-w-4xl mx-auto leading-[1.18] tracking-tight">
            Dietary safety rendered with <em>clinical clarity.</em>
          </h1>

          <p className="text-lg md:text-xl text-[#777b86] max-w-2xl mx-auto leading-relaxed">
            NutriPet combines structured biochemical knowledge graphs with veterinary machine learning to grade ingredients, uncover fatal toxicity risks, and formulate balanced daily rations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigate('/analyzer')}
              className="btn-pill-filled text-base px-7 py-3"
            >
              Start Analysis →
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('features');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-pill-ghost text-base px-7 py-3"
            >
              Explore Capabilities
            </button>
          </div>

          {/* Floating Product Artifact Preview */}
          <div className="pt-12 max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="card-floating space-y-2">
              <span className="text-xs text-[#979799]">Quick Check</span>
              <p className="font-serif text-lg text-[#17191c]">Salmon Fillet</p>
              <div className="flex items-center justify-between pt-2 border-t border-[#ececec]">
                <span className="text-xs text-[#777b86]">Canine Grade</span>
                <span className="text-xs font-mono font-bold text-[#17191c]">Grade A</span>
              </div>
            </div>

            <div className="card-floating space-y-2">
              <span className="text-xs text-[#979799]">Toxin Guard</span>
              <p className="font-serif text-lg text-[#5d2a1a]">Dark Chocolate</p>
              <div className="flex items-center justify-between pt-2 border-t border-[#ececec]">
                <span className="text-xs text-[#5d2a1a]">Hazard Flag</span>
                <span className="text-xs font-mono font-bold text-[#5d2a1a]">Theobromine</span>
              </div>
            </div>

            <div className="card-floating space-y-2">
              <span className="text-xs text-[#979799]">Ration Balancer</span>
              <p className="font-serif text-lg text-[#17191c]">Daily Energy</p>
              <div className="flex items-center justify-between pt-2 border-t border-[#ececec]">
                <span className="text-xs text-[#777b86]">Target RER</span>
                <span className="text-xs font-mono font-bold text-[#17191c]">580 kcal</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Section */}
        <section id="features" className="max-w-[1200px] mx-auto px-8 py-20 border-t border-[#ececec] space-y-12">
          <div className="max-w-2xl text-left">
            <span className="text-xs text-[#979799] uppercase tracking-wider block mb-2">
              Capabilities
            </span>
            <h2 className="text-3xl md:text-4xl font-serif text-[#17191c]">
              Built for precision and calm deliberation.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feat) => (
              <div
                key={feat.id}
                className="card-mist flex flex-col justify-between group cursor-pointer hover:bg-[#eaeaea] transition-colors"
                onClick={() => navigate(feat.route)}
              >
                <div className="space-y-3">
                  <span className="text-xs text-[#979799] block font-sans">
                    {feat.category}
                  </span>
                  <h3 className="text-xl font-serif text-[#17191c]">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-[#777b86] leading-relaxed font-sans">
                    {feat.description}
                  </p>
                </div>

                <div className="pt-8">
                  <span className="text-sm text-[#17191c] font-sans group-hover:translate-x-1 inline-block transition-transform">
                    Open {feat.title} →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Standout Accent Peach Card (used once per Steep guidelines) */}
        <section className="max-w-[1200px] mx-auto px-8 py-12">
          <div className="card-peach space-y-4 text-left">
            <span className="text-xs uppercase tracking-widest text-[#5d2a1a] opacity-80 block font-sans">
              Veterinary Foundation
            </span>
            <h3 className="text-2xl md:text-3xl font-serif text-[#5d2a1a] max-w-3xl leading-snug">
              "Pet nutrition is fundamentally species-specific. Generalizing human dietary habits to carnivores and hindgut fermenters is the leading cause of preventable metabolic illnesses."
            </h3>
            <p className="text-sm text-[#5d2a1a] opacity-75 font-sans pt-2">
              — Principles of Veterinary Clinical Nutrition & Biochemistry
            </p>
          </div>
        </section>

        {/* Species Section on Fog White */}
        <section className="bg-[#fafafb] py-24 border-t border-[#ececec]">
          <div className="max-w-[1200px] mx-auto px-8 space-y-12">
            <div className="max-w-2xl text-left">
              <span className="text-xs text-[#979799] uppercase tracking-wider block mb-2">
                Biological Models
              </span>
              <h2 className="text-3xl md:text-4xl font-serif text-[#17191c]">
                Species-tailored metabolic profiles.
              </h2>
              <p className="text-[#777b86] text-base mt-2">
                Nutrient tolerance, bioavailability thresholds, and amino acid dependencies customized per species.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {speciesHighlights.map((s) => (
                <div
                  key={s.name}
                  className="bg-[#ffffff] rounded-cards p-6 border border-[#ececec] space-y-4 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {s.image && (
                        <img
                          src={s.image}
                          alt={s.name}
                          className="w-12 h-12 rounded-images object-cover border border-[#ececec] flex-shrink-0"
                        />
                      )}
                      <div>
                        <h4 className="font-serif text-lg text-[#17191c]">{s.name}</h4>
                        <span className="text-xs text-[#979799]">{s.diet}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-[#777b86] leading-relaxed font-sans">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Steep Footer */}
      <footer className="border-t border-[#ececec] bg-[#ffffff] py-10 px-8">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-[#777b86] gap-4">
          <span>NutriPet — Serif Analytics on Warm Paper</span>
          <span className="text-[#a3a6af]">
            Educational tool based on veterinary heuristics. Always consult a licensed vet.
          </span>
        </div>
      </footer>
    </div>
  );
}
