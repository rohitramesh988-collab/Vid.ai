import Link from "next/link";
import { auth } from "@/lib/auth";

export async function Nav() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-pink-500" />
          <span>Vid.ai</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/#pricing" className="hidden text-neutral-300 hover:text-white sm:inline">
            Pricing
          </Link>
          {session?.user ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-white px-4 py-2 font-medium text-neutral-950 transition hover:bg-neutral-200"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-neutral-300 hover:text-white">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-white px-4 py-2 font-medium text-neutral-950 transition hover:bg-neutral-200"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
