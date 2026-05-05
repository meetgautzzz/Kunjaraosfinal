"use client";

import React, { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import type { ProposalData } from "@/lib/proposals";

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = "user" | "assistant";

type ChatMessage = {
  id:      string;
  role:    Role;
  content: string;
  actions?: ParsedAction[];
};

type ParsedAction = {
  label:       string;
  href:        string;
  description: string;
  icon:        "spark" | "deck" | "vendor" | "event" | "compliance" | "budget" | "default";
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseActions(content: string): { text: string; actions: ParsedAction[] } {
  const match = content.match(/```actions\s*([\s\S]*?)```/);
  if (!match) return { text: content, actions: [] };
  const text = content.slice(0, content.indexOf("```actions")).trimEnd();
  let actions: ParsedAction[] = [];
  try { actions = JSON.parse(match[1].trim()); } catch {}
  return { text, actions };
}

function genId() { return Math.random().toString(36).slice(2, 10); }

// ── Atlas X Panel ─────────────────────────────────────────────────────────────

export default function AtlasXPanel() {
  const [open, setOpen] = useState(false);

  const [messages,         setMessages]         = useState<ChatMessage[]>([]);
  const [input,            setInput]            = useState("");
  const [streaming,        setStreaming]         = useState(false);
  const [error,            setError]            = useState("");
  const [proposals,        setProposals]        = useState<{ id: string; data: ProposalData }[]>([]);
  const [activeProposalId, setActiveProposalId] = useState<string>("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const abortRef  = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    api.proposals.list()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.proposals ?? [];
        setProposals(list.slice(0, 10));
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    setError("");

    const userMsg: ChatMessage = { id: genId(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const history = [...messages, userMsg]
      .slice(-20)
      .map(({ role, content }) => ({ role, content: parseActions(content).text }));

    const assistantId = genId();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);
    setStreaming(true);

    const supabase = createClient();
    let token = "";
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token ?? "";
    }

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch("/api/brain", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body:   JSON.stringify({ messages: history, ...(activeProposalId ? { activeProposalId } : {}) }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Error ${res.status}`);
      }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";
      let   full    = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const { text } = JSON.parse(data);
            full += text;
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, content: full } : m)
            );
          } catch {}
        }
      }

      const { text, actions } = parseActions(full);
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: text, actions } : m)
      );
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message ?? "Something went wrong.");
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  }

  function startNew() {
    if (streaming) abortRef.current?.abort();
    setMessages([]);
    setError("");
    setInput("");
    inputRef.current?.focus();
  }

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* Toggle button — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={open ? "Close Atlas X" : "Open Atlas X"}
        style={{
          position: "fixed",
          bottom: 24,
          right: open ? 372 : 20,
          zIndex: 50,
          width: 60,
          height: 60,
          borderRadius: 16,
          border: "1px solid rgba(99,102,241,0.4)",
          background: open
            ? "rgba(99,102,241,0.18)"
            : "linear-gradient(135deg, #1e1b4b, #2e1065)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          cursor: "pointer",
          boxShadow: open ? "none" : "0 6px 24px rgba(99,102,241,0.35)",
          transition: "right 0.3s ease, background 0.15s, box-shadow 0.15s",
        }}
      >
        {open ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(165,180,252,0.8)" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <>
            <AtlasXLogo size={28} />
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(165,180,252,0.7)", lineHeight: 1 }}>ATLAS X</span>
          </>
        )}
      </button>

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 360,
          zIndex: 40,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid var(--border)",
          background: "var(--bg-surface)",
        }}
      >
        {/* Panel header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          background: "var(--bg-card)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 7, overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><AtlasXLogo size={24} /></div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>Atlas X</span>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "2px 5px", borderRadius: 4,
              background: "rgba(99,102,241,0.15)", color: "#a5b4fc",
              border: "1px solid rgba(99,102,241,0.2)",
            }}>Beta</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {proposals.length > 0 && (
              <select
                value={activeProposalId}
                onChange={(e) => setActiveProposalId(e.target.value)}
                style={{
                  padding: "4px 8px", borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--bg-surface)", color: "var(--text-2)",
                  fontSize: 11, maxWidth: 130,
                }}
              >
                <option value="">No context</option>
                {proposals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {(p.data?.title ?? "Untitled").slice(0, 20)}{(p.data?.title ?? "").length > 20 ? "…" : ""}
                  </option>
                ))}
              </select>
            )}
            {!isEmpty && (
              <button
                onClick={startNew}
                style={{
                  padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500,
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--text-3)", cursor: "pointer",
                }}
              >
                New
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 0 }}>
          {isEmpty ? (
            <PanelEmptyState onStarter={(s) => send(s)} />
          ) : (
            messages.map((msg) => <PanelMessage key={msg.id} message={msg} streaming={streaming} />)
          )}
          {error && (
            <div style={{
              margin: "8px 0", padding: "8px 12px", borderRadius: 8,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#fca5a5", fontSize: 12,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>{error}</span>
              <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "rgba(252,165,165,0.5)", cursor: "pointer", fontSize: 10 }}>✕</button>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ flexShrink: 0, padding: "10px 14px 14px", borderTop: "1px solid var(--border)" }}>
          <div
            style={{
              display: "flex", gap: 8, alignItems: "flex-end",
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "8px 10px", transition: "border-color 0.15s",
            }}
            onFocusCapture={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.45)")}
            onBlurCapture={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask Atlas X…"
              disabled={streaming}
              rows={1}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                resize: "none", fontSize: 13, color: "var(--text-1)",
                lineHeight: 1.55, fontFamily: "inherit", maxHeight: 140, overflow: "auto",
              }}
            />
            <button
              onClick={() => streaming ? abortRef.current?.abort() : send(input)}
              disabled={!streaming && !input.trim()}
              style={{
                width: 32, height: 32, borderRadius: 8, border: "none", flexShrink: 0,
                background: streaming
                  ? "rgba(239,68,68,0.12)"
                  : input.trim() ? "var(--accent)" : "var(--bg-surface)",
                color: streaming ? "#f87171" : input.trim() ? "#fff" : "var(--text-3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: (!streaming && !input.trim()) ? "not-allowed" : "pointer",
                transition: "all 0.15s",
              }}
            >
              {streaming ? <StopIcon /> : <SendIcon />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Panel Empty State ─────────────────────────────────────────────────────────

const STARTERS = [
  { icon: "🎯", text: "Plan a corporate gala for 200 guests" },
  { icon: "💍", text: "Luxury wedding budget in Mumbai?" },
  { icon: "⚡", text: "3 weeks to plan a college fest for 800" },
  { icon: "📋", text: "Review my current proposal" },
];

function PanelEmptyState({ onStarter }: { onStarter: (text: string) => void }) {
  return (
    <div style={{ paddingTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14, overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}><AtlasXLogo size={48} /></div>

      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>
          Your Event Planning Expert
        </p>
        <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>
          Ask about budgets, vendor strategy, client pitches — anything event-related.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
        {STARTERS.map((s) => (
          <button
            key={s.text}
            onClick={() => onStarter(s.text)}
            style={{
              padding: "9px 12px", borderRadius: 9,
              border: "1px solid var(--border)", background: "var(--bg-card)",
              textAlign: "left", cursor: "pointer", transition: "all 0.12s",
              display: "flex", alignItems: "center", gap: 8,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.35)";
              (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.04)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLElement).style.background = "var(--bg-card)";
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>{s.icon}</span>
            <span style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.4 }}>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Panel Message ─────────────────────────────────────────────────────────────

function PanelMessage({ message, streaming }: { message: ChatMessage; streaming: boolean }) {
  const isUser   = message.role === "user";
  const isStream = streaming && !isUser && message.content === "";

  return (
    <div style={{ padding: "5px 0", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
      <div className="flex items-center gap-1.5" style={{ marginBottom: 3, flexDirection: isUser ? "row-reverse" : "row" }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 700,
          ...(isUser
            ? { background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }
            : { background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))", border: "1px solid rgba(99,102,241,0.3)" }
          ),
        }}>
          {isUser ? "Y" : <AtlasXLogo size={14} />}
        </div>
        <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 600 }}>
          {isUser ? "You" : "Atlas X"}
        </span>
      </div>

      <div style={{
        maxWidth: "90%", padding: "9px 12px", fontSize: 12, lineHeight: 1.6,
        borderRadius: isUser ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
        ...(isUser
          ? { background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", color: "var(--text-1)" }
          : { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-1)" }
        ),
      }}>
        {isStream ? <StreamingDots /> : <FormattedContent content={message.content} />}
      </div>

      {!isUser && message.actions && message.actions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, maxWidth: "90%" }}>
          {message.actions.map((action, i) => (
            <a
              key={i}
              href={action.href}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 10px", borderRadius: 8,
                border: "1px solid rgba(99,102,241,0.25)",
                background: "rgba(99,102,241,0.06)",
                color: "#a5b4fc", fontSize: 12, fontWeight: 600,
                textDecoration: "none", transition: "all 0.12s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.12)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.06)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.25)";
              }}
            >
              {action.label} <span style={{ opacity: 0.6, fontSize: 11 }}>↗</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Formatted content ─────────────────────────────────────────────────────────

function FormattedContent({ content }: { content: string }) {
  if (!content) return null;
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    const k = key++;
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      elements.push(<p key={k} style={{ fontWeight: 700, color: "var(--text-1)", marginBottom: 3 }}>{line.slice(2, -2)}</p>);
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      elements.push(
        <div key={k} className="flex items-start gap-1.5" style={{ marginBottom: 2 }}>
          <span style={{ color: "#a5b4fc", marginTop: 2, flexShrink: 0, fontSize: 10 }}>▸</span>
          <span style={{ color: "var(--text-2)" }}>{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (line === "") {
      elements.push(<div key={k} style={{ height: 5 }} />);
    } else {
      elements.push(<p key={k} style={{ marginBottom: 2, color: "var(--text-1)" }}>{renderInline(line)}</p>);
    }
  }
  return <div>{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: "var(--text-1)", fontWeight: 600 }}>{part}</strong>
      : part
  );
}

// ── Streaming dots ────────────────────────────────────────────────────────────

function StreamingDots() {
  return (
    <div className="flex items-center gap-1" style={{ padding: "3px 0" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse" style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "rgba(99,102,241,0.4)",
          animationDelay: `${i * 0.15}s`, animationDuration: "1s",
        }} />
      ))}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SendIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

function AtlasXLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="url(#axgrad)" />
      <path d="M8 24L13.5 8H18.5L24 24H19.8L18.6 20H13.4L12.2 24H8ZM14.4 17H17.6L16 11.8L14.4 17Z" fill="white" fillOpacity="0.95"/>
      <path d="M19 13L22 8H26L22 13.5L26 20H22L19 15.5" fill="url(#axaccent)" opacity="0.9"/>
      <defs>
        <linearGradient id="axgrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4338ca"/>
          <stop offset="1" stopColor="#7c3aed"/>
        </linearGradient>
        <linearGradient id="axaccent" x1="19" y1="8" x2="26" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a5b4fc"/>
          <stop offset="1" stopColor="#c4b5fd"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
