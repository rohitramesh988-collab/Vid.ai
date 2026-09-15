"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminClient() {
  const [data, setData] = useState({ conversations: [], users: [] });
  const [systemPrompt, setSystemPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/conversations")
      .then((r) => r.json())
      .then(setData);
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setSystemPrompt(d.systemPrompt || ""));
  }, []);

  async function saveSystemPrompt() {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>Admin</h1>
        <Link href="/chat" className="btn btn-secondary">
          Back to chat
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>Global system prompt</h2>
        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
          Applies to every user's chat and every embedded widget.
        </p>
        <textarea rows={6} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={saveSystemPrompt} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          {saved && <span style={{ color: "var(--success)", fontSize: 13 }}>Saved.</span>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>Users ({data.users.length})</h2>
        <div className="stack">
          {data.users.map((u) => (
            <div key={u.id} className="row" style={{ justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              <div>
                <div>{u.email}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  {u.role} · {u.plan} · {u._count.conversations} conversations · {u._count.sources} sources
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Recent conversations ({data.conversations.length})</h2>
        <div className="stack">
          {data.conversations.map((c) => (
            <div key={c.id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong style={{ fontSize: 14 }}>{c.title}</strong>
                <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  {c.userEmail} · {c.userPlan} · {c.messageCount} msgs
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-dim)", margin: "4px 0 0" }}>{c.lastMessage}</p>
            </div>
          ))}
          {data.conversations.length === 0 && <p style={{ color: "var(--text-dim)" }}>No conversations yet.</p>}
        </div>
      </div>
    </div>
  );
}
