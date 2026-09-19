import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    id: 'analyzer',
    icon: '🔬',
    title: 'Food Analyzer',
    subtitle: 'Single Food Analysis',
    description:
      'Instantly analyze the nutritional compatibility and toxicity of any food item for your specific pet species. Powered by ML models trained on veterinary guidelines.',
    gradient: 'from-purple-600 to-indigo-600',
    glowColor: 'rgba(139,92,246,0.35)',
    badge: 'Core Feature',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    route: '/analyzer',
    stats: ['10+ Species', 'Real-time ML', 'Toxicity Flags'],
  },
  {
    id: 'category',
    icon: '📊',
    title: 'Category Browser',
    subtitle: 'Multi-Food Comparison',
    description:
      'Compare multiple foods within a category side-by-side. Discover the best dietary options ranked by safety score, nutrient density, and compatibility.',
    gradient: 'from-pink-600 to-rose-600',
    glowColor: 'rgba(236,72,153,0.35)',
    badge: 'Compare & Rank',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    route: '/analyzer',
    stats: ['Top-5 Rankings', 'Score Charts', 'Side-by-side'],
  },
  {
    id: 'insights',
    icon: '🧠',
    title: 'AI Insights',
    subtitle: 'Nutrient Intelligence',
    description:
      'Deep-dive into per-nutrient breakdowns with radar charts and interactive graphs. Understand exactly why a food is safe or risky for your pet.',
    gradient: 'from-cyan-600 to-teal-600',
    glowColor: 'rgba(6,182,212,0.35)',
    badge: 'Visual Analytics',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    route: '/analyzer',
    stats: ['Radar Charts', 'Bar Graphs', 'Nutrient Detail'],
  },
];

const petEmojis = ['🐕', '🐈', '🐇', '🐠', '🦜', '🐢', '🦎', '🐿️'];

function FloatingPet({ emoji, style }) {
  return (
    <span className="floating-pet select-none pointer-events-none" style={style}>
      {emoji}
    </span>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const onMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const dx = (clientX / innerWidth - 0.5) * 20;
      const dy = (clientY / innerHeight - 0.5) * 20;
      hero.style.setProperty('--hero-dx', `${dx}px`);
      hero.style.setProperty('--hero-dy', `${dy}px`);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#070711] text-white overflow-x-hidden">
      {/* Global ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="orb orb-purple" />
        <div className="orb orb-pink" />
        <div className="orb orb-cyan" />
        <div className="dot-grid" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐾</span>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
            NutriPet_Opto
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/30 border border-white/10 px-3 py-1 rounded-full">
            v1.0 Beta
          </span>
          <button
            onClick={() => navigate('/analyzer')}
            className="btn-primary text-sm"
          >
            Launch App →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 pb-20"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {petEmojis.map((emoji, i) => (
            <FloatingPet
              key={i}
              emoji={emoji}
              style={{
                fontSize: `${1.5 + (i % 3) * 0.6}rem`,
                top: `${8 + (i * 11) % 80}%`,
                left: `${5 + (i * 13) % 88}%`,
                animationDelay: `${i * 0.7}s`,
                opacity: 0.12 + (i % 4) * 0.04,
              }}
            />
          ))}
        </div>

        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          AI-Powered Pet Nutrition Analysis
        </div>

        {/* Headline */}
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 animate-fade-in-up leading-none" style={{ animationDelay: '0.1s' }}>
          <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
            Know What's
          </span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            Safe for Your Pet
          </span>
        </h1>

        <p className="text-lg md:text-xl text-white/50 max-w-2xl mb-12 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.25s' }}>
          Instantly analyze any food's nutritional compatibility and toxicity for
          10+ pet species — powered by ML models trained on vetted veterinary guidelines.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <button onClick={() => navigate('/analyzer')} className="btn-primary text-base px-8 py-4">
            🔬 Start Analyzing
          </button>
          <button className="btn-ghost text-base px-8 py-4">
            📖 How It Works
          </button>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/20 animate-bounce">
          <span className="text-xs">Scroll</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* Stats strip */}
      <section className="relative z-10 border-y border-white/5 bg-white/[0.02] py-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-8">
          {[
            { value: '10+', label: 'Pet Species' },
            { value: '500+', label: 'Food Items' },
            { value: 'ML', label: 'Powered Engine' },
            { value: '100%', label: 'Free to Use' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-black bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs text-white/40 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Cards */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Everything you need
            </span>
          </h2>
          <p className="text-white/40 text-lg">Three powerful tools, one unified platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <div
              key={feat.id}
              className="feature-card group cursor-pointer"
              style={{ '--glow': feat.glowColor, animationDelay: `${i * 0.15}s` }}
              onClick={() => navigate(feat.route)}
            >
              <div className="card-glow" />
              <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border mb-4 ${feat.badgeColor}`}>
                {feat.badge}
              </span>
              <div className={`icon-wrap bg-gradient-to-br ${feat.gradient}`}>
                <span className="text-3xl">{feat.icon}</span>
              </div>
              <h3 className="text-xl font-bold text-white mt-4 mb-1">{feat.title}</h3>
              <p className="text-sm text-white/40 mb-2">{feat.subtitle}</p>
              <p className="text-sm text-white/60 leading-relaxed mb-6">{feat.description}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {feat.stats.map((s) => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/50">
                    {s}
                  </span>
                ))}
              </div>
              <button className={`w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r ${feat.gradient} text-white opacity-80 group-hover:opacity-100 transition-opacity`}>
                Open {feat.title} →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 bg-white/[0.02] border-y border-white/5 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">How it works</span>
            </h2>
            <p className="text-white/40">Three steps to know if a food is safe.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '🐾', title: 'Select Your Pet', desc: 'Choose from 10+ supported species including dogs, cats, rabbits, birds, reptiles, and more.' },
              { step: '02', icon: '🥕', title: 'Enter a Food', desc: 'Type any food item — fruits, vegetables, proteins, grains, or search by entire category.' },
              { step: '03', icon: '✅', title: 'Get Instant Results', desc: 'Our ML model returns a safety score, toxicity flags, nutrient breakdown, and alternatives.' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl">
                    {item.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 text-xs font-black text-purple-400 bg-purple-400/10 border border-purple-400/20 rounded-full px-1.5 py-0.5">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-bold text-white">{item.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="cta-banner">
            <div className="cta-glow" />
            <div className="text-5xl mb-6">🐾</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
              Start protecting your pet today
            </h2>
            <p className="text-white/50 mb-8 text-lg">Free, instant, and veterinary-informed. No sign-up required.</p>
            <button onClick={() => navigate('/analyzer')} className="btn-primary text-lg px-10 py-4">
              🔬 Launch the Analyzer
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-8 text-center text-white/25 text-sm">
        <div className="flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto gap-3">
          <span>🐾 NutriPet_Opto — AI Pet Nutrition Platform</span>
          <span>Built with React · FastAPI · ML · ❤️</span>
          <span className="text-white/15">⚠ Not a substitute for veterinary advice</span>
        </div>
      </footer>
    </div>
  );
}
