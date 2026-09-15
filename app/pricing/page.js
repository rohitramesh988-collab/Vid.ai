"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

const TIERS = [
  {
    key: "FREE",
    name: "Free",
    price: "$0",
    blurb: "Try the agent on your own content.",
    features: ["30 messages / day", "Up to 3 knowledge sources", "1 embeddable widget", "Conversation history"],
  },
  {
    key: "PRO",
    name: "Pro",
    price: "$49/mo",
    blurb: "For teams shipping this to real visitors.",
    features: [
      "1,000 messages / day",
      "Up to 100 knowledge sources",
      "Unlimited widgets on your domain",
      "Admin conversation dashboard",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  async function upgrade() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (data.url) window.location.href = data.url;
    else alert(data.error || "Unable to start checkout.");
  }

  return (
    <main className="container" style={{ paddingTop: 64, paddingBottom: 96 }}>
      <h1 style={{ textAlign: "center" }}>Simple pricing</h1>
      <p style={{ textAlign: "center", color: "var(--text-dim)" }}>
        Start free. Upgrade when your agent starts doing real work. Stripe test mode — no real charges.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          marginTop: 40,
          maxWidth: 720,
          marginInline: "auto",
        }}
      >
        {TIERS.map((tier) => (
          <div className="card stack" key={tier.key}>
            <h2 style={{ margin: 0 }}>{tier.name}</h2>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{tier.price}</div>
            <p style={{ color: "var(--text-dim)", margin: 0 }}>{tier.blurb}</p>
            <ul style={{ color: "var(--text-dim)", fontSize: 14, paddingLeft: 18 }}>
              {tier.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {tier.key === "FREE" ? (
              <Link href={session ? "/chat" : "/register"} className="btn btn-secondary">
                {session ? "Current plan" : "Start free"}
              </Link>
            ) : session ? (
              <button className="btn btn-primary" onClick={upgrade} disabled={loading}>
                {loading ? "Redirecting…" : "Upgrade to Pro"}
              </button>
            ) : (
              <Link href="/register" className="btn btn-primary">
                Sign up to upgrade
              </Link>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
