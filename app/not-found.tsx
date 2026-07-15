import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 flex flex-col gap-6">

      <div className="flex items-center gap-2.5">
        <span className="w-1.75 h-1.75 rounded-full bg-accent shrink-0" />
        <span className="font-mono text-xs text-ink-soft tracking-[0.6px] uppercase">
          404
        </span>
      </div>

      <h1 className="font-heading text-4xl font-bold tracking-[-0.5px] text-foreground">
        Page not found
      </h1>

      <p className="font-body text-base text-ink-soft max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>

      <Link
        href="/"
        className="self-start font-mono text-sm bg-accent text-on-accent font-semibold px-5 py-2.75 rounded-[9px] hover:opacity-90 transition-opacity mt-2"
      >
        Back to home
      </Link>

    </main>
  );
}
