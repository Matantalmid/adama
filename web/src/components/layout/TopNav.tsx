"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import styles from "./AppShell.module.css";

const navItems = [
  { href: "/", label: "דשבורד", match: (p: string) => p === "/" },
  { href: "/properties", label: "נכסים", match: (p: string) => p.startsWith("/properties") },
  { href: "/calculators", label: "מחשבונים", match: (p: string) => p.startsWith("/calculators") },
  { href: "/compare", label: "השוואה", match: (p: string) => p.startsWith("/compare") },
  { href: "/arv", label: "ARV", match: (p: string) => p.startsWith("/arv") },
];

export function TopNav({ action }: { action?: ReactNode }) {
  const pathname = usePathname();

  return (
    <header className={styles.topbar}>
      <nav className={`nav ${styles.topbarInner}`}>
        <Link
          href="/"
          className="nav-brand"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}
        >
          <span className={styles.brandMark} aria-hidden="true" />
          אדמה
        </Link>

        <div className={styles.links}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.match(pathname) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {action ? <div className={styles.action}>{action}</div> : null}
      </nav>
    </header>
  );
}
