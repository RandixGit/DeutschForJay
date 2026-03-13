# DeutschForJay

A gamified, offline-first German learning app built for Jay — a 9-year-old who loves Roblox, Clash Royale, One Piece, and soccer. The goal: make learning German fast, fun, and rewarding enough that he actually wants to play it.

---

## What it is

A browser-based learning game with optional cloud sync. Progress is saved to localStorage for offline use, and optionally synced to Firestore when signed in with Google. It can be self-hosted on a Synology NAS (DS224+ or similar).

Jay earns XP, unlocks levels with soccer-themed titles, and collects cards as he works through German lessons. Multiple player profiles are supported — each family member gets their own progress. Parents get a PIN-protected dashboard to monitor progress, manage pocket money coupons, and preview all content.

---

## Features

- **XP & Levels** — earn XP per task, level up from Ball Boy to Legend
- **Collectible Cards** — unlocked when completing a chapter
- **4 Exercise Types** — flashcards, multiple choice, fill-in-blank, listen & confirm
- **TTS** — German and English read-aloud via the Web Speech API
- **Vocab Reference Panel** — look up words mid-lesson without losing your place
- **Multi-Player Profiles** — each family member gets their own progress, XP, and cards
- **Cloud Sync** — optional Google sign-in syncs progress to Firestore across devices
- **Parent Dashboard** — PIN-protected; view progress per player, manage coupons, unlock all modules for review
- **Streak & Review** — lessons where Jay struggled are flagged for review
- **Bidirectional Flashcards** — cards can be flipped either direction for recall practice
- **Editable Player Name** — tap to rename directly from the module map
- **ß/ss Equivalence** — accepts both `ß` and `ss` as correct in fill-in-blank answers
- **AI-Assisted Curriculum** — generate new modules via Claude Code slash command, optionally using student performance data from Firestore

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 + TypeScript |
| State | Zustand (localStorage persistence) |
| Cloud Sync | Firebase Auth + Firestore (optional) |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Speech | Web Speech API (de-DE / en-US) |
| Build | Vite |
| Data | Static JSON files (auto-discovered) |
| Scripts | tsx (TypeScript runner for tooling) |

Works fully offline with localStorage. Cloud sync is optional — add Firebase config via `VITE_FIREBASE_*` env vars to enable Google sign-in and cross-device sync.

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
├── module-02.json   # Die Familie (Family)
├── module-03.json   # In der Schule (At School)
├── module-04.json   # Essen & Trinken (Food & Drink)
├── module-05.json   # Sport & Hobbys
└── module-06.json   # In der Stadt (Around Town)
```

The data hierarchy is: **Module → Chapter → Lesson → Task**. See [curriculum/schema.md](curriculum/schema.md) for the full JSON schema.

Modules are auto-discovered via `import.meta.glob` — just drop a new `module-XX.json` file and it's picked up automatically. No import changes needed.

### Generating new modules

Use the Claude Code slash command:

```
/generate-module Animals & Nature
```

This reads existing modules, optionally fetches student performance data from Firestore, and generates a new module with struggle-aware content reinforcement.

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
├── services/
│   ├── curriculum.ts         # Query helpers (auto-discovers module JSON)
│   ├── firebase.ts           # Firebase app init + auth/db exports
│   ├── firestoreSync.ts      # Firestore read/write for cloud persistence
│   └── AuthContext.tsx        # React context for Google auth state
├── hooks/
│   ├── useTTS.ts             # Web Speech API wrapper
│   └── useFirestoreSync.ts   # Hook to sync Zustand ↔ Firestore
├── curriculum/               # Lesson content (JSON, auto-discovered)
└── components/
    ├── layout/               # Full-screen views (Map, Lesson, Results, …)
    ├── exercises/            # Task components + router
    ├── rewards/              # XPBar, CardUnlock
    └── parent/               # ParentDashboard
scripts/
└── fetch-student-data.ts     # Pull student performance from Firestore (for AI module generation)
docs/
├── architecture.md           # System design, component tree, data flow
└── requirements.md           # Original vision and feature spec
```

---

## Docs

- [Architecture](docs/architecture.md) — component tree, state management, screen flow diagrams
- [Requirements](docs/requirements.md) — original vision and planned features
