# AGENTS.md — Global Agentic AI Guidelines

This document sets mandatory constraints for all AI coding agents, subagents, and automated workflows interacting with the ReKey repository.

---

## 1. Absolute Emoji Prohibition

- **Zero Emojis**: Never use emojis anywhere in this repository.
  - **UI / Frontend**: No emojis in TSX, JSX, HTML, CSS, or SVG. Use Lucide SVG icons (`lucide-react`) exclusively.
  - **Codebase**: No emojis in source code, code comments, docstrings, variable names, or fixtures.
  - **Git Operations**: No emojis in commit messages, branch names, PR titles, or PR descriptions.
  - **Documentation**: No emojis in Markdown files, contracts, specifications, or READMEs.
  - **Agent Outputs**: No emojis in chat responses, status summaries, or artifacts.

---

## 2. Monopo Saigon Design System Compliance

- **Radical Monochrome Palette**: Pure Obsidian (`#000000`), Pure White (`#ffffff`), Ash Mist (`#9a9a9a`), Felt Gray (`#6d6d6d`).
- **No Random Accent Colors**: Do not introduce ad-hoc colored badges (red, green, blue, purple, yellow) or glowing neon elements.
- **Strict Radii**:
  - `0px` sharp corners for all structural containers, cards, tables, modals, and inputs.
  - `75px` full-pill radius for interactive buttons and status pills.
- **Architectural Glassmorphism**: Translucent dark glass (`rgba(8, 12, 22, 0.82)` to `rgba(6, 9, 17, 0.94)`) with subtle borders, top edge highlights, and high-contrast readability.

---

## 3. Professional Enterprise Terminology

- Never display internal developer persona aliases (*The Scribe*, *The High Warden*, *The Alchemist*, *The King's Hand*) in the UI or user-facing copy.
- Always use standard enterprise cybersecurity terminology:
  - Discovery & Inventory: `Cryptographic Discovery & CBOM Inventory`
  - Risk Assessment: `Quantum Risk Assessment & Blast Radius`
  - Simulation & Migration: `PQC Migration Simulation & Roadmap`
  - System Platform: `System Configuration & Administration`

---

## 4. Contract Schema Adherence

- Strictly conform to `docs/contracts.md` for all data models, API payloads, database tables, and mock fixtures.
