# ToastyMills 🍞🔥

**ToastyMills** is a local-first React vocabulary engine — no external API required. It gives you three tools built on a single dictionary and thesaurus graph:

1. **🔥 Chat** — conversational word-lookup powered by the dictionary and similarity engine
2. **📖 Dictionary** — browse and search 33 curated terms with synonyms and antonyms
3. **🧠 Similarity Game** — guess a mystery word using progressive hints and scored connections

---

## Getting Started

```bash
npm install
npm start        # development server → http://localhost:3000
npm run build    # production build
npm test         # run tests
```

---

## How to Use

### 🔥 Chat Tab

The Chat tab is a local AI chat interface powered entirely by the dictionary and thesaurus — no internet or API key needed.

**Available commands:**

| Command | Example | What it does |
|---|---|---|
| `define [word]` | `define ephemeral` | Full definition, category, synonyms & antonyms |
| `synonyms [word]` | `synonyms melancholy` | Lists all synonyms |
| `antonyms [word]` | `antonyms resilience` | Lists all antonyms |
| `similar to [word]` | `similar to luminous` | Finds related terms ranked by connection strength |
| `connect [A] and [B]` | `connect joy and sorrow` | Shortest thesaurus path between two words |
| `[category] words` | `emotion words` | All terms in a category |
| `help` | `help` | Show all commands |
| `[word]` | `tenacity` | Quick single-word lookup |

**Quick action buttons** below the header let you fire common queries with one click.

---

### 📖 Dictionary Tab

- Type in the search box to filter by word, definition, category, or synonyms
- Each card shows: **word**, category badge, definition, synonym chips (blue), antonym chips (red)
- Categories: `abstract` · `emotion` · `nature` · `action` · `cognitive`

---

### 🧠 Similarity Game Tab

1. A mystery word is chosen from the dictionary
2. You start with one hint (category)
3. Type a guess and press **Guess** — the engine scores your answer 0–100:
   - **100** exact match
   - **85** direct synonym
   - **60–75** shared synonyms (transitive connection)
   - **35** antonym
   - **10–50** graph-distance score (BFS path)
4. A new hint unlocks after each incorrect guess (synonym count → first letter → partial definition)
5. After 5 guesses or a correct answer, the word is revealed and a new challenge starts

---

## Project Structure

```
src/
├── data/
│   └── dictionary.js          # #01 — 33 term objects: word, definition, category, synonyms, antonyms
├── engine/
│   ├── similarityEngine.js    # #02 — thesaurus graph, BFS path, scoring, challenge generation
│   └── chatEngine.js          # Intent detection + reply generation for the Chat tab
├── components/
│   ├── ToastyChat.js          # Chat UI (local-first, no API)
│   ├── ToastyChat.module.css
│   ├── DictionaryBrowser.js   # Dictionary browse & search UI
│   ├── DictionaryBrowser.module.css
│   ├── SimilarityGame.js      # Guessing game UI
│   └── SimilarityGame.module.css
├── App.js                     # Three-tab navigation
└── App.css                    # Global dark theme
```

---

## Engine API Reference

### `similarityEngine.js`

| Function | Description |
|---|---|
| `buildThesaurusGraph(terms)` | Bidirectional adjacency list from synonym relationships |
| `findSimilarities(word, terms)` | Returns `[{ term, connection, strength }]` sorted by strength |
| `getSimilarityPath(wordA, wordB, graph)` | BFS shortest semantic path, or `null` |
| `scoreGuess(guessWord, targetWord, terms)` | Returns `{ score: 0-100, feedback, connections }` |
| `generateChallenge(terms)` | Returns `{ targetWord, hints[], maxGuesses: 5 }` |

### `chatEngine.js`

| Function | Description |
|---|---|
| `detectIntent(input)` | Returns `{ id, params }` or `null` — matches 8 intent patterns via regex |
| `generateReply(input, terms)` | Full pipeline: intent detection → engine call → formatted reply |

---

## Tech Stack

- **React 19** — functional components, hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`)
- **Create React App** — zero-config build tooling
- **CSS Modules** — scoped component styles, dark red/toast theme
- **Pure JS** — all NLP/similarity logic is local, zero external API calls

