import React, { useState, useMemo } from "react";
import styles from "./DictionaryBrowser.module.css";

function DictionaryBrowser({ terms }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return terms;
    return terms.filter(
      (t) =>
        t.word.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.synonyms.some((s) => s.toLowerCase().includes(q))
    );
  }, [query, terms]);

  return (
    <div className={styles.container}>
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search words, definitions, categories…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchInput}
          aria-label="Search dictionary"
        />
        <span className={styles.count}>{filtered.length} terms</span>
      </div>

      <div className={styles.grid}>
        {filtered.map((term) => (
          <div key={term.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.word}>{term.word}</span>
              <span className={`${styles.badge} ${styles[term.category]}`}>
                {term.category}
              </span>
            </div>
            <p className={styles.definition}>{term.definition}</p>
            {term.synonyms.length > 0 && (
              <div className={styles.chips}>
                <span className={styles.chipsLabel}>Synonyms:</span>
                {term.synonyms.map((syn) => (
                  <span key={syn} className={styles.chip}>
                    {syn}
                  </span>
                ))}
              </div>
            )}
            {term.antonyms.length > 0 && (
              <div className={styles.chips}>
                <span className={styles.chipsLabel}>Antonyms:</span>
                {term.antonyms.map((ant) => (
                  <span key={ant} className={`${styles.chip} ${styles.antonym}`}>
                    {ant}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className={styles.empty}>No terms match your search.</p>
      )}
    </div>
  );
}

export default DictionaryBrowser;
