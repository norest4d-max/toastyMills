/**
 * Builds an adjacency list from synonyms across all dictionary terms.
 * @param {Array} terms - array of dictionary term objects
 * @returns {Object} adjacency list { word: [similar1, similar2, ...] }
 */
export function buildThesaurusGraph(terms) {
  const graph = {};

  terms.forEach((term) => {
    if (!graph[term.word]) graph[term.word] = new Set();

    term.synonyms.forEach((syn) => {
      graph[term.word].add(syn);
      if (!graph[syn]) graph[syn] = new Set();
      graph[syn].add(term.word);
    });
  });

  // Convert Sets to arrays
  const result = {};
  Object.keys(graph).forEach((key) => {
    result[key] = Array.from(graph[key]);
  });
  return result;
}

/**
 * Finds all dictionary terms similar to the given word.
 * @param {string} word
 * @param {Array} terms
 * @returns {Array} [{ term, connection, strength }]
 */
export function findSimilarities(word, terms) {
  const lowerWord = word.toLowerCase();
  const results = [];

  terms.forEach((term) => {
    if (term.word === lowerWord) return;

    const lowerSynonyms = term.synonyms.map((s) => s.toLowerCase());
    const lowerAntonyms = term.antonyms.map((a) => a.toLowerCase());

    // Direct synonym match
    if (lowerSynonyms.includes(lowerWord)) {
      results.push({ term, connection: "synonym", strength: 90 });
      return;
    }

    // Antonym match
    if (lowerAntonyms.includes(lowerWord)) {
      results.push({ term, connection: "antonym", strength: 40 });
      return;
    }

    // Shared synonyms (transitive)
    const sourceTerm = terms.find((t) => t.word === lowerWord);
    if (sourceTerm) {
      const sourceSyns = sourceTerm.synonyms.map((s) => s.toLowerCase());
      const sharedSyns = sourceSyns.filter((s) => lowerSynonyms.includes(s));
      if (sharedSyns.length > 0) {
        results.push({
          term,
          connection: `shared synonym: ${sharedSyns[0]}`,
          strength: 60 + Math.min(sharedSyns.length * 5, 20),
        });
        return;
      }

      // Same category
      if (term.category === sourceTerm.category) {
        results.push({ term, connection: "same category", strength: 30 });
      }
    }
  });

  return results.sort((a, b) => b.strength - a.strength);
}

/**
 * BFS shortest path between two words in the thesaurus graph.
 * @param {string} wordA
 * @param {string} wordB
 * @param {Object} graph
 * @returns {Array|null} path array or null if no path
 */
export function getSimilarityPath(wordA, wordB, graph) {
  if (wordA === wordB) return [wordA];
  if (!graph[wordA] || !graph[wordB]) return null;

  const queue = [[wordA]];
  const visited = new Set([wordA]);

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];
    const neighbors = graph[current] || [];

    for (const neighbor of neighbors) {
      if (neighbor === wordB) return [...path, wordB];
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return null;
}

/**
 * Scores a guess against the target word.
 * @param {string} guessWord
 * @param {string} targetWord
 * @param {Array} terms
 * @returns {{ score: number, feedback: string, connections: Array }}
 */
export function scoreGuess(guessWord, targetWord, terms) {
  const guess = guessWord.toLowerCase().trim();
  const target = targetWord.toLowerCase().trim();

  if (guess === target) {
    return { score: 100, feedback: "Exact match! You got it!", connections: [] };
  }

  const targetTerm = terms.find((t) => t.word === target);
  if (!targetTerm) {
    return { score: 0, feedback: "Target word not found in dictionary.", connections: [] };
  }

  const guessTerm = terms.find((t) => t.word === guess);
  const connections = [];
  let score = 0;

  // Check direct synonym/antonym relationship
  const targetSyns = targetTerm.synonyms.map((s) => s.toLowerCase());
  const targetAnts = targetTerm.antonyms.map((a) => a.toLowerCase());

  if (targetSyns.includes(guess)) {
    score = 85;
    connections.push({ type: "synonym", words: [guess, target] });
  } else if (targetAnts.includes(guess)) {
    score = 35;
    connections.push({ type: "antonym", words: [guess, target] });
  } else if (guessTerm) {
    const guessSyns = guessTerm.synonyms.map((s) => s.toLowerCase());
    const guessAnts = guessTerm.antonyms.map((a) => a.toLowerCase());

    if (guessSyns.includes(target)) {
      score = 85;
      connections.push({ type: "synonym", words: [guess, target] });
    } else if (guessAnts.includes(target)) {
      score = 35;
      connections.push({ type: "antonym", words: [guess, target] });
    } else {
      // Shared synonyms
      const shared = targetSyns.filter((s) => guessSyns.includes(s));
      if (shared.length > 0) {
        score = 50 + Math.min(shared.length * 8, 25);
        connections.push({ type: "shared synonym", words: shared });
      } else if (guessTerm.category === targetTerm.category) {
        score = 20;
        connections.push({ type: "same category", words: [guessTerm.category] });
      }
    }
  }

  // Build graph and find path
  const graph = buildThesaurusGraph(terms);
  const path = getSimilarityPath(guess, target, graph);
  if (path) {
    connections.push({ type: "path", words: path });
    if (score === 0) {
      // Partial credit for being in the graph neighborhood
      score = Math.max(10, 70 - (path.length - 2) * 15);
    }
  }

  let feedback;
  if (score >= 80) feedback = "Very close! Strong connection found.";
  else if (score >= 60) feedback = "Good guess! Related through shared concepts.";
  else if (score >= 40) feedback = "Somewhat related — keep trying!";
  else if (score >= 20) feedback = "Loosely connected. Think more closely.";
  else feedback = "No clear connection found. Try a synonym or related concept.";

  return { score, feedback, connections };
}

/**
 * Generates a random challenge from the dictionary.
 * @param {Array} terms
 * @returns {{ targetWord: string, hints: Array, maxGuesses: number }}
 */
export function generateChallenge(terms) {
  const idx = Math.floor(Math.random() * terms.length);
  const target = terms[idx];

  const hints = [
    `Category: ${target.category}`,
    `It has ${target.synonyms.length} known synonyms`,
    `First letter: "${target.word[0].toUpperCase()}"`,
    `Definition hint: ${target.definition.split(" ").slice(0, 5).join(" ")}...`,
  ];

  return {
    targetWord: target.word,
    hints,
    maxGuesses: 5,
  };
}
