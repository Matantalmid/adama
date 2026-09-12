"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { Meter } from "@/components/ui/Meter";
import { Num } from "@/components/ui/Num";
import { RichText } from "@/components/ui/RichText";
import { Segmented } from "@/components/ui/Segmented";
import { Tag } from "@/components/ui/Tag";
import { expenseLedger } from "@/data/portfolio";
import type { Expense, Property, RehabCategory } from "@/data/types";
import { categoryFillPct, categoryState, isOverBudget } from "@/lib/deal";
import { money, moneyExact, shortDate } from "@/lib/format";
import { useExpenses, useProperty } from "@/store/hooks";

import styles from "./Expenses.module.css";

/**
 * Project expenses — mockup 3a. Filtering is the screen's real job: the four
 * uncategorised receipts and the four with no paperwork are what the investor
 * came here to clear, so both are one tap away.
 */

type Filter = "all" | "uncategorised" | "no-receipt";

const views = [
  { value: "all", label: "כל ההוצאות" },
  { value: "vendor", label: "לפי ספק" },
  { value: "phase", label: "לפי שלב" },
] as const;

export function ExpensesScreen({ propertyId }: { propertyId: string }) {
  const property = useProperty(propertyId);
  const expenses = useExpenses(propertyId);
  if (!property) return null;
  return <ExpensesBody property={property} expenses={expenses} />;
}

