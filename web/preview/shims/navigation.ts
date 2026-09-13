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

/**
 * Enough of next/navigation's router for the preview: the bundle routes on the
 * hash, so a push is a hash change and `back` is the browser's own.
 */
export function useRouter() {
  return {
    push(href: string) {
      window.location.hash = href;
    },
    replace(href: string) {
      window.location.replace(`#${href}`);
    },
    back() {
      window.history.back();
    },
    refresh() {},
    prefetch() {},
  };
}
