/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useTheme } from "next-themes";

type LogoProps = {
  includesName?: boolean;
}

export function Logo({ includesName = false }: Readonly<LogoProps>) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <Link href="/" aria-label="Home" className="flex items-center justify-between gap-2.75">
      <img
        src={mounted && resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
        alt="Elibabah"
        className="h-8 w-auto"
      />
      {includesName &&
        <div className="font-heading font-bold text-[21px] tracking-[-0.3px] text-foreground hover:text-foreground">
          elibabah
        </div>
      }
    </Link>
  );
}
