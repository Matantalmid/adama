import Link from "next/link";

import { AppShell } from "./AppShell";
import styles from "./ComingSoon.module.css";

/**
 * A screen the design round has not reached yet. The nav in the mockups links
 * to all of these, so they need somewhere honest to land — an empty state that
 * says what is coming rather than a dead link or a 404.
 */
export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.card}>
          <h1>{title}</h1>
          <p className="text-muted">{description}</p>
          <p className={styles.note}>
            המסך הזה מתוכנן לסבב העיצוב הבא, אחרי שטבלת החישובים תיטען.
          </p>
          <Link href="/" className="btn btn-secondary">
            חזרה לדשבורד
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
