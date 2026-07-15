/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useTheme } from "next-themes";

export function Logo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <Link href="/" aria-label="Home">
      <img
        src={mounted && resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
        alt="Elibabah"
        className="h-8 w-auto"
      />
    </Link>
  );
}
