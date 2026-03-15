# Generate a new curriculum module for DeutschForJay

You are generating a new German learning module for a 9-year-old boy who loves soccer, Roblox, Clash Royale, and One Piece.

## Topic

The topic for this module is: **$ARGUMENTS**

If no topic was provided, ask the user what topic the module should cover.

## Step 1: Gather context

1. **Fetch student performance data** (enabled by default — skip only if the user passed `--no-student-data` in $ARGUMENTS):
   - Run: `npx tsx scripts/fetch-student-data.ts`
   - If this fails (e.g., no GOOGLE_APPLICATION_CREDENTIALS), inform the user and continue without student data — do NOT block module generation
   - The user can also paste performance data manually or describe struggles in words

2. **Read all existing modules** by globbing `src/curriculum/module-*.json` to understand:
   - What vocabulary has already been taught
   - What topics have been covered
   - The xpRequired progression pattern
   - The current highest module number

3. **Read the schema** from `curriculum/schema.md` and type definitions from `src/types/curriculum.ts`

## Step 2: Analyze student struggles (skip if no student data available)

If student data was fetched or provided, analyze it. If not, skip this step and generate the module without struggle-targeted reinforcement.

From the performance data, identify:
- **Struggled lessons** (score < 50%) — what vocabulary and grammar was in those lessons?
- **Wrong answers** — what did the student actually type? How close were they to the correct answer? (Use Levenshtein-like reasoning: were they close phonetically? Did they confuse similar words?)
- **Task type weaknesses** — which exercise types (flashcard, multiple-choice, fill-in-blank, listen-confirm) had the most retries?
- **Patterns** — are there recurring mistakes? (e.g., always confusing ß/ss, forgetting umlauts, mixing up similar-sounding words)

## Step 3: Generate the module

Create a complete module JSON following these rules:

### Structure
- **3 chapters**, each with **3 lessons**, each with **5-8 tasks**
- The module must be self-contained but build on vocabulary from previous modules
- ID format: `module-XX`, `ch-XX-YY`, `ls-XX-YY-ZZ` where XX is the next available module number

### Task distribution per lesson
Follow this progression within each lesson:
1. Start with 2-3 **flashcards** to introduce new vocabulary
2. Then 1-2 **multiple-choice** questions for recognition
3. Then 1 **fill-in-blank** (missing letters) or 1 **letter-scramble** for spelling practice
4. Then 1 **syllable-builder** or 1 **word-order** for word/sentence construction
5. End with 1 **listen-confirm** for listening practice

### Task type schemas

**flashcard:**
```json
{ "type": "flashcard", "german": "...", "english": "...", "hint": "pronunciation or mnemonic", "emoji": "...", "tts": true }
```

**multiple-choice:**
```json
{ "type": "multiple-choice", "prompt": "...", "promptLanguage": "en", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "..." }
```
- Always exactly 4 options, `correct` is 0-based index
- If student data shows wrong answers, use those as distractor options!

**fill-in-blank:**
```json
{ "type": "fill-in-blank", "sentence": "... ___ ...", "answer": "word", "hint": "...", "tts": true }
```
- Use exactly `___` (three underscores) as the blank placeholder

**word-order:**
```json
{ "type": "word-order", "prompt": "Put the words in the right order", "correctOrder": ["Guten", "Morgen!"], "english": "Good morning!", "tts": true }
```
- `correctOrder` is the words in correct German order; component shuffles them

**letter-scramble:**
```json
{ "type": "letter-scramble", "prompt": "Spell the German word for 'Hello'", "answer": "Hallo", "hint": "Starts with 'H'!", "tts": true }
```
- Best for single-word vocabulary reinforcement
- Letters are scrambled by the component; player taps to spell

**syllable-builder:**
```json
{ "type": "syllable-builder", "prompt": "Build: 'Good morning'", "syllables": ["Mor", "Gu", "ten", "gen"], "answer": "Guten Morgen", "tts": true }
```
- Best for compound words and multi-syllable vocabulary
- `syllables` should be the actual syllable breakdown; component shuffles them

**listen-confirm:**
```json
{ "type": "listen-confirm", "german": "full sentence", "english": "translation", "question": "What is the speaker talking about?", "options": ["Option A", "Option B", "Option C", "Option D"], "correct": 0 }
```
- `question` is a comprehension question about what was heard
- Always exactly 4 options, `correct` is 0-based index
- Questions should test understanding, not just word recognition

### Struggle-aware content design (when student data is available)
If student data was loaded, apply these rules. Otherwise, just generate fresh content for the topic.

- **Chapter 1** should weave in review of struggled vocabulary from previous modules, presented in the context of the new topic
- If the student struggled with specific task types, increase the proportion of those types
- Use the student's actual wrong answers as distractor options in multiple-choice tasks
- Words the student confused should appear more frequently for reinforcement
- The **final lesson of Chapter 3** should be a "Challenge" that mixes new vocabulary with previously struggled words

### Tone and style
- Soccer/sports themed: use soccer scenarios, player references, match situations in prompts
- Fun, encouraging hints with pronunciation guides (e.g., "Say 'SHOO-le' like 'school'!")
- Age-appropriate: simple sentences, relatable contexts (school, friends, food, games)
- Emoji usage in flashcards to make them visual and engaging
- Badge should be soccer-themed with a relevant emoji

### Module metadata
- `xpRequired`: follow the existing progression (check existing modules and increment appropriately, typically +200-400 per module)
- `badge`: soccer-themed name and emoji icon
- `theme`: fun theme name relating to the topic

## Step 4: Write the file

1. Write the generated JSON to `src/curriculum/module-XX.json` (where XX is the next number)
2. The file will be auto-discovered by `curriculum.ts` via `import.meta.glob` — no import updates needed

## Step 5: Summary

Print a summary including:
- Module title, theme, and badge
- Chapter titles and key vocabulary introduced
- How many tasks total
- Which struggled items were reinforced and how
- The xpRequired value set
