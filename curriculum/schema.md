# Curriculum JSON Schema

Curriculum files live in `src/curriculum/module-XX.json` and are imported directly by the app.

## Module

```json
{
  "id": "module-01",
  "title": "Hallo! Greetings & Basics",
  "theme": "Soccer Rookie",
  "description": "Short description shown on the map",
  "xpRequired": 0,
  "badge": { "name": "Ball Boy", "icon": "⚽" },
  "chapters": [ ...Chapter ]
}
```

## Chapter

```json
{
  "id": "ch-01-01",
  "title": "Saying Hello",
  "lessons": [ ...Lesson ]
}
```

## Lesson

```json
{
  "id": "ls-01-01-01",
  "title": "First Words",
  "tasks": [ ...Task ]
}
```

## Task Types

### flashcard

```json
{
  "type": "flashcard",
  "german": "Hallo",
  "english": "Hello",
  "hint": "Sounds exactly like English!",
  "emoji": "👋",
  "tts": true
}
```

### multiple-choice

```json
{
  "type": "multiple-choice",
  "prompt": "What does 'Hallo' mean?",
  "promptLanguage": "en",
  "options": ["Hello", "Goodbye", "Please", "Thanks"],
  "correct": 0,
  "explanation": "Hallo = Hello, just like English!"
}
```
- `correct` is the 0-based index of the correct option
- Always provide exactly 4 options

### fill-in-blank

```json
{
  "type": "fill-in-blank",
  "sentence": "___, zwei, drei!",
  "answer": "Eins",
  "hint": "Start counting!",
  "tts": true
}
```
- Use exactly `___` (three underscores) as the blank placeholder
- `answer` is the word that fills the blank (checked case-insensitively)

### listen-confirm

```json
{
  "type": "listen-confirm",
  "german": "Wie heißt du?",
  "english": "What's your name?",
  "confirmWord": "heißt"
}
```
- TTS plays `german` aloud
- Player must type `confirmWord` (checked case-insensitively)

## Naming Conventions

- Module IDs: `module-01`, `module-02`, ...
- Chapter IDs: `ch-01-01` (module-chapter)
- Lesson IDs: `ls-01-01-01` (module-chapter-lesson)

## Adding New Modules

1. Create `src/curriculum/module-XX.json`
2. Import and add it to the `ALL_MODULES` array in `src/services/curriculum.ts`
