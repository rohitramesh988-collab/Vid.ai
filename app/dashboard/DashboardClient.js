"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function DashboardClient() {
  const { data: session } = useSession();
  const [sources, setSources] = useState([]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [widgetKey, setWidgetKey] = useState("");

  useEffect(() => {
    load();
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setWidgetKey(d.widgetKey || ""));
  }, []);

  async function load() {
    const res = await fetch("/api/kb");
    const data = await res.json();
    setSources(data.sources || []);
  }

  async function uploadFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/kb/upload", { method: "POST", body: fd });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) setMessage(data.error);
    else {
      setMessage(`Added "${data.source.name}" (${data.source.chunkCount} chunks).`);
      load();
    }
    e.target.value = "";
  }

  async function addUrl(e) {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/kb/url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) setMessage(data.error);
    else {
      setMessage(`Added "${data.source.name}" (${data.source.chunkCount} chunks).`);
      setUrl("");
      load();
    }
  }

  async function removeSource(id) {
    await fetch(`/api/kb/${id}`, { method: "DELETE" });
    load();
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const snippet = `<script src="${baseUrl}/widget.js" data-key="${widgetKey}" data-base="${baseUrl}" async></script>`;

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>Dashboard</h1>
        <div className="row">
          <span className="pill">{session?.user?.plan || "FREE"} plan</span>
          <Link href="/chat" className="btn btn-secondary">
            Back to chat
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>Knowledge base</h2>
        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
          Upload text/markdown docs or paste a URL. Content is chunked and embedded so the chat agent can answer
          from it.
        </p>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
            Upload file
            <input type="file" accept=".txt,.md,.csv,.json" onChange={uploadFile} style={{ display: "none" }} disabled={busy} />
          </label>
          <form onSubmit={addUrl} className="row" style={{ flex: 1, minWidth: 260 }}>
            <input placeholder="https://example.com/pricing" value={url} onChange={(e) => setUrl(e.target.value)} />
            <button className="btn btn-primary" disabled={busy}>
              Add URL
            </button>
          </form>
        </div>
        {message && <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 8 }}>{message}</p>}

        <div className="stack" style={{ marginTop: 16 }}>
          {sources.map((s) => (
            <div key={s.id} className="row" style={{ justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  {s.type} · {s.chunkCount} chunks
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => removeSource(s.id)}>
                Remove
              </button>
            </div>
          ))}
          {sources.length === 0 && <p style={{ color: "var(--text-dim)", fontSize: 13 }}>No sources yet.</p>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>Embeddable widget</h2>
        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
          Paste this snippet before <code>&lt;/body&gt;</code> on any site to add a floating chat bubble backed by
          your knowledge base.
        </p>
        <textarea readOnly rows={2} value={snippet} onClick={(e) => e.target.select()} />
        <p style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 8 }}>
          Or share the standalone chat page directly:{" "}
          <Link href={`/widget/${widgetKey}`} target="_blank">
            {baseUrl}/widget/{widgetKey}
          </Link>
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Billing</h2>
        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
          You're on the <strong>{session?.user?.plan || "FREE"}</strong> plan.
        </p>
        <Link href="/pricing" className="btn btn-primary">
          Manage plan
        </Link>
      </div>
    </div>
  );
}
