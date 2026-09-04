import { Button } from "@/components/ui/Button";
import ReactGridLayout, { useContainerWidth, type Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import type { Dashboard, DashboardWidget, WidgetType } from "../model/dashboardWidget";
import type { DashboardEventBus } from "../events/dashboardEventBus";
import { removeEmptyFilters } from "../model/dashboardFilters";
import { renderWidgetConfigEditor, type WidgetRegistry } from "../widgets/widgetRegistry";
import { WidgetRenderer } from "../widgets/WidgetRenderer";
import { DashboardPerformanceDebugPanel } from "../performance/DashboardPerformanceDebugPanel";
import { recordDashboardRender } from "../performance/dashboardPerformanceMetrics";
import styles from "./CustomizableDashboard.module.scss";

// react-grid-layout takes CSS selector strings, so the hashed module class names have
// to be interpolated rather than written as literals.
const dragHandleSelector = `.${styles.widgetHandle}`;
const dragCancelSelector = `.${styles.widgetAction}`;

type CustomizableDashboardViewProps = {
  dashboard: Dashboard;
  registry: WidgetRegistry;
  permissions: { canEdit: boolean; canExport: boolean; canImport: boolean };
  showPerformanceDebug?: boolean;
  eventBus: DashboardEventBus;
  canUndo: boolean;
  canRedo: boolean;
  importError: string | null;
  isEditing: boolean;
  isSaving: boolean;
  onAddWidget: (type: WidgetType) => void;
  onCancel: () => void;
  onDeleteWidget: (widgetId: string) => void;
  onEdit: () => void;
  onLayoutChange: (layout: { id: string; position: { x: number; y: number }; width: number; height: number }[]) => void;
  onSave: () => void;
  onWidgetChange: (widget: DashboardWidget) => void;
  onImport: (serializedDashboard: string) => void;
  onExport: () => string | undefined;
  onUndo: () => void;
  onRedo: () => void;
  selectedWidgetId: string | null;
  saveError: string | null;
};

export function CustomizableDashboardView({
  dashboard,
  registry,
  permissions,
  showPerformanceDebug = false,
  eventBus,
  canUndo,
  canRedo,
  importError,
  isEditing,
  isSaving,
  onAddWidget,
  onCancel,
  onDeleteWidget,
  onEdit,
  onLayoutChange,
  onSave,
  onWidgetChange,
  onImport,
  onExport,
  onUndo,
  onRedo,
  selectedWidgetId,
  saveError,
}: CustomizableDashboardViewProps) {
  recordDashboardRender();
  const { containerRef, mounted, width } = useContainerWidth();
  const widgetPickerItems = registry.getPickerItems();
  const layout: Layout = dashboard.widgets.map((widget) => ({
    i: widget.id,
    x: widget.position.x,
    y: widget.position.y,
    w: widget.width,
    h: widget.height,
    minW: 2,
    minH: 2,
    isResizable: registry.get(widget.type).capabilities.resizable,
  }));

  const handleLayoutChange = (nextLayout: Layout) => {
    onLayoutChange(
      nextLayout.map((item) => ({
        id: item.i,
        position: { x: item.x, y: item.y },
        width: item.w,
        height: item.h,
      })),
    );
  };

  const updateGlobalFilter = (key: "dateFrom" | "dateTo" | "region" | "product", value: string) => {
    eventBus.publish({
      type: "FilterChanged",
      sourceWidgetId: null,
      scope: "global",
      filters: removeEmptyFilters({ ...dashboard.globalFilters, [key]: value }),
    });
  };

  const downloadDashboard = () => {
    const serializedDashboard = onExport();
    if (!serializedDashboard) return;
    const url = URL.createObjectURL(new Blob([serializedDashboard], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dashboard.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div>
          <div className={styles.headingActions}>
            <h1 className={styles.title}>Customizable Dashboard</h1>
            {isEditing ? <span className={styles.editBadge}>Editing draft</span> : null}
          </div>
          <p className={styles.subtitle}>
            {isEditing ? "Changes remain in a draft until you save." : "View mode prevents accidental layout changes."}
          </p>
        </div>
        <div className={styles.headingActions}>
          {permissions.canExport ? (
            <Button onClick={downloadDashboard} variant="secondary">
              Export JSON
            </Button>
          ) : null}
          {isEditing ? (
            <>
              <Button disabled={!canUndo || isSaving} onClick={onUndo} variant="secondary">
                Undo
              </Button>
              <Button disabled={!canRedo || isSaving} onClick={onRedo} variant="secondary">
                Redo
              </Button>
              {permissions.canImport ? (
                <label className={styles.importButton}>
                  Import JSON
                  <input
                    accept="application/json"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void file.text().then(onImport);
                      event.target.value = "";
                    }}
                    type="file"
                  />
                </label>
              ) : null}
              <Button disabled={isSaving} onClick={onCancel} variant="secondary">
                Cancel
              </Button>
              <Button isLoading={isSaving} onClick={onSave}>
                Save
              </Button>
            </>
          ) : permissions.canEdit ? (
            <Button onClick={onEdit}>Edit dashboard</Button>
          ) : null}
        </div>
      </div>

      {saveError || importError ? (
        <div className={styles.saveError} role="alert">
          {saveError ?? importError}
        </div>
      ) : null}

      <section aria-label="Global filters" className={styles.globalFilters}>
        <strong>Global filters</strong>
        <label>
          From
          <input
            onChange={(event) => updateGlobalFilter("dateFrom", event.target.value)}
            type="date"
            value={dashboard.globalFilters.dateFrom ?? ""}
          />
        </label>
        <label>
          To
          <input
            onChange={(event) => updateGlobalFilter("dateTo", event.target.value)}
            type="date"
            value={dashboard.globalFilters.dateTo ?? ""}
          />
        </label>
        <label>
          Region
          <select
            onChange={(event) => updateGlobalFilter("region", event.target.value)}
            value={dashboard.globalFilters.region ?? ""}
          >
            <option value="">All</option>
            <option value="americas">Americas</option>
            <option value="emea">EMEA</option>
            <option value="apac">APAC</option>
          </select>
        </label>
        <label>
          Product
          <input
            onChange={(event) => updateGlobalFilter("product", event.target.value)}
            placeholder="All products"
            value={dashboard.globalFilters.product ?? ""}
          />
        </label>
        <Button onClick={() => eventBus.publish({ type: "RefreshRequested" })} size="sm" variant="secondary">
          Refresh all
        </Button>
      </section>

      {isEditing ? (
        <section aria-label="Widget picker" className={styles.toolbar}>
          <strong>Add widget</strong>
          <div className={styles.headingActions}>
            {widgetPickerItems.map((item) => (
              <Button key={item.type} onClick={() => onAddWidget(item.type)} size="sm" variant="secondary">
                + {item.label}
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      <div className={styles.gridContainer} ref={containerRef}>
        {mounted ? (
          <ReactGridLayout
            dragConfig={{
              enabled: permissions.canEdit && isEditing && !isSaving,
              handle: dragHandleSelector,
              cancel: dragCancelSelector,
            }}
            gridConfig={{ cols: 12, margin: [16, 16], rowHeight: 52 }}
            layout={layout}
            onLayoutChange={handleLayoutChange}
            resizeConfig={{ enabled: permissions.canEdit && isEditing && !isSaving, handles: ["se"] }}
            width={width}
          >
            {dashboard.widgets.map((widget) => (
              <article
                className={[styles.widget, selectedWidgetId === widget.id ? styles.widgetSelected : ""].join(" ")}
                key={widget.id}
                onClick={() => eventBus.publish({ type: "WidgetSelected", widgetId: widget.id })}
              >
                <div className={[styles.widgetHeader, isEditing ? styles.widgetHandle : ""].join(" ")}>
                  <div className={styles.headingActions}>
                    <span>{registry.get(widget.type).displayName}</span>
                    {widget.localFilters.product ? (
                      <span className={styles.filterBadge}>Local: {widget.localFilters.product}</span>
                    ) : null}
                    {widget.crossWidgetFilters.product ? (
                      <span className={styles.filterBadge}>Cross: {widget.crossWidgetFilters.product}</span>
                    ) : null}
                    {widget.dataSource.refreshPolicy?.mode === "interval" ? (
                      <span className={styles.filterBadge}>
                        Every {(widget.dataSource.refreshPolicy.intervalMs ?? 0) / 1000}s
                      </span>
                    ) : null}
                  </div>
                  {isEditing ? (
                    <button
                      aria-label={`Delete ${widget.config.title}`}
                      className={styles.widgetAction}
                      onClick={() => onDeleteWidget(widget.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  ) : registry.get(widget.type).capabilities.refreshable ? (
                    <button
                      aria-label={`Refresh ${widget.config.title}`}
                      className={styles.widgetAction}
                      onClick={(event) => {
                        event.stopPropagation();
                        eventBus.publish({ type: "RefreshRequested", widgetId: widget.id });
                      }}
                      type="button"
                    >
                      Refresh
                    </button>
                  ) : null}
                </div>
                <div className={styles.widgetContent}>
                  <WidgetRenderer registry={registry} widget={widget} />
                </div>
              </article>
            ))}
          </ReactGridLayout>
        ) : null}
      </div>

      {isEditing && dashboard.widgets.length > 0 ? (
        <section aria-label="Widget settings" className={styles.settings}>
          <div>
            <h2 className={styles.title}>Widget settings</h2>
            <p className={styles.subtitle}>Each widget definition supplies its own editor.</p>
          </div>
          <div className={styles.settingsGrid}>
            {dashboard.widgets.map((widget) => (
              <div className={styles.settingsItem} key={widget.id}>
                <strong>{widget.config.title}</strong>
                {renderWidgetConfigEditor(widget, onWidgetChange, registry)}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {showPerformanceDebug ? (
        <DashboardPerformanceDebugPanel selectedWidgetId={selectedWidgetId} widgetCount={dashboard.widgets.length} />
      ) : null}
    </div>
  );
}
