import type { ReactNode } from "react";

import { MobileTabBar } from "./MobileTabBar";
import { TopNav } from "./TopNav";
import styles from "./AppShell.module.css";

/**
 * Chrome shared by every screen: the top bar on desktop, the tab bar on
 * phones. Only one of the two is ever visible — pages supply their own mobile
 * header, because each screen's mockup opens differently (a greeting, a back
 * button, a filter row).
 */
export function AppShell({
  children,
  action,
}: {
  children: ReactNode;
  /** Trailing control in the top bar — "נכס חדש", search, and so on. */
  action?: ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <TopNav action={action} />
      <main className={styles.main}>{children}</main>
      <MobileTabBar />
    </div>
  );
}
