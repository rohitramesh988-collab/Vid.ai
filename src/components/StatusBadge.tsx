const STYLES: Record<string, string> = {
  draft: "bg-neutral-500/15 text-neutral-300",
  scripting: "bg-amber-500/15 text-amber-300",
  scripted: "bg-sky-500/15 text-sky-300",
  rendering: "bg-amber-500/15 text-amber-300",
  ready: "bg-emerald-500/15 text-emerald-300",
  failed: "bg-red-500/15 text-red-300",
};

const LABELS: Record<string, string> = {
  draft: "Draft",
  scripting: "Scripting…",
  scripted: "Script ready",
  rendering: "Rendering…",
  ready: "Ready",
  failed: "Failed",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status] ?? STYLES.draft}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