function ExpensesBody({ property, expenses }: { property: Property; expenses: Expense[] }) {
  const categories = property.rehabCategories ?? [];
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return expenses.filter((expense) => {
      if (filter === "uncategorised" && expense.categoryId !== null) return false;
      if (filter === "no-receipt" && expense.hasReceipt) return false;
      if (category && expense.categoryId !== category) return false;
      if (!needle) return true;
      return (
        expense.vendor.toLowerCase().includes(needle) ||
        expense.description.toLowerCase().includes(needle) ||
        expense.amount.toFixed(2).includes(needle)
      );
    });
  }, [expenses, query, filter, category]);

  const shownTotal = visible.reduce((sum, e) => sum + e.amount, 0);
  const uncategorised = expenses.filter((e) => e.categoryId === null).length;
  const missingReceipts = expenses.filter((e) => !e.hasReceipt).length;

  // The ledger the header describes is the full 42 rows, not the 8 seeded here.
  const ledger =
    property.id === expenseLedger.propertyId
      ? expenseLedger
      : {
          totalCount: expenses.length,
          receiptCount: expenses.length - missingReceipts,
          uncategorisedCount: uncategorised,
          missingReceiptCount: missingReceipts,
        };

  function toggleCategory(id: string | null) {
    setCategory((current) => (current === id ? null : id));
    setFilter("all");
  }

  return (
    <div className={styles.page}>
      <nav className={`text-muted ${styles.breadcrumb}`} aria-label="מיקום">
        <Link href="/properties">נכסים</Link>
        <span className={styles.separator} aria-hidden="true">
          ›
        </span>
        <Link href={`/properties/${property.id}`}>
          <Num>{property.address}</Num>
        </Link>
        <span className={styles.separator} aria-hidden="true">
          ›
        </span>
        <span style={{ color: "var(--color-text)" }}>הוצאות</span>
      </nav>

      <div className={styles.header}>
        <div>
          <h1>
            הוצאות · <span className={styles.headerAddress}>{property.address}</span>
          </h1>
          <p className={`text-muted ${styles.headerMeta}`}>
            <Num>{ledger.totalCount}</Num> הוצאות · <Num>{ledger.receiptCount}</Num> קבלות ·{" "}
            <Num>{ledger.uncategorisedCount}</Num> ללא קטגוריה
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className="btn btn-secondary">
            ייצא CSV
          </button>
          <button type="button" className="btn btn-primary">
            <Icon name="plus" size={14} />
            הוצאה
          </button>
        </div>
      </div>

      {/* ── category tiles: "all" plus every category with spend ── */}
      <div className={styles.summary}>
        <Tile
          label="הכל"
          value={property.rehabSpent}
          fill={(property.rehabSpent / property.rehabBudget) * 100}
          selected={category === null}
          onClick={() => toggleCategory(null)}
        />
        {categories
          .filter((c) => c.spent > 0)
          .map((c) => (
            <Tile
              key={c.id}
              label={isOverBudget(c) ? `${c.name} · חורג` : c.name}
              value={c.spent}
              fill={categoryFillPct(c)}
              over={isOverBudget(c)}
              done={categoryState(c) === "done"}
              selected={category === c.id}
              onClick={() => toggleCategory(c.id)}
            />
          ))}
      </div>

      {/* ── filters ── */}
      <div className={styles.filters}>
        <input
          className={`input ${styles.search}`}
          placeholder="חפש ספק, תיאור, סכום…"
          aria-label="חיפוש בהוצאות"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Segmented options={views} defaultValue="all" ariaLabel="תצוגת הוצאות" />

        <FilterChip
          tone="accent"
          active={filter === "uncategorised"}
          onClick={() => setFilter((f) => (f === "uncategorised" ? "all" : "uncategorised"))}
        >
          ללא קטגוריה · <Num>{ledger.uncategorisedCount}</Num>
        </FilterChip>
        <FilterChip
          tone="outline"
          active={filter === "no-receipt"}
          onClick={() => setFilter((f) => (f === "no-receipt" ? "all" : "no-receipt"))}
        >
          ללא קבלה · <Num>{ledger.missingReceiptCount}</Num>
        </FilterChip>
      </div>

      {/* ── desktop table ── */}
      <section className={`card ${styles.tableCard}`}>
        <div className={styles.tableScroll}>
          <table className="table" style={{ fontSize: 13.5 }}>
            <thead>
              <tr>
                <th style={{ width: 90 }}>תאריך</th>
                <th>תיאור</th>
                <th>ספק</th>
                <th>קטגוריה</th>
                <th>תשלום</th>
                <th style={{ textAlign: "left" }}>סכום</th>
                <th style={{ width: 70 }}>קבלה</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((expense) => (
                <tr
                  key={expense.id}
                  className={expense.categoryId === null ? styles.rowUnsorted : undefined}
                >
                  <td className="num text-muted">{shortDate(expense.date)}</td>
                  <td>
                    <RichText>{expense.description}</RichText>
                  </td>
                  <td>
                    <Num>{expense.vendor}</Num>
                  </td>
                  <td>
                    <CategoryCell category={findCategory(categories, expense.categoryId)} />
                  </td>
                  <td className="text-muted">
                    <RichText>{expense.payment}</RichText>
                  </td>
                  <td className={`num ${styles.amount}`}>{moneyExact(expense.amount)}</td>
                  <td>
                    {expense.hasReceipt ? (
                      <span className={styles.receipt} role="img" aria-label="קבלה מצורפת" />
                    ) : (
                      <span className="text-muted" style={{ fontSize: 11 }}>
                        אין
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`text-muted ${styles.empty}`}>
                    אין הוצאות שתואמות את הסינון.
                  </td>
                </tr>
              ) : null}
            </tbody>
            <tfoot>
              <tr className={styles.footRow}>
                <td colSpan={5}>
                  <Num>{visible.length}</Num> מתוך <Num>{ledger.totalCount}</Num> · סה&quot;כ מוצג
                </td>
                <td className={`num ${styles.footTotal}`}>{moneyExact(shownTotal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* ── mobile list ── */}
      <div className={styles.mobileList}>
        {visible.map((expense) => (
          <article key={expense.id} className={`card ${styles.expenseCard}`}>
            <div className={styles.expenseHead}>
              <span className={styles.expenseVendor}>
                <Num>{expense.vendor}</Num>
              </span>
              <Num style={{ fontWeight: 600 }}>{moneyExact(expense.amount)}</Num>
            </div>
            <div className="text-muted" style={{ fontSize: 12.5 }}>
              <RichText>{expense.description}</RichText>
            </div>
            <div className={styles.expenseMeta}>
              <CategoryCell category={findCategory(categories, expense.categoryId)} />
              <span className="text-muted">
                <Num>{shortDate(expense.date)}</Num> · <RichText>{expense.payment}</RichText>
              </span>
              {expense.hasReceipt ? null : (
                <Tag tone="outline">ללא קבלה</Tag>
              )}
            </div>
          </article>
        ))}
        {visible.length === 0 ? (
          <p className="text-muted" style={{ textAlign: "center" }}>
            אין הוצאות שתואמות את הסינון.
          </p>
        ) : null}
      </div>

      <div className={`text-muted ${styles.mobileTotals}`}>
        <span>
          <Num>{visible.length}</Num> מתוך <Num>{ledger.totalCount}</Num>
        </span>
        <Num style={{ fontWeight: 700, color: "var(--color-text)" }}>{moneyExact(shownTotal)}</Num>
      </div>
    </div>
  );
}

function FilterChip({
  tone,
  active,
  onClick,
  children,
}: {
  tone: "accent" | "outline";
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={[
        "tag",
        tone === "accent" ? "tag-accent" : "tag-outline",
        styles.filterTag,
        active ? styles.filterTagActive : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Tile({
  label,
  value,
  fill,
  over,
  done,
  selected,
  onClick,
}: {
  label: string;
  value: number;
  fill: number;
  over?: boolean;
  done?: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={[styles.tile, over ? styles.tileOver : "", selected ? styles.tileSelected : ""]
        .filter(Boolean)
        .join(" ")}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className={over ? styles.tileLabel : `text-muted ${styles.tileLabel}`}>{label}</span>
      <Num
        className={styles.tileValue}
        style={over ? { color: "var(--color-accent-800)" } : undefined}
      >
        {money(value)}
      </Num>
      <div className={styles.tileMeter}>
        <Meter value={fill} height={5} tone={over ? "over" : done ? "done" : "accent"} />
      </div>
    </button>
  );
}

function CategoryCell({ category }: { category: RehabCategory | null }) {
  if (!category) {
    return (
      <button type="button" className={`tag ${styles.categoryButton}`}>
        + בחר קטגוריה
      </button>
    );
  }

  return (
    <Tag tone={tagTone[categoryState(category)]}>{category.name}</Tag>
  );
}

/** Category chips follow the same three states as the bars. */
const tagTone = { over: "accent", done: "accent-2", accent: "neutral" } as const;

function findCategory(categories: RehabCategory[], id: string | null): RehabCategory | null {
  if (!id) return null;
  return categories.find((c) => c.id === id) ?? null;
}
