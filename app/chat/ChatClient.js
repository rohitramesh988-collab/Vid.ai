"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function ChatClient() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    loadConversations();
    loadPrompts();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadConversations() {
    const res = await fetch("/api/conversations");
    const data = await res.json();
    setConversations(data.conversations || []);
  }

  async function loadPrompts() {
    const res = await fetch("/api/prompts");
    const data = await res.json();
    setPrompts(data.prompts || []);
  }

  async function openConversation(id) {
    setActiveId(id);
    const res = await fetch(`/api/conversations/${id}`);
    const data = await res.json();
    setMessages(data.conversation?.messages || []);
  }

  function newConversation() {
    setActiveId(null);
    setMessages([]);
    setError("");
  }

  async function deleteConversation(id, e) {
    e.stopPropagation();
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (activeId === id) newConversation();
    loadConversations();
  }

  async function saveCurrentAsPrompt() {
    if (!input.trim()) return;
    const title = window.prompt("Name this saved prompt:", input.slice(0, 30));
    if (!title) return;
    await fetch("/api/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content: input }),
    });
    loadPrompts();
  }

  async function deletePrompt(id, e) {
    e.stopPropagation();
    await fetch(`/api/prompts/${id}`, { method: "DELETE" });
    loadPrompts();
  }

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setError("");
    setInput("");
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setSending(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeId, message: text }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong.");
      setMessages(nextMessages);
      setSending(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let assistantText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop();
      for (const raw of events) {
        const lines = raw.split("\n");
        const eventLine = lines.find((l) => l.startsWith("event:"));
        const dataLine = lines.find((l) => l.startsWith("data:"));
        if (!eventLine || !dataLine) continue;
        const eventType = eventLine.replace("event:", "").trim();
        const data = JSON.parse(dataLine.replace("data:", "").trim());
        if (eventType === "meta") {
          setActiveId(data.conversationId);
        } else if (eventType === "token") {
          assistantText += data.delta;
          setMessages((cur) => {
            const copy = [...cur];
            copy[copy.length - 1] = { role: "assistant", content: assistantText };
            return copy;
          });
        }
      }
    }

    setSending(false);
    loadConversations();
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <aside
        style={{
          width: 280,
          borderRight: "1px solid var(--border)",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          overflowY: "auto",
        }}
      >
        <div className="row" style={{ justifyContent: "space-between" }}>
          <Link href="/" style={{ fontWeight: 700 }}>
            Nova Reach
          </Link>
        </div>
        <button className="btn btn-primary" onClick={newConversation}>
          + New chat
        </button>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>CONVERSATIONS</div>
          <div className="stack" style={{ gap: 4 }}>
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => openConversation(c.id)}
                className="row"
                style={{
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: activeId === c.id ? "var(--surface)" : "transparent",
                  fontSize: 13,
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                <span onClick={(e) => deleteConversation(c.id, e)} style={{ color: "var(--text-dim)" }}>
                  ✕
                </span>
              </div>
            ))}
            {conversations.length === 0 && <p style={{ fontSize: 12, color: "var(--text-dim)" }}>No conversations yet.</p>}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>SAVED PROMPTS</div>
          <div className="stack" style={{ gap: 4 }}>
            {prompts.map((p) => (
              <div
                key={p.id}
                onClick={() => setInput(p.content)}
                className="row"
                style={{ justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                <span onClick={(e) => deletePrompt(p.id, e)} style={{ color: "var(--text-dim)" }}>
                  ✕
                </span>
              </div>
            ))}
            {prompts.length === 0 && <p style={{ fontSize: 12, color: "var(--text-dim)" }}>None saved yet.</p>}
          </div>
        </div>
        <div style={{ marginTop: "auto" }} className="stack">
          <Link href="/dashboard" className="btn btn-secondary">
            Knowledge base & widget
          </Link>
          {session?.user?.role === "ADMIN" && (
            <Link href="/admin" className="btn btn-secondary">
              Admin
            </Link>
          )}
          <button className="btn btn-secondary" onClick={() => signOut({ callbackUrl: "/" })}>
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }} className="stack">
            {messages.length === 0 && (
              <div style={{ color: "var(--text-dim)", textAlign: "center", marginTop: 80 }}>
                Ask a question — answers are grounded in your knowledge base once you add sources.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                }}
              >
                <div
                  style={{
                    background: m.role === "user" ? "var(--accent)" : "var(--surface)",
                    border: m.role === "user" ? "none" : "1px solid var(--border)",
                    color: m.role === "user" ? "white" : "var(--text)",
                    padding: "10px 14px",
                    borderRadius: 12,
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                  }}
                >
                  {m.content || (sending && i === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
        {error && (
          <div style={{ color: "#ff6b6b", padding: "0 24px 8px", maxWidth: 720, margin: "0 auto", width: "100%" }}>{error}</div>
        )}
        <form onSubmit={send} style={{ padding: 20, borderTop: "1px solid var(--border)" }}>
          <div className="row" style={{ maxWidth: 720, margin: "0 auto" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message your agent…"
              disabled={sending}
            />
            <button type="button" className="btn btn-secondary" onClick={saveCurrentAsPrompt} title="Save as prompt">
              ⭐
            </button>
            <button className="btn btn-primary" disabled={sending}>
              Send
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
