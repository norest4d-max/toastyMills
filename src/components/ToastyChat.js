import React, { useState, useRef, useEffect, useCallback } from "react";
import { generateReply } from "../engine/chatEngine";
import styles from "./ToastyChat.module.css";

const QUICK_ACTIONS = [
  { label: "Help", text: "help" },
  { label: "Define a word", text: "define resilience" },
  { label: "Synonyms", text: "synonyms of melancholy" },
  { label: "Connect words", text: "connect joy and sorrow" },
  { label: "Emotion words", text: "emotion words" },
  { label: "Similar to…", text: "similar to luminous" },
];

const WELCOME_MESSAGES = [
  {
    id: "sys-1",
    role: "system",
    text: "ToastyMills local-first vocabulary engine active. All knowledge is powered by the built-in dictionary and thesaurus — no API needed.",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  },
  {
    id: "bot-1",
    role: "assistant",
    text: "Hey! I'm ToastyMills 🍞🔥 — your local word-connection engine.\n\nI know **33 dictionary terms** and can trace thesaurus paths between any two connected words.\n\nTry `define ephemeral`, `synonyms of melancholy`, or `connect joy and sorrow`.\nType `help` for all commands.",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  },
];

/**
 * Render plain text with **bold** markdown as <strong> elements.
 */
function RichText({ text }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
      )}
    </>
  );
}

function Message({ msg }) {
  return (
    <div className={`${styles.message} ${styles[msg.role]}`}>
      <div className={styles.bubble}>
        {msg.text.split("\n").map((line, i) => (
          <span key={i}>
            {i > 0 && <br />}
            <RichText text={line} />
          </span>
        ))}
      </div>
      {msg.time && <span className={styles.meta}>{msg.time}</span>}
    </div>
  );
}

function ToastyChat({ terms }) {
  const [messages, setMessages] = useState(WELCOME_MESSAGES);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    (text) => {
      const trimmed = (text || input).trim();
      if (!trimmed) return;

      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const userMsg = {
        id: `u-${Date.now()}`,
        role: "user",
        text: trimmed,
        time,
      };

      const replyText = generateReply(trimmed, terms);
      const botMsg = {
        id: `b-${Date.now() + 1}`,
        role: "assistant",
        text: replyText,
        time,
      };

      setMessages((prev) => [...prev, userMsg, botMsg]);
      setInput("");
    },
    [input, terms]
  );

  function handleSubmit(e) {
    e.preventDefault();
    send();
  }

  function handleQuickAction(text) {
    send(text);
  }

  return (
    <div className={styles.container}>
      {/* Message thread */}
      <div className={styles.messages}>
        {messages.map((msg) => (
          <Message key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick action chips */}
      <div className={styles.quickActions}>
        {QUICK_ACTIONS.map((qa) => (
          <button
            key={qa.label}
            className={styles.quickBtn}
            onClick={() => handleQuickAction(qa.text)}
          >
            {qa.label}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className={styles.inputBar}>
        <input
          className={styles.input}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="define [word] · synonyms [word] · connect [A] and [B] · help"
          aria-label="Chat input"
          autoFocus
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={!input.trim()}
        >
          Send 🔥
        </button>
      </form>
    </div>
  );
}

export default ToastyChat;
