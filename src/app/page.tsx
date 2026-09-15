import Link from "next/link";
import { Nav } from "@/components/Nav";

const steps = [
  {
    title: "Drop in an idea",
    body: "Type a one-line idea or paste a rough script. No outline, no storyboard needed.",
  },
  {
    title: "AI writes the scenes",
    body: "Claude breaks it into a hook, a scene-by-scene voiceover script, and on-screen captions built for retention.",
  },
  {
    title: "Get a ready-to-post video",
    body: "Voiceover, background visuals, and burned-in captions are assembled automatically into a 9:16 short.",
  },
];

const features = [
  {
    title: "Scene-by-scene AI scriptwriting",
    body: "Every idea becomes a structured script: hook, body, payoff — tuned for short-form retention, not a wall of text.",
  },
  {
    title: "Automatic voiceover",
    body: "AI narration is generated per scene and timed automatically, so captions and visuals always stay in sync.",
  },
  {
    title: "One-click assembly",
    body: "No editing timeline required. Hit render and get a finished, downloadable vertical video.",
  },
  {
    title: "A real history, not a graveyard of exports",
    body: "Every idea, script, and render is saved to your dashboard — searchable and filterable by status.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <Nav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, rgba(139,92,246,0.25) 0%, rgba(0,0,0,0) 70%)",
            }}
          />
          <div className="mx-auto max-w-4xl px-6 pt-24 pb-20 text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
              Idea in → ready-to-post video out
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              Turn any idea into a{" "}
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                video that gets views
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-400">
              Type an idea or paste a script. AI generates the voiceover, visuals, and captions,
              and edits it into a ready-to-post short — no editing skills, no timeline, minutes not hours.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-white px-6 py-3 font-medium text-neutral-950 transition hover:bg-neutral-200"
              >
                Start creating — it&apos;s free
              </Link>
              <Link
                href="#how"
                className="rounded-full border border-white/15 px-6 py-3 font-medium text-neutral-200 transition hover:border-white/30"
              >
                See how it works
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            From idea to finished video, in one loop
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-sm font-semibold">
                  {i + 1}
                </div>
                <h3 className="text-lg font-medium">{step.title}</h3>
                <p className="mt-2 text-sm text-neutral-400">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-white/10 bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-center text-3xl font-semibold tracking-tight">Built for the one loop that matters</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {features.map((f) => (
                <div key={f.title} className="rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-medium">{f.title}</h3>
                  <p className="mt-2 text-sm text-neutral-400">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Simple pricing</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-neutral-400">
            Start free. Upgrade when you&apos;re ready to publish more than a few videos a month.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 p-8">
              <h3 className="text-lg font-medium">Free</h3>
              <p className="mt-2 text-4xl font-semibold">$0</p>
              <p className="mt-1 text-sm text-neutral-400">3 rendered videos / month</p>
              <ul className="mt-6 space-y-2 text-sm text-neutral-300">
                <li>• Unlimited scripts &amp; scene drafts</li>
                <li>• AI voiceover &amp; captions</li>
                <li>• Vertical (9:16), square, and landscape exports</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-full border border-white/15 py-3 text-center font-medium transition hover:border-white/30"
              >
                Get started
              </Link>
            </div>
            <div className="relative rounded-2xl border border-violet-400/40 bg-gradient-to-b from-violet-500/10 to-transparent p-8">
              <span className="absolute -top-3 right-8 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-3 py-1 text-xs font-medium">
                Most popular
              </span>
              <h3 className="text-lg font-medium">Pro</h3>
              <p className="mt-2 text-4xl font-semibold">
                $19<span className="text-base font-normal text-neutral-400">/mo</span>
              </p>
              <p className="mt-1 text-sm text-neutral-400">Unlimited rendered videos</p>
              <ul className="mt-6 space-y-2 text-sm text-neutral-300">
                <li>• Everything in Free</li>
                <li>• Unlimited monthly renders</li>
                <li>• Priority rendering</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-full bg-white py-3 text-center font-medium text-neutral-950 transition hover:bg-neutral-200"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-neutral-500">
            Billed via Stripe in test mode for this demo — no real charges.
          </p>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-neutral-500">
        Vid.ai — built as a lean, shippable MVP.
      </footer>
    </div>
  );
}
