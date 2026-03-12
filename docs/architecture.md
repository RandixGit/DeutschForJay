# DeutschForJay — Architecture

A gamified, offline-first German learning app for kids. No backend — fully client-side with localStorage persistence.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 + TypeScript |
| State | Zustand (localStorage persistence) |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Speech | Web Speech API |
| Build | Vite |
| Data | Static JSON files |

---

## Screen Flow

```mermaid
flowchart TD
    Welcome["WelcomeScreen<br/>Enter player name"]
    Map["ModuleMap<br/>Browse modules → chapters → lessons"]
    Lesson["LessonView<br/>Work through tasks"]
    Results["ResultsScreen<br/>Stars · XP earned"]
    Card["CardUnlock<br/>Collectible card flip"]
    Parent["ParentDashboard<br/>PIN-protected"]

    Welcome --> Map
    Map --> Lesson
    Lesson --> Results
    Results -->|chapter complete| Card
    Card --> Map
    Results --> Map
    Map --> Parent
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
    App --> AppShell
    AppShell --> XPBar
    AppShell --> WelcomeScreen
    AppShell --> ModuleMap
    AppShell --> LessonView
    AppShell --> ResultsScreen
    AppShell --> CardUnlock
    AppShell --> ParentDashboard

    LessonView --> ExerciseRouter
    ExerciseRouter --> Flashcard
    ExerciseRouter --> MultipleChoice
    ExerciseRouter --> FillInBlank
    ExerciseRouter --> ListenConfirm
```

---

## State Management

All state lives in a single Zustand store (`gameStore.ts`).

```mermaid
flowchart LR
    subgraph Persistent["Persistent (localStorage)"]
        playerName
        xp
        completedLessons
        collectedCards
        currentStreak
        parentPin
        coupons
    end

    subgraph Transient["Transient (session only)"]
        screen
        activeLessonId
        activeTaskIndex
        taskResults
        pendingCardUnlock
    end

    Store[("gameStore<br/>Zustand")] --> Persistent
    Store --> Transient
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
        ExerciseRouter->>gameStore: recordResult(correct, firstTry)
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
├── store/gameStore.ts        # All app state + actions
├── types/curriculum.ts       # TypeScript interfaces for all data shapes
├── services/curriculum.ts    # Query helpers for JSON curriculum data
├── hooks/useTTS.ts           # Web Speech API wrapper (de-DE / en-US)
├── curriculum/
│   ├── module-01.json        # Greetings & Basics
│   └── module-02.json        # Module 2
└── components/
    ├── layout/               # Full-screen views (Map, Lesson, Results, …)
    ├── exercises/            # Task components + router
    ├── rewards/              # XPBar, CardUnlock
    └── parent/               # ParentDashboard
```
