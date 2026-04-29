"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import type { ProposalData } from "@/lib/proposals";

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = "user" | "assistant";

type ChatMessage = {
  id:      string;
  role:    Role;
  content: string;        // full text (may include ```actions block)
  actions?: ParsedAction[];
};

type ParsedAction = {
  label:       string;
  href:        string;
  description: string;
  icon:        "spark" | "deck" | "vendor" | "event" | "compliance" | "budget" | "default";
};

// ── Starters ──────────────────────────────────────────────────────────────────

const STARTERS = [
  { icon: "🎯", text: "Plan a corporate gala for 200 guests" },
  { icon: "💍", text: "What's a realistic luxury wedding budget in Mumbai?" },
  { icon: "🎪", text: "How do I pitch a ₹50L brand activation to a client?" },
  { icon: "⚡", text: "I have 3 weeks to plan a college fest for 800 people — help" },
  { icon: "🎤", text: "What's the smartest venue setup for a product launch?" },
  { icon: "📋", text: "Review my current proposal and tell me what's missing" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseActions(content: string): { text: string; actions: ParsedAction[] } {
  const match = content.match(/```actions\s*([\s\S]*?)```/);
  if (!match) return { text: content, actions: [] };

  const text = content.slice(0, content.indexOf("```actions")).trimEnd();
  let actions: ParsedAction[] = [];
  try {
    actions = JSON.parse(match[1].trim());
  } catch {
    // malformed JSON — just strip the block
  }
  return { text, actions };
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BrainPage() {
  const router = useRouter();

  const [messages,         setMessages]         = useState<ChatMessage[]>([]);
  const [input,            setInput]            = useState("");
  const [streaming,        setStreaming]         = useState(false);
  const [error,            setError]            = useState("");
  const [proposals,        setProposals]        = useState<{ id: string; data: ProposalData }[]>([]);
  const [activeProposalId, setActiveProposalId] = useState<string>("");

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const abortRef   = useRef<AbortController | null>(null);

  // Load proposals for context selector
  useEffect(() => {
    api.proposals.list()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.proposals ?? [];
        setProposals(list.slice(0, 10));
      })
      .catch(() => {});
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    setError("");

    const userMsg: ChatMessage = { id: genId(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Resize textarea
    if (inputRef.current) inputRef.current.style.height = "auto";

    // Build history to send (last 20 turns)
    const history = [...messages, userMsg]
      .slice(-20)
      .map(({ role, content }) => ({ role, content: parseActions(content).text }));

    // Optimistic assistant message
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
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: history,
          ...(activeProposalId ? { activeProposalId } : {}),
        }),
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

      // After stream ends, parse actions
      const { text, actions } = parseActions(full);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: text, actions } : m
        )
      );
    } catch (err: any) {
      if (err.name === "AbortError") {
        // User cancelled — leave the partial message as-is
      } else {
        setError(err.message ?? "Something went wrong. Please try again.");
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px)", // full height minus topbar
        maxWidth: 800,
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 0 12px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: 3 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))",
                border: "1px solid rgba(99,102,241,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
              }}
            >
              🧠
            </div>
            <h2 className="t-heading" style={{ fontSize: 18, margin: 0 }}>AI Brain</h2>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "2px 6px",
                borderRadius: 4,
                background: "rgba(99,102,241,0.15)",
                color: "#a5b4fc",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              Beta
            </span>
          </div>
          <p className="t-caption" style={{ margin: 0 }}>
            Master Event Planner · 15+ years experience
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Proposal context selector */}
          {proposals.length > 0 && (
            <select
              value={activeProposalId}
              onChange={(e) => setActiveProposalId(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-2)",
                fontSize: 12,
                maxWidth: 200,
              }}
            >
              <option value="">No proposal context</option>
              {proposals.map((p) => (
                <option key={p.id} value={p.id}>
                  {(p.data?.title ?? "Untitled").slice(0, 30)}{(p.data?.title ?? "").length > 30 ? "…" : ""}
                </option>
              ))}
            </select>
          )}
          {!isEmpty && (
            <button onClick={startNew} className="btn-ghost" style={{ fontSize: 12 }}>
              New chat
            </button>
          )}
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 0",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {isEmpty ? (
          <EmptyState onStarter={(s) => send(s)} />
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} streaming={streaming} />
          ))
        )}
        {error && (
          <div
            style={{
              margin: "8px 0",
              padding: "10px 14px",
              borderRadius: 9,
              background: "var(--red-dim)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#fca5a5",
              fontSize: 13,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              style={{ background: "none", border: "none", color: "rgba(252,165,165,0.5)", cursor: "pointer", fontSize: 11 }}
            >
              ✕
            </button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          paddingTop: 12,
          paddingBottom: 16,
          borderTop: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-end",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "10px 12px",
            transition: "border-color 0.15s",
          }}
          onFocusCapture={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.45)")}
          onBlurCapture={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your event…"
            disabled={streaming}
            rows={1}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: 14,
              color: "var(--text-1)",
              lineHeight: 1.55,
              fontFamily: "inherit",
              maxHeight: 180,
              overflow: "auto",
            }}
          />
          <button
            onClick={() => streaming ? abortRef.current?.abort() : send(input)}
            disabled={!streaming && !input.trim()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              border: "none",
              background: streaming
                ? "rgba(239,68,68,0.12)"
                : input.trim()
                ? "var(--accent)"
                : "var(--bg-surface)",
              color: streaming ? "#f87171" : input.trim() ? "#fff" : "var(--text-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: (!streaming && !input.trim()) ? "not-allowed" : "pointer",
              flexShrink: 0,
              transition: "all 0.15s",
            }}
          >
            {streaming ? <StopIcon /> : <SendIcon />}
          </button>
        </div>
        <p className="t-caption text-center" style={{ marginTop: 8 }}>
          Shift+Enter for new line · AI can make mistakes — verify critical decisions
        </p>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onStarter }: { onStarter: (text: string) => void }) {
  return (
    <div
      className="flex flex-col items-center"
      style={{ paddingTop: 40, gap: 28 }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
          border: "1px solid rgba(99,102,241,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
        }}
      >
        🧠
      </div>

      <div className="text-center" style={{ maxWidth: 480 }}>
        <h3 className="t-heading" style={{ fontSize: 22, marginBottom: 8 }}>
          Your Event Planning Expert
        </h3>
        <p className="t-body">
          Ask about budgets, concepts, vendor strategy, client pitches — anything event-related.
          I'll give you real, actionable advice, not generic tips.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 10,
          width: "100%",
          maxWidth: 680,
        }}
      >
        {STARTERS.map((s) => (
          <button
            key={s.text}
            onClick={() => onStarter(s.text)}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.12s",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
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
            <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
            <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message, streaming }: { message: ChatMessage; streaming: boolean }) {
  const isUser   = message.role === "user";
  const isStream = streaming && !isUser && message.content === "";

  return (
    <div
      style={{
        padding: "6px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
      }}
    >
      {/* Avatar row */}
      <div
        className="flex items-center gap-2"
        style={{ marginBottom: 4, flexDirection: isUser ? "row-reverse" : "row" }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            ...(isUser
              ? { background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }
              : { background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))", border: "1px solid rgba(99,102,241,0.3)" }
            ),
          }}
        >
          {isUser ? "Y" : "🧠"}
        </div>
        <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600 }}>
          {isUser ? "You" : "AI Brain"}
        </span>
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: "85%",
          padding: "11px 15px",
          borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          fontSize: 14,
          lineHeight: 1.65,
          ...(isUser
            ? {
                background: "rgba(99,102,241,0.12)",
                border:     "1px solid rgba(99,102,241,0.2)",
                color:      "var(--text-1)",
              }
            : {
                background: "var(--bg-card)",
                border:     "1px solid var(--border)",
                color:      "var(--text-1)",
              }
          ),
        }}
      >
        {isStream ? (
          <StreamingDots />
        ) : (
          <FormattedContent content={message.content} />
        )}
      </div>

      {/* Action cards */}
      {!isUser && message.actions && message.actions.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 10,
            maxWidth: "85%",
          }}
        >
          {message.actions.map((action, i) => (
            <ActionCard key={i} action={action} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Formatted content (markdown-lite) ─────────────────────────────────────────

function FormattedContent({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    const k = key++;
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      elements.push(
        <p key={k} style={{ fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>
          {line.slice(2, -2)}
        </p>
      );
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      elements.push(
        <div key={k} className="flex items-start gap-2" style={{ marginBottom: 3 }}>
          <span style={{ color: "#a5b4fc", marginTop: 2, flexShrink: 0 }}>▸</span>
          <span style={{ color: "var(--text-2)" }}>{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (line === "") {
      elements.push(<div key={k} style={{ height: 6 }} />);
    } else {
      elements.push(
        <p key={k} style={{ marginBottom: 2, color: "var(--text-1)" }}>
          {renderInline(line)}
        </p>
      );
    }
  }

  return <div>{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: "var(--text-1)", fontWeight: 600 }}>{part}</strong>
      : part
  );
}

// ── Action Card ───────────────────────────────────────────────────────────────

function ActionCard({ action }: { action: ParsedAction }) {
  const iconMap: Record<string, string> = {
    spark:      "✦",
    deck:       "🎯",
    vendor:     "🏪",
    event:      "📅",
    compliance: "⚖",
    budget:     "₹",
    default:    "→",
  };
  const icon = iconMap[action.icon] ?? iconMap.default;

  return (
    <a
      href={action.href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 10,
        border: "1px solid rgba(99,102,241,0.25)",
        background: "rgba(99,102,241,0.06)",
        color: "#a5b4fc",
        fontSize: 13,
        fontWeight: 600,
        textDecoration: "none",
        cursor: "pointer",
        transition: "all 0.12s",
        flexShrink: 0,
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
      <span>{icon}</span>
      <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span>{action.label}</span>
        {action.description && (
          <span style={{ fontSize: 11, color: "rgba(165,180,252,0.7)", fontWeight: 400 }}>
            {action.description}
          </span>
        )}
      </span>
      <span style={{ opacity: 0.6, fontSize: 12 }}>↗</span>
    </a>
  );
}

// ── Streaming dots ────────────────────────────────────────────────────────────

function StreamingDots() {
  return (
    <div className="flex items-center gap-1.5" style={{ padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "rgba(99,102,241,0.4)",
            animationDelay: `${i * 0.15}s`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}
