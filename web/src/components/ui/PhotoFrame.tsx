import { Icon } from "./Icon";
import styles from "./PhotoFrame.module.css";

/**
 * Property photography. Stands in for the prototype's <image-slot>, which was
 * a drag-and-drop affordance belonging to the design tool — here the empty
 * state is simply what a property with no photo yet looks like.
 */
export function PhotoFrame({
  src,
  alt,
  caption,
  radius = 32,
  className,
}: {
  src?: string;
  alt?: string;
  /** Shown when there is no photo. */
  caption: string;
  radius?: number;
  className?: string;
}) {
  return (
    <div
      className={[styles.frame, "washed", className].filter(Boolean).join(" ")}
      style={{ borderRadius: radius }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- seed data has no
        // real photos yet; swap for next/image once uploads exist.
        <img src={src} alt={alt ?? caption} />
      ) : (
        <p className={styles.caption}>
          <Icon name="camera" size={22} className={styles.icon} />
          {caption}
        </p>
      )}
    </div>
  );
}
