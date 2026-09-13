"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

/**
 * Stands in for next/link in the static preview build. Routes become hash
 * fragments so the whole app can be served as a single file.
 */
export default function Link({
  href,
  children,
  ...rest
}: { href: string; children: ReactNode } & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
>) {
  return (
    <a href={`#${href}`} {...rest}>
      {children}
    </a>
  );
}
