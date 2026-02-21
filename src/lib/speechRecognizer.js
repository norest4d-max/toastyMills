/**
 * speechRecognizer.js
 * ToastyMills — simulated production speech recognizer controller.
 *
 * This is a FAKE speech recognizer that simulates what a real ASR (automatic
 * speech recognition) pipeline would do, using only local JSON data.
 *
 * Simulated pipeline stages:
 *  1. "Acoustic" normalization  — strip noise chars, normalize whitespace
 *  2. Phoneme normalization      — apply phonetic rules from speech-patterns.json
 *  3. Language model pass        — misspelling correction + slang expansion
 *  4. Grammar tagging            — tag tokens with rough parts-of-speech
 *  5. Intent resolution          — map to intent + canned response
 *
 * No external API, no Web Speech API calls — all local, all inspectable.
 */

import speechPatterns from "../data/speech-patterns.json";
import grammar from "../data/grammar.json";
import { analyzeInput, tokenize, editDistance } from "./patternMatcher.js";

// ─── Stage 1 · Acoustic Normalization ────────────────────────────────────────
/**
 * Strip non-linguistic noise and normalize spacing.
 * In a real ASR this would be the acoustic model output cleaning step.
 * @param {string} raw
 * @returns {string}
 */
function acousticNormalize(raw) {
  return raw
    .replace(/[^\w\s',.!?;:-]/g, "") // strip unusual chars
    .replace(/\s{2,}/g, " ")          // collapse multiple spaces
    .trim();
}

// ─── Stage 2 · Phoneme Normalization ──────────────────────────────────────────
/**
 * Apply phonetic substitution rules from speech-patterns.json.
 * Simulates the phoneme-to-grapheme mapping in a real ASR decoder.
 * @param {string} input
 * @returns {string}
 */
function phonemeNormalize(input) {
  let result = input;
  for (const rule of speechPatterns.phoneticRules) {
    const regex = new RegExp(escapeRegex(rule.pattern), "gi");
    result = result.replace(regex, rule.replacement);
  }
  return result;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Stage 3 · Part-of-Speech Tagger (basic lookup) ──────────────────────────
// Build a flat lookup from the grammar JSON for fast tagging.
const posLookup = buildPosLookup();

function buildPosLookup() {
  const map = {};
  const pos = grammar.partsOfSpeech;

  const tag = (list, label) => {
    if (!Array.isArray(list)) return;
    list.forEach((w) => {
      const key = w.toLowerCase();
      if (!map[key]) map[key] = [];
      if (!map[key].includes(label)) map[key].push(label);
    });
  };

  tag(pos.nouns.concrete,           "noun");
  tag(pos.nouns.abstract,           "noun");
  tag(pos.nouns.proper,             "noun");
  tag(pos.nouns.collective,         "noun");
  tag(pos.pronouns.personal_subject,"pronoun");
  tag(pos.pronouns.personal_object, "pronoun");
  tag(pos.pronouns.possessive,      "pronoun");
  tag(pos.pronouns.demonstrative,   "pronoun");
  tag(pos.pronouns.interrogative,   "pronoun");
  tag(pos.verbs.action,             "verb");
  tag(pos.verbs.linking,            "verb");
  tag(pos.verbs.auxiliary,          "aux");
  tag(pos.adjectives.descriptive,   "adj");
  tag(pos.adjectives.quantity,      "adj");
  tag(pos.adverbs.manner,           "adv");
  tag(pos.adverbs.time,             "adv");
  tag(pos.adverbs.place,            "adv");
  tag(pos.adverbs.degree,           "adv");
  tag(pos.prepositions,             "prep");
  tag(pos.conjunctions.coordinating,"conj");
  tag(pos.conjunctions.subordinating,"conj");
  tag(pos.articles.definite,        "art");
  tag(pos.articles.indefinite,      "art");
  tag(pos.interjections,            "interj");

  return map;
}

/**
 * Tag a single token with its part(s) of speech.
 * Falls back to "unknown" for unrecognized words.
 * @param {string} token
 * @returns {string[]}
 */
function tagToken(token) {
  const key = token.toLowerCase();
  if (posLookup[key]) return posLookup[key];

  // Heuristic fallbacks
  if (/ly$/.test(key))  return ["adv"];
  if (/ing$/.test(key)) return ["verb"];
  if (/ed$/.test(key))  return ["verb"];
  if (/tion$|sion$/.test(key)) return ["noun"];
  if (/ness$|ment$|ity$/.test(key)) return ["noun"];
  if (/ful$|ous$|ive$|able$|ible$/.test(key)) return ["adj"];

  return ["unknown"];
}

// ─── Stage 4 · Confidence Scoring ─────────────────────────────────────────────
/**
 * Compute a mock confidence score for the recognition result.
 * In a real ASR this comes from the acoustic + language model probabilities.
 * Here we simulate it based on how many tokens were recognized or corrected.
 * @param {{ tags: string[][] }} taggedTokens
 * @param {{ corrections: Array<{original: string, corrected: string}> }} analysis
 * @returns {number} 0.0 – 1.0
 */
function computeConfidence(taggedTokens, analysis) {
  const total = taggedTokens.length;
  if (total === 0) return 0;
  const unknown = taggedTokens.filter((t) => t.tags.includes("unknown")).length;
  const corrected = analysis.corrections.length;
  const recognizedRatio = (total - unknown) / total;
  const correctionPenalty = Math.min(0.2, corrected * 0.04);
  return Math.max(0, Math.min(1, recognizedRatio - correctionPenalty));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Main entry point — simulate full speech recognition on a text input.
 *
 * Returns a rich recognition result object similar to what a real
 * cloud ASR API would return, but computed entirely locally.
 *
 * @param {string} rawInput  Raw user input (typed or from mic transcript)
 * @returns {{
 *   transcript: string,
 *   normalizedTranscript: string,
 *   tokens: Array<{ word: string, tags: string[] }>,
 *   corrections: Array<{ original: string, corrected: string }>,
 *   intent: { intentId: string, label: string, intent: string } | null,
 *   intentResponse: string | null,
 *   confidence: number,
 *   stages: {
 *     acoustic: string,
 *     phoneme: string,
 *     lm: string
 *   }
 * }}
 */
export function recognize(rawInput) {
  // Stage 1 — acoustic
  const acoustic = acousticNormalize(rawInput);

  // Stage 2 — phoneme (only applied to check; we use corrected text for display)
  const phoneme = phonemeNormalize(acoustic);

  // Stage 3 — language model: misspelling correction + intent
  const analysis = analyzeInput(acoustic);

  // Stage 4 — POS tagging on corrected tokens
  const taggedTokens = analysis.tokens.map((word) => ({
    word,
    tags: tagToken(word),
  }));

  // Stage 5 — confidence
  const confidence = computeConfidence(taggedTokens, analysis);

  return {
    transcript: rawInput,
    normalizedTranscript: analysis.corrected,
    tokens: taggedTokens,
    corrections: analysis.corrections,
    intent: analysis.intent,
    intentResponse: analysis.intentResponse,
    confidence,
    stages: {
      acoustic,
      phoneme,
      lm: analysis.corrected,
    },
  };
}

/**
 * Lightweight version — just returns the intent and response.
 * Use this when you only need the chat reply, not the full diagnostic output.
 * @param {string} rawInput
 * @returns {{ intent: string | null, response: string | null, confidence: number }}
 */
export function quickRecognize(rawInput) {
  const result = recognize(rawInput);
  return {
    intent: result.intent?.intent ?? null,
    response: result.intentResponse,
    confidence: result.confidence,
  };
}
