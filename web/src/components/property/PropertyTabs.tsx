import Link from "next/link";

import { Num } from "@/components/ui/Num";
import { Tag } from "@/components/ui/Tag";

import styles from "./Property.module.css";

/** The section tabs every property page shares (mockup 2a). */
export function PropertyTabs({
  propertyId,
  active,
  expenseCount,
}: {
  propertyId: string;
  active: "overview" | "expenses" | "calculator" | "arv";
  expenseCount: number;
}) {
  const tab = (isActive: boolean) => `${styles.tab}${isActive ? ` ${styles.tabActive}` : ""}`;

  return (
    <nav className={styles.tabs} aria-label="מדורי הנכס">
      <Link href={`/properties/${propertyId}`} className={tab(active === "overview")} aria-current={active === "overview" ? "page" : undefined}>
        סקירה
      </Link>
      <Link
        href={`/properties/${propertyId}/expenses`}
        className={tab(active === "expenses")}
        aria-current={active === "expenses" ? "page" : undefined}
      >
        הוצאות{" "}
        <Tag tone="neutral" style={{ fontSize: 10, padding: "1px 7px", marginInlineStart: 4 }}>
          <Num>{expenseCount}</Num>
        </Tag>
      </Link>
      <Link href={`/properties/${propertyId}/calculator`} className={tab(active === "calculator")} aria-current={active === "calculator" ? "page" : undefined}>
        BRRRR / Flip
      </Link>
      <Link
        href={`/properties/${propertyId}/arv`}
        className={tab(active === "arv")}
        aria-current={active === "arv" ? "page" : undefined}
      >
        Comps &amp; ARV
      </Link>
      <span className={`${styles.tab} ${styles.tabDisabled}`} title="בסבב הבא">
        מסמכים
      </span>
    </nav>
  );
}
