import React, { useMemo, useRef, useState } from "react";
import {
  Send,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bot,
  User,
  Wifi,
  WifiOff,
  Sparkles,
  Flame,
  Zap,
} from "lucide-react";

import chatScriptDb from "../data/toasty.chatdb.json";
import { recognize } from "../lib/speechRecognizer.js";

type Role = "user" | "assistant" | "system";
type Mode = "Local" | "Cloud" | "Hybrid";
type Preset = "General" | "Coding" | "Tutor" | "Security";

type ScriptRule = {
  id: string;
  label: string;
  keywords: string[];
  responseTemplate: string;
};

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
};

function fillTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(.*?)\}\}/g, (_, key) => vars[key.trim()] ?? "");
}

function buildMockReply(input: string, mode: Mode, preset: Preset): string {
  const lower = input.toLowerCase();

  // 1. Try speech recognizer intent first (fastest path for conversational inputs)
  const recognition = recognize(input);
  if (recognition.intentResponse) {
    return recognition.intentResponse;
  }

  // 2. Script-style pattern matching
  const matchedRule = (chatScriptDb.scripts as ScriptRule[]).find((rule) =>
    rule.keywords.some((kw) => lower.includes(kw))
  );

  if (matchedRule) {
    return fillTemplate(matchedRule.responseTemplate, {
      mode,
      preset,
      presetLower: preset.toLowerCase(),
      input,
    });
  }

  // 3. Append correction hint if any misspellings were caught
  const correctionNote =
    recognition.corrections.length > 0
      ? `\n\n_Auto-corrected: ${recognition.corrections
          .map((c) => `"${c.original}" → "${c.corrected}"`)
          .join(", ")}_`
      : "";

  return (
    fillTemplate(chatScriptDb.defaultResponseTemplate, {
      mode,
      preset,
      presetLower: preset.toLowerCase(),
      input,
    }) + correctionNote
  );
}

