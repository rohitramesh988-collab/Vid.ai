"use client";

import { useState, useRef, useEffect } from "react";

export default function WidgetPage({ params }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! Ask me anything about this site." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch(`/api/widget/${params.key}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: next.slice(-10) }),
      });
      const data = await res.json();
      setMessages((cur) => [...cur, { role: "assistant", content: data.reply || data.error || "Something went wrong." }]);
    } catch {
      setMessages((cur) => [...cur, { role: "assistant", content: "Network error. Please try again." }]);
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
        background: "#0b0d12",
        color: "#eef1f6",
      }}
    >
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #262b36", fontWeight: 600 }}>
        Chat with us
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#6d5efc" : "#171b24",
              border: m.role === "user" ? "none" : "1px solid #262b36",
              color: m.role === "user" ? "white" : "#eef1f6",
              padding: "8px 12px",
              borderRadius: 12,
              maxWidth: "80%",
              fontSize: 14,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {m.content}
          </div>
        ))}
        {loading && <div style={{ fontSize: 13, color: "#a3aab8" }}>Thinking…</div>}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #262b36" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #262b36",
            background: "#12151c",
            color: "#eef1f6",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: "#6d5efc",
            color: "white",
            fontWeight: 600,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
