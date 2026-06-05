import type { PropsWithChildren } from "react";
import styles from "./Card.module.scss";

type CardProps = PropsWithChildren<{
  title?: string;
  description?: string;
}>;

export function Card({ children, description, title }: CardProps) {
  return (
    <section className={styles.card}>
      {title || description ? (
        <header className={styles.header}>
          {title ? <h2 className={styles.title}>{title}</h2> : null}
          {description ? <p className={styles.description}>{description}</p> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