// ─── ToastyMills Logo ─────────────────────────────────────────────────────────
function ToastyLogo() {
  return (
    <div className="mt-2 flex items-center gap-3">
      {/* Angry toast icon */}
      <div className="relative w-14 h-14 rounded-xl border-2 border-red-500/60 bg-gradient-to-br from-amber-700 via-orange-600 to-red-700 shadow-[0_0_20px_rgba(239,68,68,0.45)] grid place-items-center overflow-hidden">
        {/* Toast body */}
        <div className="relative w-10 h-10 flex flex-col items-center justify-center">
          {/* Toast top crust */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-3 rounded-t-full bg-amber-800/80 border-t border-amber-400/50" />
          {/* Face */}
          <div className="relative z-10 flex flex-col items-center gap-0.5 mt-1">
            {/* Angry eyes */}
            <div className="flex gap-2.5 items-center">
              <div className="relative w-2 h-1.5 bg-red-900 rounded-sm overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 -rotate-12 origin-left" />
              </div>
              <div className="relative w-2 h-1.5 bg-red-900 rounded-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-0.5 bg-red-500 rotate-12 origin-right" />
              </div>
            </div>
            {/* Mouth — angry frown */}
            <div className="w-4 h-1.5 border-b-2 border-red-800 rounded-b-full mt-0.5" />
          </div>
          {/* Butter pat */}
          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-1.5 bg-yellow-300/80 rounded-sm border border-yellow-200/60" />
        </div>
        {/* Steam lines */}
        <div className="absolute top-0.5 left-2 w-0.5 h-2 bg-orange-200/50 rounded-full" />
        <div className="absolute top-0 left-3.5 w-0.5 h-3 bg-orange-200/40 rounded-full" />
        <div className="absolute top-0.5 right-2 w-0.5 h-2 bg-orange-200/50 rounded-full" />
        {/* Red glow overlay */}
        <div className="absolute inset-0 bg-red-600/10 rounded-xl" />
      </div>

      <div>
        <div className="text-lg font-bold tracking-tight text-red-100 flex items-center gap-1.5">
          ToastyMills
          <Flame className="w-4 h-4 text-red-400" />
        </div>
        <div className="text-xs text-zinc-400">Local-first AI shell (MVP)</div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ role, content }: { role: Role; content: string }) {
  const isUser = role === "user";
  const isSystem = role === "system";

  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={[
          "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm border",
          isUser
            ? "bg-zinc-100 text-zinc-900 border-zinc-200"
            : isSystem
            ? "bg-red-500/10 text-red-200 border-red-500/20"
            : "bg-zinc-900 text-zinc-100 border-zinc-800",
        ].join(" ")}
      >
        <div className="flex items-center gap-2 mb-1 text-xs opacity-80">
          {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
          <span className="uppercase tracking-wide">{role}</span>
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{content}</div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function ToastyMills() {
  const [chats, setChats] = useState<ChatSession[]>(chatScriptDb.chats as ChatSession[]);
  const [activeChatId, setActiveChatId] = useState((chatScriptDb.chats[0] as ChatSession).id);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [mode, setMode] = useState<Mode>("Local");
  const [preset, setPreset] = useState<Preset>("General");
  const [connected, setConnected] = useState(true);
  const [rightPanelWidth, setRightPanelWidth] = useState(340);
  const [lastRecognition, setLastRecognition] = useState<ReturnType<typeof recognize> | null>(null);
  const resizeStartRef = useRef<{ x: number; width: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) ?? chats[0],
    [chats, activeChatId]
  );

  const createNewChat = () => {
    const id = `chat-${Date.now()}`;
    const newChat: ChatSession = {
      id,
      title: "New Chat",
      messages: [
        {
          id: `sys-${Date.now()}`,
          role: "system",
          content: "New session started. ToastyMills local simulation mode active. 🍞",
          createdAt: new Date().toISOString(),
        },
      ],
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(id);
  };

  const appendMessage = (role: Role, content: string) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== activeChatId) return chat;
        const nextMessages: ChatMessage[] = [
          ...chat.messages,
          {
            id: `${role}-${Date.now()}-${Math.random()}`,
            role,
            content,
            createdAt: new Date().toISOString(),
          },
        ];
        const nextTitle =
          chat.title === "New Chat" && role === "user"
            ? content.slice(0, 28) + (content.length > 28 ? "…" : "")
            : chat.title;
        return { ...chat, title: nextTitle, messages: nextMessages };
      })
    );
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const sendMessage = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || isThinking) return;

    // Run recognition pipeline and store for the panel
    const recog = recognize(text);
    setLastRecognition(recog);

    appendMessage("user", text);
    setInput("");
    setIsThinking(true);

    setTimeout(() => {
      appendMessage("assistant", buildMockReply(text, mode, preset));
      setIsThinking(false);
    }, 700);
  };

  const onResizeMouseDown = (e: React.MouseEvent) => {
    resizeStartRef.current = { x: e.clientX, width: rightPanelWidth };
    const onMove = (ev: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const delta = resizeStartRef.current.x - ev.clientX;
      setRightPanelWidth(
        Math.min(520, Math.max(280, resizeStartRef.current.width + delta))
      );
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      resizeStartRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-[#1a0a0a] via-[#1c0d0d] to-[#0d0909] text-zinc-100 flex">
      {/* ── Sidebar ── */}
      <aside className="w-72 border-r border-red-900/30 bg-[#150b0b]/90 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-start justify-between gap-2">
          <ToastyLogo />
          <button
            onClick={createNewChat}
            className="mt-1 inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-900 shrink-0"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        <div className="p-3 space-y-2 overflow-auto flex-1">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={[
                "w-full text-left rounded-xl border px-3 py-2 transition",
                activeChatId === chat.id
                  ? "bg-zinc-900 border-red-800/50"
                  : "bg-zinc-950 border-zinc-900 hover:bg-zinc-900/60 hover:border-zinc-800",
              ].join(" ")}
            >
              <div className="text-sm font-medium truncate">{chat.title}</div>
              <div className="text-xs text-zinc-400 mt-0.5">
                {chat.messages.length} message{chat.messages.length !== 1 ? "s" : ""}
              </div>
            </button>
          ))}
        </div>

        <footer className="border-t border-zinc-800 p-3 text-xs text-zinc-400 bg-zinc-950/95">
          <div className="flex items-center justify-between">
            <span className="text-red-300/80 font-medium">ToastyMills v1</span>
            <span className="text-zinc-500">Local DB</span>
          </div>
          <div className="mt-1 leading-relaxed">
            Grammar engine + speech patterns active • No API required.
          </div>
        </footer>
      </aside>

      {/* ── Main Chat ── */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-950/70 backdrop-blur">
          <div>
            <div className="font-semibold flex items-center gap-1.5">
              {activeChat?.title || "ToastyMills"}
              <Flame className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-xs text-zinc-400">Local-first AI workspace</div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-1 text-xs">
              {connected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" /> Connected
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" /> Offline
                </>
              )}
            </span>
            <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs">{mode}</span>
            <button
              onClick={() => setRightPanelOpen((v) => !v)}
              className="rounded-xl border border-zinc-700 p-2 hover:bg-zinc-900"
              title="Toggle utility panel"
            >
              {rightPanelOpen ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0 flex">
          <section className="flex-1 min-w-0 flex flex-col">
            <div className="flex-1 overflow-auto px-4 py-4">
              {activeChat?.messages?.length ? (
                <>
                  {activeChat.messages.map((m) => (
                    <MessageBubble key={m.id} role={m.role} content={m.content} />
                  ))}
                  {isThinking && (
                    <div className="w-full flex justify-start mb-3">
                      <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-zinc-900 border border-zinc-800 text-zinc-300">
                        <div className="flex items-center gap-2 text-sm">
                          <Sparkles className="w-4 h-4 animate-pulse text-red-400" />
                          ToastyMills is thinking…
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="h-full grid place-items-center text-center px-6">
                  <div className="max-w-lg">
                    <h2 className="text-2xl font-semibold tracking-tight text-red-100">
                      Welcome to ToastyMills 🍞
                    </h2>
                    <p className="text-zinc-400 mt-2">
                      Start with a prompt or click a quick action. Grammar engine + speech
                      patterns are active — no API required.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-zinc-800 p-4 bg-zinc-950/60">
              <div className="flex flex-wrap gap-2 mb-3">
                {chatScriptDb.quickActions.map((qa) => (
                  <button
                    key={qa}
                    onClick={() => sendMessage(`${qa} this concept in a clear way.`)}
                    className="rounded-full border border-red-900/50 px-3 py-1.5 text-xs hover:bg-red-900/20 hover:border-red-700/60 transition"
                  >
                    {qa}
                  </button>
                ))}
              </div>

              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Message ToastyMills…"
                  rows={2}
                  className="flex-1 resize-none rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500/30"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isThinking}
                  className="h-12 w-12 rounded-2xl bg-red-700 hover:bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-500 grid place-items-center transition"
                  title="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* ── Utility / Info Panel ── */}
          {rightPanelOpen && (
            <>
              <div
                onMouseDown={onResizeMouseDown}
                className="w-1.5 cursor-col-resize bg-red-900/20 hover:bg-red-500/30 transition"
                title="Resize utility panel"
              />
              <aside
                style={{ width: rightPanelWidth }}
                className="border-l border-red-900/30 bg-[#150b0b]/80 p-4 overflow-auto"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-4 h-4 text-zinc-300" />
                  <h3 className="font-medium">Utility Panel</h3>
                </div>

                <div className="space-y-4">
                  {/* Mode selector */}
                  <div className="rounded-2xl border border-zinc-800 p-3 bg-zinc-900/40">
                    <div className="text-xs uppercase tracking-wide text-zinc-400 mb-2">Mode</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Local", "Cloud", "Hybrid"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setMode(m)}
                          className={[
                            "rounded-xl px-2 py-2 text-xs border",
                            mode === m
                              ? "bg-red-700/20 border-red-500 text-red-200"
                              : "border-zinc-700 hover:bg-zinc-900",
                          ].join(" ")}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preset selector */}
                  <div className="rounded-2xl border border-zinc-800 p-3 bg-zinc-900/40">
                    <div className="text-xs uppercase tracking-wide text-zinc-400 mb-2">Preset</div>
                    <div className="grid grid-cols-2 gap-2">
                      {(["General", "Coding", "Tutor", "Security"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPreset(p)}
                          className={[
                            "rounded-xl px-2 py-2 text-xs border",
                            preset === p
                              ? "bg-orange-600/20 border-orange-500 text-orange-200"
                              : "border-zinc-700 hover:bg-zinc-900",
                          ].join(" ")}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="rounded-2xl border border-zinc-800 p-3 bg-zinc-900/40 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Connection</span>
                      <button
                        onClick={() => setConnected((v) => !v)}
                        className="rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-900"
                      >
                        Toggle
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Messages</span>
                      <span>{activeChat?.messages.length ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Backend</span>
                      <span className="text-zinc-300">Local / Grammar DB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Script rules</span>
                      <span>{chatScriptDb.scripts.length} patterns</span>
                    </div>
                  </div>

                  {/* Last recognition result */}
                  {lastRecognition && (
                    <div className="rounded-2xl border border-zinc-800 p-3 bg-zinc-900/40 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 uppercase tracking-wide text-zinc-400">
                        <Zap className="w-3 h-3 text-red-400" />
                        Last Recognition
                      </div>
                      <div className="space-y-1 text-zinc-300">
                        <div>
                          <span className="text-zinc-500">Intent: </span>
                          <span className="text-orange-300">
                            {lastRecognition.intent?.label ?? "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Confidence: </span>
                          <span
                            className={
                              lastRecognition.confidence > 0.7
                                ? "text-emerald-400"
                                : lastRecognition.confidence > 0.4
                                ? "text-yellow-400"
                                : "text-red-400"
                            }
                          >
                            {Math.round(lastRecognition.confidence * 100)}%
                          </span>
                        </div>
                        {lastRecognition.corrections.length > 0 && (
                          <div>
                            <span className="text-zinc-500">Corrections: </span>
                            {lastRecognition.corrections
                              .map((c) => `"${c.original}" → "${c.corrected}"`)
                              .join(", ")}
                          </div>
                        )}
                        <div className="text-zinc-500 pt-1">
                          Tokens:{" "}
                          {lastRecognition.tokens
                            .slice(0, 8)
                            .map((t) => `${t.word}[${t.tags[0]}]`)
                            .join(" ")}
                          {lastRecognition.tokens.length > 8 && " …"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Script patterns */}
                  <div className="rounded-2xl border border-zinc-800 p-3 bg-zinc-900/40 text-xs text-zinc-300 space-y-2">
                    <div className="uppercase tracking-wide text-zinc-400">Script Patterns</div>
                    {(chatScriptDb.scripts as ScriptRule[]).map((rule) => (
                      <div
                        key={rule.id}
                        className="rounded-lg border border-zinc-800 p-2 bg-zinc-950/60"
                      >
                        <div className="font-medium text-zinc-200">{rule.label}</div>
                        <div className="text-zinc-400 mt-1">
                          keywords: {rule.keywords.join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reserved */}
                  <div className="rounded-2xl border border-dashed border-zinc-700 p-3 text-xs text-zinc-400 leading-relaxed">
                    Reserved for future features:{"\n"}
                    • Tool logs{"\n"}
                    • Patch preview{"\n"}
                    • File context{"\n"}
                    • Task timeline{"\n"}
                    • Model selector (Ollama / API)
                  </div>
                </div>
              </aside>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
