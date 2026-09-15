import Link from "next/link";

const FEATURES = [
  {
    title: "Trained on your content",
    body: "Upload docs and paste URLs. Nova Reach chunks, embeds, and grounds every answer in your own knowledge base — no hallucinated pricing or policies.",
  },
  {
    title: "Answers everywhere visitors search",
    body: "Drop one embed snippet on your site and the same agent answers questions in a chat widget, ready to be the source AI answer engines cite.",
  },
  {
    title: "Full conversation history",
    body: "Every visitor and teammate conversation is saved, searchable, and reviewable — so you always know what's being asked and answered.",
  },
  {
    title: "Usage-based plans",
    body: "Start free, upgrade to Pro in one click with Stripe. Limits are enforced automatically so you never get an unexpected bill.",
  },
];

export default function Home() {
  return (
    <main>
      <nav className="container row" style={{ justifyContent: "space-between", padding: "24px 24px" }}>
        <div className="row" style={{ fontWeight: 700, fontSize: 18 }}>
          <span style={{ color: "var(--accent)" }}>●</span> Nova Reach
        </div>
        <div className="row">
          <Link href="/pricing" className="btn btn-secondary">
            Pricing
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Log in
          </Link>
          <Link href="/register" className="btn btn-primary">
            Get started
          </Link>
        </div>
      </nav>

      <section className="container" style={{ padding: "72px 24px 40px", textAlign: "center" }}>
        <span className="pill">Autonomous chat agent for search & AI visibility</span>
        <h1 style={{ fontSize: 52, lineHeight: 1.1, margin: "24px 0", maxWidth: 780, marginInline: "auto" }}>
          Turn your knowledge base into a chat agent that answers visitors on Google and AI search — around the clock.
        </h1>
        <p style={{ color: "var(--text-dim)", fontSize: 18, maxWidth: 620, marginInline: "auto" }}>
          Upload your docs, embed a widget on your site, and let Nova Reach handle the questions — while you keep
          full visibility into every conversation.
        </p>
        <div className="row" style={{ justifyContent: "center", marginTop: 32 }}>
          <Link href="/register" className="btn btn-primary" style={{ padding: "14px 28px", fontSize: 16 }}>
            Start free
          </Link>
          <Link href="/pricing" className="btn btn-secondary" style={{ padding: "14px 28px", fontSize: 16 }}>
            See pricing
          </Link>
        </div>
      </section>

      <section className="container" style={{ padding: "40px 24px 96px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {FEATURES.map((f) => (
            <div className="card" key={f.title}>
              <h3 style={{ marginTop: 0 }}>{f.title}</h3>
              <p style={{ color: "var(--text-dim)", fontSize: 14.5, lineHeight: 1.6 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="container" style={{ padding: "24px 24px 48px", color: "var(--text-dim)", fontSize: 13 }}>
        © {new Date().getFullYear()} Nova Reach.
      </footer>
    </main>
  );
}
