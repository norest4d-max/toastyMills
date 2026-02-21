import React, { useState, useEffect, useMemo } from "react";
import {
  generateChallenge,
  scoreGuess,
  buildThesaurusGraph,
  getSimilarityPath,
} from "../engine/similarityEngine";
import styles from "./SimilarityGame.module.css";

const MAX_GUESSES = 5;

function SimilarityGame({ terms }) {
  const graph = useMemo(() => buildThesaurusGraph(terms), [terms]);

  const [challenge, setChallenge] = useState(null);
  const [input, setInput] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [round, setRound] = useState(1);
  const [revealed, setRevealed] = useState(false);
  const [hintsShown, setHintsShown] = useState(1);

  useEffect(() => {
    startNewChallenge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startNewChallenge() {
    setChallenge(generateChallenge(terms));
    setGuesses([]);
    setInput("");
    setRevealed(false);
    setHintsShown(1);
  }

  function handleNewRound() {
    setRound((r) => r + 1);
    startNewChallenge();
  }

  function handleGuess(e) {
    e.preventDefault();
    if (!input.trim() || !challenge || revealed) return;

    const result = scoreGuess(input.trim(), challenge.targetWord, terms);
    const path = getSimilarityPath(
      input.trim().toLowerCase(),
      challenge.targetWord.toLowerCase(),
      graph
    );
    const newGuess = { word: input.trim(), ...result, path };
    const updatedGuesses = [...guesses, newGuess];
    setGuesses(updatedGuesses);
    setInput("");

    const isExact = result.score === 100;
    const outOfGuesses = updatedGuesses.length >= MAX_GUESSES;

    if (isExact || outOfGuesses) {
      setRevealed(true);
      setTotalScore((s) => s + result.score);
    } else {
      // Reveal an extra hint after each guess
      setHintsShown((h) => Math.min(h + 1, challenge.hints.length));
    }
  }

  const guessesLeft = challenge ? MAX_GUESSES - guesses.length : MAX_GUESSES;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Round</span>
          <span className={styles.statValue}>{round}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total Score</span>
          <span className={styles.statValue}>{totalScore}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Guesses Left</span>
          <span className={styles.statValue}>{guessesLeft}</span>
        </div>
      </div>

      {challenge && (
        <div className={styles.challengeBox}>
          <h2 className={styles.challengeTitle}>Guess the Word</h2>

          <div className={styles.hints}>
            {challenge.hints.slice(0, hintsShown).map((hint, i) => (
              <div key={i} className={styles.hint}>
                <span className={styles.hintIcon}>💡</span> {hint}
              </div>
            ))}
          </div>

          {revealed && (
            <div className={styles.revealBanner}>
              The word was: <strong>{challenge.targetWord}</strong>
            </div>
          )}

          {!revealed && (
            <form onSubmit={handleGuess} className={styles.guessForm}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a related word…"
                className={styles.guessInput}
                aria-label="Guess input"
                autoFocus
              />
              <button
                type="submit"
                className={styles.guessBtn}
                disabled={!input.trim()}
              >
                Guess
              </button>
            </form>
          )}

          {revealed && (
            <button onClick={handleNewRound} className={styles.newBtn}>
              New Challenge
            </button>
          )}
        </div>
      )}

      {guesses.length > 0 && (
        <div className={styles.history}>
          <h3 className={styles.historyTitle}>Guess History</h3>
          {guesses.map((g, i) => (
            <div key={i} className={`${styles.guessResult} ${scoreClass(g.score, styles)}`}>
              <div className={styles.guessRow}>
                <span className={styles.guessWord}>{g.word}</span>
                <span className={styles.guessScore}>{g.score} pts</span>
              </div>
              <p className={styles.guessFeedback}>{g.feedback}</p>
              {g.path && g.path.length > 1 && (
                <div className={styles.path}>
                  Path: {g.path.join(" → ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function scoreClass(score, styles) {
  if (score >= 80) return styles.excellent;
  if (score >= 60) return styles.good;
  if (score >= 40) return styles.fair;
  return styles.poor;
}

export default SimilarityGame;
