import { Button } from "./Button";
import styles from "./Feedback.module.scss";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string | undefined;
  children: React.ReactNode;
  onClose: () => void;
};

export function Modal({ children, description, onClose, open, title }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div aria-modal="true" className={styles.modalBackdrop} role="dialog">
      <section className={styles.modal}>
        <header className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>{title}</h2>
            {description ? <p className={styles.modalDescription}>{description}</p> : null}
          </div>
          <Button aria-label="Close modal" onClick={onClose} variant="secondary">
            X
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}
