import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { DashboardPersonalization } from "./dashboardPersonalization";
import styles from "../views/CustomizableDashboard.module.scss";

export function DashboardPersonalizationToolbar({
  personalization,
  error,
  onCreate,
  onDelete,
  onExport,
  onImport,
  onReset,
  onSelect,
}: {
  personalization: DashboardPersonalization;
  error: string | null;
  onCreate: (name: string) => void;
  onDelete: () => void;
  onExport: () => string;
  onImport: (serialized: string) => void;
  onReset: () => void;
  onSelect: (presetId: string) => void;
}) {
  const [name, setName] = useState("");
  const download = () => {
    const url = URL.createObjectURL(new Blob([onExport()], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dashboard-personalization.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className={styles.personalization} aria-label="Dashboard personalization">
      <div className={styles.personalizationIdentity}>
        <strong>My dashboard presets</strong>
        <span>User: {personalization.userId}</span>
      </div>
      <label>
        Active preset
        <select value={personalization.activePresetId} onChange={(event) => onSelect(event.target.value)}>
          {personalization.presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
        </select>
      </label>
      <div className={styles.personalizationCreate}>
        <input aria-label="New preset name" placeholder="New preset name" value={name} onChange={(event) => setName(event.target.value)} />
        <Button size="sm" variant="secondary" onClick={() => { onCreate(name); setName(""); }}>Duplicate preset</Button>
      </div>
      <Button size="sm" variant="secondary" onClick={onReset}>Reset to default</Button>
      <Button disabled={personalization.presets.length <= 1} size="sm" variant="secondary" onClick={onDelete}>Delete preset</Button>
      <Button size="sm" variant="secondary" onClick={download}>Export personalization</Button>
      <label className={styles.importButton}>
        Import personalization
        <input
          accept="application/json"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void file.text().then(onImport);
            event.target.value = "";
          }}
        />
      </label>
      {error ? <span className={styles.personalizationError} role="alert">{error}</span> : null}
    </section>
  );
}
