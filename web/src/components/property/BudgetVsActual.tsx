import Link from "next/link";

import { Icon } from "@/components/ui/Icon";
import { Meter } from "@/components/ui/Meter";
import { Num } from "@/components/ui/Num";
import { Tag } from "@/components/ui/Tag";
import type { Property } from "@/data/types";
import { categoryFillPct, categoryState, isOverBudget, rehabRemaining } from "@/lib/deal";
import { money, ratio } from "@/lib/format";

import styles from "./BudgetVsActual.module.css";

/**
 * Budget against actual, category by category (mockup 2a). The one category
 * that has gone over is the whole point of the panel, so it is the only row
 * that takes colour.
 */
export function BudgetVsActual({ property }: { property: Property }) {
  const categories = property.rehabCategories ?? [];
  const remaining = rehabRemaining(property);
  const overrun = categories.find(isOverBudget);

  return (
    <section className={`card ${styles.card}`}>
      <div className={styles.head}>
        <h2>תקציב מול ביצוע</h2>
        <div className={styles.headFigures}>
          <Num style={{ fontWeight: 700 }}>{money(property.rehabSpent)}</Num>{" "}
          <span className="text-muted">מתוך</span> <Num>{money(property.rehabBudget)}</Num>
          <Tag tone={remaining >= 0 ? "accent-2" : "accent"} className={styles.remaining}>
            {remaining >= 0 ? "נותרו " : "חריגה "}
            <Num>{money(Math.abs(remaining))}</Num>
          </Tag>
        </div>
      </div>

      <div className={styles.rows}>
        {categories.map((category) => {
          const over = isOverBudget(category);
          return (
            <div key={category.id} className={styles.row}>
              <span className={styles.rowName}>{category.name}</span>
              <Meter
                value={categoryFillPct(category)}
                height={10}
                tone={categoryState(category)}
                label={`${category.name}: ${money(category.spent)} מתוך ${money(category.budget)}`}
              />
              <Num className={over ? styles.rowOver : `${styles.rowFigure} text-muted`}>
                {ratio(category.spent, category.budget)}
              </Num>
            </div>
          );
        })}
      </div>

      <div className={styles.actions}>
        <Link
          href={`/properties/${property.id}/expenses`}
          className="btn btn-primary"
          style={{ fontSize: 13 }}
        >
          <Icon name="plus" size={14} />
          הוצאה
        </Link>
        {overrun ? (
          <button type="button" className="btn btn-secondary" style={{ fontSize: 13 }}>
            עדכן תקציב {overrun.name}
          </button>
        ) : null}
      </div>
    </section>
  );
}
