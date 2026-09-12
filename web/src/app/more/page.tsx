import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/ui/Icon";

import styles from "./more.module.css";

export const metadata = { title: "עוד · אדמה" };

const built = [
  {
    href: "/defaults",
    title: "ברירות מחדל לעסקה",
    detail: "העמלות והתנאים שכל עסקה חדשה מתחילה מהם — סגירה, מימון, תפעול ומכירה.",
  },
];

const planned = [
  { title: "מסמכים", detail: "חוזים, דוחות בדיקה וקבלות לכל נכס." },
  { title: "הגדרות חשבון", detail: "שם, מטבח, שפה והעדפות תצוגה." },
  { title: "ייצוא נתונים", detail: "הוצאות ותיק הנכסים כקובץ CSV." },
];

export default function MorePage() {
  return (
    <AppShell>
      <div className={styles.page}>
        <h1>עוד</h1>

        <ul className={styles.list}>
          {built.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={`card ${styles.card}`}>
                <div>
                  <div className={styles.cardTitle}>{item.title}</div>
                  <div className={`text-muted ${styles.cardDetail}`}>{item.detail}</div>
                </div>
                <Icon name="chevron-left" size={16} />
              </Link>
            </li>
          ))}
        </ul>

        <h2 className={styles.plannedHead}>בסבבים הבאים</h2>
        <ul className={styles.list}>
          {planned.map((item) => (
            <li key={item.title} className={`card ${styles.card} ${styles.cardPlanned}`}>
              <div>
                <div className={styles.cardTitle}>{item.title}</div>
                <div className={`text-muted ${styles.cardDetail}`}>{item.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
