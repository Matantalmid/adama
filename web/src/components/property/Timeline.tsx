import { Icon } from "@/components/ui/Icon";
import { RichText } from "@/components/ui/RichText";
import type { Milestone } from "@/data/types";

import styles from "./Timeline.module.css";

/**
 * The BRRRR sequence for one property (mockup 2a): bought, renovating, rent,
 * refinance. The active step gets the halo; everything after it is an outline.
 */
export function Timeline({ milestones }: { milestones: Milestone[] }) {
  return (
    <section className={`card ${styles.card}`}>
      <h2>ציר זמן</h2>
      <ol className={styles.list}>
        {milestones.map((milestone, index) => (
          <li key={milestone.id} className={styles.item}>
            <div className={styles.rail}>
              <span className={`${styles.node} ${styles[milestone.state]}`}>
                {milestone.state === "done" ? (
                  <Icon name="check" size={12} style={{ color: "#fff" }} />
                ) : null}
              </span>
              {index < milestones.length - 1 ? (
                <span
                  className={
                    milestone.state === "done" ? `${styles.line} ${styles.lineDone}` : styles.line
                  }
                />
              ) : null}
            </div>

            <div
              className={[
                styles.body,
                index < milestones.length - 1 ? styles.bodySpaced : "",
                milestone.state === "upcoming" ? "text-muted" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <b className={styles.title}>{milestone.title}</b> ·{" "}
              <RichText>{milestone.when}</RichText>
              <div>
                <RichText>{milestone.detail}</RichText>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
