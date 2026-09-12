"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ReceiptCaptureSheet } from "@/components/expenses/ReceiptCaptureSheet";
import { Icon, type IconName } from "@/components/ui/Icon";
import { activePropertyId } from "@/data/portfolio";

import styles from "./AppShell.module.css";

interface Tab {
  href: string;
  label: string;
  icon: IconName;
  match: (pathname: string) => boolean;
}

const tabs: Tab[] = [
  { href: "/", label: "דשבורד", icon: "home", match: (p) => p === "/" },
  {
    href: `/properties/${activePropertyId}/expenses`,
    label: "הוצאות",
    icon: "receipt",
    match: (p) => p.endsWith("/expenses"),
  },
  { href: "/calculators", label: "מחשבון", icon: "calculator", match: (p) => p.startsWith("/calculators") },
  { href: "/more", label: "עוד", icon: "more", match: (p) => p.startsWith("/more") },
];

/**
 * Bottom navigation for phones (mockup 1c). The centre button is the receipt
 * camera — the primary thing this app is used for while standing in a job
 * site, so it gets the thumb position rather than a menu entry.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const [capturing, setCapturing] = useState(false);

  const [dashboard, expenses, ...rest] = tabs;

  return (
    <>
      <nav className={styles.tabbar} aria-label="ניווט ראשי">
        {[dashboard, expenses].map((tab) => (
          <TabLink key={tab.href} tab={tab} pathname={pathname} />
        ))}

        <button
          type="button"
          className={styles.fab}
          onClick={() => setCapturing(true)}
          aria-label="צלם קבלה"
        >
          <Icon name="camera" size={26} />
        </button>

        {rest.map((tab) => (
          <TabLink key={tab.href} tab={tab} pathname={pathname} />
        ))}
      </nav>

      {capturing ? <ReceiptCaptureSheet onClose={() => setCapturing(false)} /> : null}
    </>
  );
}

function TabLink({ tab, pathname }: { tab: Tab; pathname: string }) {
  const active = tab.match(pathname);
  return (
    <Link
      href={tab.href}
      className={active ? `${styles.tab} ${styles.tabActive}` : styles.tab}
      aria-current={active ? "page" : undefined}
    >
      <Icon name={tab.icon} size={22} />
      {tab.label}
    </Link>
  );
}
