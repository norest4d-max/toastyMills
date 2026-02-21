# ToastyMills 🍞🔥

**ToastyMills** is a local-first AI chat interface — an angry-butter-toast themed workspace that runs entirely in the browser with no external API required.

## Features

- **Local grammar engine** — full parts-of-speech database, sentence structure patterns, contractions, and slang expansion (`src/data/grammar.json`)
- **Simulated speech recognizer** — multi-stage pipeline that mirrors a real ASR system: acoustic normalization → phoneme rules → misspelling correction → POS tagging → intent resolution (`src/lib/speechRecognizer.js`)
- **Flexible pattern matching** — Levenshtein edit-distance fuzzy matching handles typos and close misspellings (`src/lib/patternMatcher.js`)
- **Script-based response routing** — keyword-matched response templates with a default fallback (`src/data/toasty.chatdb.json`)
- **Intent detection** — recognizes greetings, farewells, help requests, agreement/disagreement, and more from natural/informal speech (`src/data/speech-patterns.json`)
- **Utility panel** — live recognition diagnostics: intent, confidence score, corrections, and POS token tags

## Data Files

| File | Purpose |
|------|---------|
| `src/data/toasty.chatdb.json` | Chat sessions, quick actions, and script routing patterns |
| `src/data/grammar.json` | Parts of speech, sentence structures, contractions, slang |
| `src/data/speech-patterns.json` | Misspelling corrections, phonetic rules, intent patterns |

## Getting Started

```bash
npm install
npm run dev
```

## Tech Stack

- React + TypeScript (Vite)
- Tailwind CSS
- Lucide React icons
- All AI/NLP logic is pure local JavaScript — zero external API calls
