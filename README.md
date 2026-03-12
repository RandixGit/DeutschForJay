# DeutschForJay

A gamified, offline-first German learning app built for Jay — a 9-year-old who loves Roblox, Clash Royale, One Piece, and soccer. The goal: make learning German fast, fun, and rewarding enough that he actually wants to play it.

---

## What it is

A browser-based learning game that runs entirely client-side — no backend, no login, no internet required after the initial load. Progress is saved to localStorage. It can be self-hosted on a Synology NAS (DS224+ or similar).

Jay earns XP, unlocks levels with soccer-themed titles, and collects cards as he works through German lessons. Parents get a PIN-protected dashboard to monitor progress and manage pocket money coupons.

---

## Features

- **XP & Levels** — earn XP per task, level up from Ball Boy to Legend
- **Collectible Cards** — unlocked when completing a chapter
- **4 Exercise Types** — flashcards, multiple choice, fill-in-blank, listen & confirm
- **TTS** — German and English read-aloud via the Web Speech API
- **Vocab Reference Panel** — look up words mid-lesson without losing your place
- **Parent Dashboard** — PIN-protected; view progress, manage coupon rewards
- **Streak & Review** — lessons where Jay struggled are flagged for review
- **Bidirectional Flashcards** — cards can be flipped either direction for recall practice

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 + TypeScript |
| State | Zustand (localStorage persistence) |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Speech | Web Speech API (de-DE / en-US) |
| Build | Vite |
| Data | Static JSON files |

No backend. No database. No external API keys required.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
```

The `dist/` folder is a static site — drop it into any web server, including Synology's built-in web server.

---

## Curriculum

Learning content lives in `src/curriculum/` as versioned JSON files.

```
src/curriculum/
├── module-01.json   # Hallo! Greetings & Basics
└── module-02.json   # ...
```

The data hierarchy is: **Module → Chapter → Lesson → Task**. See [curriculum/schema.md](curriculum/schema.md) for the full JSON schema.

Modules are themed around Jay's interests (soccer, gaming) and progress from basic greetings toward conversational fluency.

---

## XP & Progression

| Result | XP |
|---|---|
| First-try correct | +10 XP |
| Retry correct | +5 XP |
| Lesson ≥ 90% | +50 XP bonus (3 stars) |
| Lesson ≥ 70% | +25 XP bonus (2 stars) |
| Lesson < 70% | +10 XP bonus (1 star) |

**Levels:**
Rookie (0) → Ball Boy (100) → Midfielder (300) → Striker (600) → Captain (1000) → Pro Player (1500) → World Class (2500) → Legend (4000)

---

## Project Structure

```
src/
├── App.tsx                   # Screen router (state-based, no React Router)
├── store/gameStore.ts        # All app state + actions (Zustand)
├── types/curriculum.ts       # TypeScript interfaces
├── services/curriculum.ts    # Query helpers for curriculum JSON
├── hooks/useTTS.ts           # Web Speech API wrapper
├── curriculum/               # Lesson content (JSON, versioned in git)
└── components/
    ├── layout/               # Full-screen views (Map, Lesson, Results, …)
    ├── exercises/            # Task components + router
    ├── rewards/              # XPBar, CardUnlock
    └── parent/               # ParentDashboard
docs/
├── architecture.md           # System design, component tree, data flow
└── requirements.md           # Original vision and feature spec
```

---

## Docs

- [Architecture](docs/architecture.md) — component tree, state management, screen flow diagrams
- [Requirements](docs/requirements.md) — original vision and planned features
