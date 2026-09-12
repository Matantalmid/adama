"use client";

import { useEffect, useState } from "react";

export function currentPath(): string {
  const hash = window.location.hash.replace(/^#/, "");
  return hash || "/";
}

/** The current route, read from the hash. Mirrors next/navigation's usePathname. */
export function usePathname(): string {
  const [pathname, setPathname] = useState(() => currentPath());

  useEffect(() => {
    const onChange = () => setPathname(currentPath());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return pathname;
}

export function notFound(): never {
  throw new Error("not found");
}
