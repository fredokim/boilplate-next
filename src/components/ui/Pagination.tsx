import { Button } from "./Button";
import styles from "./DataDisplay.module.scss";

type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ onPageChange, page, pageCount }: PaginationProps) {
  return (
    <nav aria-label="Pagination" className={styles.pagination}>
      <Button disabled={page <= 1} onClick={() => onPageChange(page - 1)} variant="secondary">
        Prev
      </Button>
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((item) => (
        <Button
          aria-current={item === page ? "page" : undefined}
          key={item}
          onClick={() => onPageChange(item)}
          variant={item === page ? "primary" : "secondary"}
        >
          {item}
        </Button>
      ))}
      <Button disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} variant="secondary">
        Next
      </Button>
    </nav>
  );
}
