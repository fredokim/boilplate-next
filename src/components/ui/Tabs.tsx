import styles from "./Feedback.module.scss";

type TabItem = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type TabsProps = {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
};

export function Tabs({ activeId, items, onChange }: TabsProps) {
  const activeItem = items.find((item) => item.id === activeId) ?? items[0];

  return (
    <div className={styles.tabs}>
      <div aria-label="Tabs" className={styles.tabList} role="tablist">
        {items.map((item) => (
          <button
            aria-selected={item.id === activeId}
            className={[styles.tabButton, item.id === activeId ? styles.tabButtonActive : ""].join(" ")}
            key={item.id}
            onClick={() => onChange(item.id)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={styles.tabPanel} role="tabpanel">
        {activeItem?.content}
      </div>
    </div>
  );
}
