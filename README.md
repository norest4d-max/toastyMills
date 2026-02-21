# ToastyMills — Vocabulary Explorer & Similarity Game

A React application for exploring a rich dictionary and testing your word-connection skills through an interactive similarity guessing game.

## Features

### 📖 Dictionary Browser
- Browse 33 curated vocabulary terms spanning five categories: **abstract**, **emotion**, **nature**, **action**, and **cognitive**
- Live search filters by word, definition, category, or synonyms
- Each card shows the word, category badge, definition, synonym chips, and antonym chips

### 🎮 Similarity Game
- A new challenge is generated from the dictionary each round
- Progressive hints are revealed after each incorrect guess (category, synonym count, first letter, partial definition)
- Type a guess — the engine scores it 0–100 based on synonym/antonym relationships, shared synonyms, and BFS graph path distance
- Shows the similarity path between your guess and the target word
- Tracks round number and cumulative score

## Project Structure

```
src/
├── data/
│   └── dictionary.js          # 30+ term objects with synonyms & antonyms
├── engine/
│   └── similarityEngine.js    # Pure JS similarity/scoring logic
├── components/
│   ├── DictionaryBrowser.js   # Dictionary browse & search UI
│   ├── DictionaryBrowser.module.css
│   ├── SimilarityGame.js      # Guessing game UI
│   └── SimilarityGame.module.css
├── App.js                     # Tab navigation, renders both views
└── App.css                    # Global styles
```

## Similarity Engine API

| Function | Description |
|---|---|
| `buildThesaurusGraph(terms)` | Returns adjacency list built from synonym relationships |
| `findSimilarities(word, terms)` | Returns `[{ term, connection, strength }]` sorted by strength |
| `getSimilarityPath(wordA, wordB, graph)` | BFS shortest path between two words, or `null` |
| `scoreGuess(guessWord, targetWord, terms)` | Returns `{ score: 0-100, feedback, connections }` |
| `generateChallenge(terms)` | Returns `{ targetWord, hints[], maxGuesses: 5 }` |

## Getting Started

```bash
npm install
npm start        # development server at http://localhost:3000
npm run build    # production build
npm test         # run tests
```

## Tech Stack

- **React** 19 with functional components and hooks (`useState`, `useEffect`, `useMemo`)
- **Create React App** — zero-config build tooling
- **CSS Modules** — scoped component styles
- No external UI libraries

