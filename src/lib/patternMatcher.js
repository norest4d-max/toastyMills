/**
 * patternMatcher.js
 * ToastyMills — flexible pattern matching engine.
 *
 * Handles:
 *  - Common misspelling correction (lookup table from speech-patterns.json)
 *  - Fuzzy/edit-distance matching for close typos
 *  - Contraction + slang expansion (from grammar.json)
 *  - Intent detection via flexible keyword patterns
 *
 * No external API required — all data is local JSON.
 */

import speechPatterns from "../data/speech-patterns.json";
import grammar from "../data/grammar.json";

// ─── Levenshtein Edit Distance ────────────────────────────────────────────────
/**
 * Compute Levenshtein edit distance between two strings.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// ─── Tokenizer ─────────────────────────────────────────────────────────────────
/**
 * Split input into cleaned tokens.
 * @param {string} input
 * @returns {string[]}
 */
export function tokenize(input) {
  const { stripLeading, stripTrailing } = speechPatterns.tokenizationRules;
  return input
    .split(/[\s,!?;:]+/)
    .map((tok) => {
      let t = tok;
      stripLeading.forEach((ch) => { if (t.startsWith(ch)) t = t.slice(1); });
      stripTrailing.forEach((ch) => { if (t.endsWith(ch)) t = t.slice(0, -1); });
      return t.toLowerCase();
    })
    .filter(Boolean);
}

// ─── Misspelling Correction ────────────────────────────────────────────────────
const misspellingMap = Object.fromEntries(
  speechPatterns.commonMisspellings.map(({ wrong, correct }) => [wrong.toLowerCase(), correct])
);

/**
 * Correct a single word using the misspelling lookup table.
 * @param {string} word
 * @returns {string} corrected word (or original if no correction found)
 */
export function correctMisspelling(word) {
  return misspellingMap[word.toLowerCase()] ?? word;
}

// ─── Contraction / Slang Expansion ────────────────────────────────────────────
const contractionMap = Object.fromEntries(
  Object.entries(grammar.contractions).map(([k, v]) => [k.toLowerCase(), v])
);
const slangMap = Object.fromEntries(
  Object.entries(grammar.slangAndInformal).map(([k, v]) => [k.toLowerCase(), v])
);

/**
 * Expand contractions and slang in a raw input string.
 * @param {string} input
 * @returns {string}
 */
export function expandContractions(input) {
  let result = input;
  // Sort by length descending so longer matches are tried first
  const allEntries = [
    ...Object.entries(contractionMap),
    ...Object.entries(slangMap),
  ].sort((a, b) => b[0].length - a[0].length);

  for (const [key, value] of allEntries) {
    // Word-boundary-aware replacement (case-insensitive)
    const regex = new RegExp(`(?<![\\w'])${escapeRegex(key)}(?![\\w'])`, "gi");
    result = result.replace(regex, value);
  }
  return result;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Fuzzy Word Match ─────────────────────────────────────────────────────────
const { maxEditDistance, minWordLength } = speechPatterns.fuzzyMatchConfig;

/**
 * Find the closest matching word from a candidate list using edit distance.
 * Returns null if no close-enough match found.
 * @param {string} word
 * @param {string[]} candidates
 * @returns {{ match: string, distance: number } | null}
 */
export function fuzzyMatch(word, candidates) {
  if (word.length < minWordLength) return null;
  let best = null;
  let bestDist = Infinity;
  for (const candidate of candidates) {
    const dist = editDistance(word.toLowerCase(), candidate.toLowerCase());
    if (dist < bestDist && dist <= maxEditDistance) {
      bestDist = dist;
      best = candidate;
    }
  }
  return best ? { match: best, distance: bestDist } : null;
}

// ─── Intent Detection ─────────────────────────────────────────────────────────
/**
 * Detect the user's intent from a normalized input string.
 * Checks flexible pattern lists from speech-patterns.json.
 * @param {string} input  (already lowercased/trimmed)
 * @returns {{ intentId: string, label: string, intent: string } | null}
 */
export function detectIntent(input) {
  const normalized = input.toLowerCase().trim();

  for (const entry of speechPatterns.flexibleIntentPatterns) {
    for (const pattern of entry.patterns) {
      // Exact substring match first
      if (normalized === pattern || normalized.includes(pattern)) {
        return { intentId: entry.id, label: entry.label, intent: entry.intent };
      }
      // Fuzzy match: split pattern into words and check each token
      const patternTokens = tokenize(pattern);
      const inputTokens = tokenize(normalized);
      const allMatch = patternTokens.every((pt) =>
        inputTokens.some((it) => editDistance(it, pt) <= (pt.length >= 4 ? 1 : 0))
      );
      if (patternTokens.length > 0 && allMatch) {
        return { intentId: entry.id, label: entry.label, intent: entry.intent };
      }
    }
  }
  return null;
}

/**
 * Get a canned response for a detected intent.
 * @param {string} intent
 * @returns {string | null}
 */
export function getIntentResponse(intent) {
  return speechPatterns.intentResponses[intent] ?? null;
}

// ─── Full Pipeline ─────────────────────────────────────────────────────────────
/**
 * Run the full pattern-matching pipeline on raw user input.
 *
 * Steps:
 *  1. Expand contractions / slang
 *  2. Tokenize
 *  3. Correct misspellings per token
 *  4. Detect intent
 *
 * @param {string} rawInput
 * @returns {{
 *   original: string,
 *   expanded: string,
 *   corrected: string,
 *   tokens: string[],
 *   corrections: Array<{ original: string, corrected: string }>,
 *   intent: { intentId: string, label: string, intent: string } | null,
 *   intentResponse: string | null
 * }}
 */
export function analyzeInput(rawInput) {
  const expanded = expandContractions(rawInput);
  const tokens = tokenize(expanded);

  const corrections = [];
  const correctedTokens = tokens.map((tok) => {
    const fixed = correctMisspelling(tok);
    if (fixed !== tok) corrections.push({ original: tok, corrected: fixed });
    return fixed;
  });

  const corrected = correctedTokens.join(" ");
  const intentResult = detectIntent(corrected) ?? detectIntent(expanded);

  return {
    original: rawInput,
    expanded,
    corrected,
    tokens: correctedTokens,
    corrections,
    intent: intentResult,
    intentResponse: intentResult ? getIntentResponse(intentResult.intent) : null,
  };
}
