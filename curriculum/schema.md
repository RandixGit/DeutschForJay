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

### word-order

```json
{
  "type": "word-order",
  "prompt": "Put the words in the right order",
  "correctOrder": ["Guten", "Morgen!"],
  "english": "Good morning!",
  "tts": true
}
```
- `correctOrder` is the array of words in correct German order
- Words are shuffled by the component; player taps to arrange

### letter-scramble

```json
{
  "type": "letter-scramble",
  "prompt": "Spell the German word for 'Hello'",
  "answer": "Hallo",
  "hint": "Starts with 'H'!",
  "tts": true
}
```
- All letters of `answer` are scrambled; player taps to spell the word
- Best for single-word vocabulary reinforcement

### syllable-builder

```json
{
  "type": "syllable-builder",
  "prompt": "Build: 'Good morning'",
  "syllables": ["Mor", "Gu", "ten", "gen"],
  "answer": "Guten Morgen",
  "tts": true
}
```
- `syllables` are the syllable chunks (shuffled by the component)
- Player taps syllables in the correct order to build the word/phrase
- Best for compound words and multi-syllable vocabulary

### listen-confirm

```json
{
  "type": "listen-confirm",
  "german": "Wie heißt du? Ich heiße Tim.",
  "english": "What's your name? My name is Tim.",
  "question": "What is the speaker's name?",
  "options": ["Jay", "Max", "Tim", "Lukas"],
  "correct": 2
}
```
- TTS plays `german` aloud, then a comprehension question appears
- Player picks the correct answer from 4 multiple-choice options
- `correct` is the 0-based index of the right option
- Always provide exactly 4 options

## Naming Conventions

- Module IDs: `module-01`, `module-02`, ...
- Chapter IDs: `ch-01-01` (module-chapter)
- Lesson IDs: `ls-01-01-01` (module-chapter-lesson)

## Adding New Modules

1. Create `src/curriculum/module-XX.json`
2. Import and add it to the `ALL_MODULES` array in `src/services/curriculum.ts`
