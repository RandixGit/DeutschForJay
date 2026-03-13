# DeutschForJay — Architecture

A gamified German learning app for kids. Offline-first with localStorage persistence, optional cloud sync via Firebase Auth + Firestore. Supports multiple player profiles per device.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 + TypeScript |
| State | Zustand (localStorage persistence) |
| Cloud Sync | Firebase Auth (Google) + Firestore |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Speech | Web Speech API |
| Build | Vite |
| Data | Static JSON files (auto-discovered via import.meta.glob) |
| Tooling | tsx, firebase-admin (scripts) |

---

## Screen Flow

```mermaid
flowchart TD
    Welcome["WelcomeScreen<br/>Enter player name"]
    Map["ModuleMap<br/>Browse modules → chapters → lessons"]
    Lesson["LessonView<br/>Work through tasks"]
    Results["ResultsScreen<br/>Stars · XP earned"]
    Card["CardUnlock<br/>Collectible card flip"]
    Parent["ParentDashboard<br/>PIN-protected, per-player stats"]

    Welcome --> Map
    Map --> Lesson
    Lesson --> Results
    Results -->|chapter complete| Card
    Card --> Map
    Results --> Map
    Map --> Parent
    Map -->|switch player| Welcome
```

---

## Curriculum Data Hierarchy

```mermaid
graph TD
    M["Module<br/>xpRequired threshold"]
    C["Chapter<br/>unlocks collectible card"]
    L["Lesson<br/>earns XP + stars"]
    T["Task<br/>4 exercise types"]

    M --> C
    C --> L
    L --> T
```

**Task types:** `flashcard` · `multiple-choice` · `fill-in-blank` · `listen-confirm`

---

## Component Tree

```mermaid
graph TD
    App --> AuthContext
    AuthContext --> AppShell
    AppShell --> XPBar
    AppShell --> WelcomeScreen
    AppShell --> ModuleMap
    AppShell --> LessonView
    AppShell --> ResultsScreen
    AppShell --> CardUnlock
    AppShell --> ParentDashboard

    AppShell --> useFirestoreSync

    LessonView --> ExerciseRouter
    ExerciseRouter --> Flashcard
    ExerciseRouter --> MultipleChoice
    ExerciseRouter --> FillInBlank
    ExerciseRouter --> ListenConfirm
```

---

## State Management

All state lives in a single Zustand store (`gameStore.ts`). Multi-player profiles are stored as a `players` map keyed by player ID, with one active player at a time.

```mermaid
flowchart LR
    subgraph Persistent["Persistent (localStorage + Firestore)"]
        players["players (map of PlayerProfile)"]
        activePlayerId
        parentPin
    end

    subgraph PlayerProfile["PlayerProfile (per player)"]
        playerName
        xp
        completedLessons
        collectedCards
        currentStreak
        coupons
        struggledLessons
    end

    subgraph Transient["Transient (session only)"]
        screen
        activeLessonId
        activeTaskIndex
        taskResults
        pendingCardUnlock
        debugAllUnlocked
    end

    Store[("gameStore<br/>Zustand")] --> Persistent
    Store --> Transient
    players --> PlayerProfile
```

### Cloud Sync

When signed in with Google, `useFirestoreSync` bidirectionally syncs the Zustand store with a Firestore document (`users/{uid}`). localStorage remains the source of truth for offline use; Firestore merges on reconnect.

```mermaid
flowchart LR
    Zustand -->|write| localStorage
    Zustand -->|write| Firestore
    Firestore -->|on snapshot| Zustand
```

---

## XP & Progression

```mermaid
flowchart LR
    T[Complete Task] -->|1st try correct| XP10[+10 XP]
    T -->|retry correct| XP5[+5 XP]
    XP10 & XP5 --> Score
    Score -->|≥90%| S3[3 Stars +50 XP]
    Score -->|≥70%| S2[2 Stars +25 XP]
    Score -->|<70%| S1[1 Star +10 XP]
    S3 & S2 & S1 --> TotalXP[Total XP]
    TotalXP --> Level[Level 1–8]
```

**Levels:** Rookie (0) → Ball Boy (100) → Midfielder (300) → Striker (600) → Captain (1000) → Pro Player (1500) → World Class (2500) → Legend (4000)

---

## Lesson Task Loop

```mermaid
sequenceDiagram
    participant Player
    participant LessonView
    participant ExerciseRouter
    participant gameStore

    Player->>LessonView: starts lesson
    loop each task
        LessonView->>ExerciseRouter: render task[index]
        ExerciseRouter->>Player: show exercise
        Player->>ExerciseRouter: submit answer
        ExerciseRouter->>gameStore: recordResult(correct, firstTry, taskType, wrongAnswers)
        gameStore->>LessonView: taskIndex++
    end
    LessonView->>gameStore: completeLesson(score, xp)
    gameStore->>LessonView: navigate → results
```

---

## Key Files

```
src/
├── App.tsx                   # Screen router (state-based, no React Router)
├── store/gameStore.ts        # All app state + actions (multi-player)
├── types/curriculum.ts       # TypeScript interfaces for all data shapes
├── services/
│   ├── curriculum.ts         # Query helpers (auto-discovers module JSON via import.meta.glob)
│   ├── firebase.ts           # Firebase app init, auth & Firestore exports
│   ├── firestoreSync.ts      # Read/write player data to Firestore
│   └── AuthContext.tsx        # React context for Google sign-in state
├── hooks/
│   ├── useTTS.ts             # Web Speech API wrapper (de-DE / en-US)
│   └── useFirestoreSync.ts   # Zustand ↔ Firestore bidirectional sync
├── curriculum/
│   ├── module-01.json        # Hallo! Greetings & Basics
│   ├── module-02.json        # Die Familie
│   ├── module-03.json        # In der Schule
│   ├── module-04.json        # Essen & Trinken
│   ├── module-05.json        # Sport & Hobbys
│   └── module-06.json        # In der Stadt
└── components/
    ├── layout/               # Full-screen views (Map, Lesson, Results, …)
    ├── exercises/            # Task components + router (tracks wrong answers per task)
    ├── rewards/              # XPBar, CardUnlock
    └── parent/               # ParentDashboard (per-player, unlock-all toggle)
scripts/
└── fetch-student-data.ts     # Firestore → JSON export for AI curriculum generation
```

## Curriculum Generation Pipeline

New modules can be generated via the Claude Code slash command `/generate-module <topic>`. The pipeline:

1. `scripts/fetch-student-data.ts` pulls per-task performance data from Firestore (wrong answers, struggle patterns)
2. The AI reads all existing modules to avoid vocabulary duplication
3. A new `module-XX.json` is generated with struggle-aware reinforcement
4. The file is auto-discovered by `curriculum.ts` — no import changes needed
