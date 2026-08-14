"use client";

import { Moon, Sun } from "lucide";
import { useEffect, useState } from "react";

import { MorphIcon } from "morphicons/react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8" />;
  }

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";

    if (!document.startViewTransition) {
      setTheme(next);
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });
  };

  return (
    <button
        type="button"
        onClick={() => toggleTheme()}
        aria-label="Toggle theme"
        className="w-8 h-8 flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
    >
      <MorphIcon icon={resolvedTheme === "dark" ? Moon : Sun} size={24} strokeWidth={2} spring="smooth"/>
    </button>
  );
}
