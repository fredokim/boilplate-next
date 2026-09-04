"use client";

import { useMemo, useSyncExternalStore } from "react";
import { createDashboardEventBus } from "../events/dashboardEventBus";
import { DashboardRuntimeProvider } from "../events/DashboardRuntimeProvider";
import { useDashboardBuilder } from "../hooks/useDashboardBuilder";
import { initialDashboard as defaultDashboard } from "../model/initialDashboard";
import type { Dashboard } from "../model/dashboardWidget";
import type { DashboardRepository } from "../persistence/dashboardRepository";
import { CustomizableDashboardView } from "../views/CustomizableDashboardView";
import { createDashboardActionGate, type DashboardRole } from "../permissions/dashboardPermissions";
import { exportDashboard } from "../model/dashboardSerialization";
import { defaultWidgetRegistry, type WidgetRegistry } from "../widgets/widgetRegistry";
import {
  createLocalStorageDashboardPersonalizationRepository,
  createMemoryDashboardPersonalizationRepository,
  createPersonalizedDashboardRepository,
  type DashboardPersonalizationRepository,
} from "../personalization/dashboardPersonalizationRepository";
import { useDashboardPersonalization } from "../personalization/useDashboardPersonalization";
import { DashboardPersonalizationToolbar } from "../personalization/DashboardPersonalizationToolbar";
import styles from "../views/CustomizableDashboard.module.scss";

type CustomizableDashboardContainerProps = {
  initialDashboard?: Dashboard;
  initiallyEditing?: boolean;
  repository?: DashboardRepository;
  role?: DashboardRole;
  registry?: WidgetRegistry;
  showPerformanceDebug?: boolean;
  personalizationUserId?: string;
  personalizationRepository?: DashboardPersonalizationRepository;
};

type DashboardRuntimeProps = Omit<CustomizableDashboardContainerProps, "personalizationUserId" | "personalizationRepository"> & {
  repository: DashboardRepository;
};

function DashboardRuntime({
  initialDashboard = defaultDashboard,
  initiallyEditing = false,
  repository,
  role = "owner",
  registry = defaultWidgetRegistry,
  showPerformanceDebug = false,
}: DashboardRuntimeProps) {
  const eventBus = useMemo(() => createDashboardEventBus(), []);
  const actionGate = useMemo(() => createDashboardActionGate(role), [role]);
  const builder = useDashboardBuilder({ initialDashboard, initiallyEditing, repository, eventBus, actionGate, registry });

  return (
    <DashboardRuntimeProvider dashboard={builder.dashboard} eventBus={eventBus}>
      <CustomizableDashboardView
      dashboard={builder.dashboard}
      registry={registry}
      showPerformanceDebug={showPerformanceDebug}
      permissions={{
        canEdit: actionGate.can("edit"),
        canExport: actionGate.can("export"),
        canImport: actionGate.can("import"),
      }}
      eventBus={eventBus}
      canRedo={builder.canRedo}
      canUndo={builder.canUndo}
      importError={builder.importError}
      isEditing={builder.isEditing}
      isSaving={builder.isSaving}
      onAddWidget={builder.addWidget}
      onCancel={builder.cancel}
      onDeleteWidget={builder.deleteWidget}
      onEdit={builder.enterEditMode}
      onLayoutChange={builder.updateLayout}
      onSave={builder.save}
      onWidgetChange={builder.updateWidget}
      onImport={builder.importJson}
      onExport={() => actionGate.execute("export", () => exportDashboard(builder.dashboard))}
      onRedo={builder.redo}
      onUndo={builder.undo}
      selectedWidgetId={builder.selectedWidgetId}
      saveError={builder.saveError}
      />
    </DashboardRuntimeProvider>
  );
}

function PersonalizedDashboard({
  initialDashboard,
  initiallyEditing = false,
  role = "owner",
  registry = defaultWidgetRegistry,
  showPerformanceDebug = false,
  userId,
  repository,
}: Omit<CustomizableDashboardContainerProps, "repository" | "personalizationUserId" | "personalizationRepository"> & {
  initialDashboard: Dashboard;
  userId: string;
  repository: DashboardPersonalizationRepository;
}) {
  const personalization = useDashboardPersonalization(repository, userId, initialDashboard.metadata.id);
  const activePreset = personalization.personalization.presets.find(
    (preset) => preset.id === personalization.personalization.activePresetId,
  ) ?? personalization.personalization.presets[0];
  if (!activePreset) throw new Error("At least one dashboard preset is required.");
  const dashboardRepository = useMemo(() => createPersonalizedDashboardRepository(
    initialDashboard,
    personalization.personalization,
    activePreset.id,
    repository,
    personalization.replacePersonalization,
  ), [activePreset.id, initialDashboard, personalization.personalization, personalization.replacePersonalization, repository]);

  return (
    <div className={styles.personalizationShell}>
      <DashboardPersonalizationToolbar
        personalization={personalization.personalization}
        error={personalization.error}
        onCreate={personalization.createPreset}
        onDelete={personalization.deleteActivePreset}
        onExport={personalization.exportJson}
        onImport={personalization.importJson}
        onReset={personalization.resetActivePreset}
        onSelect={personalization.selectPreset}
      />
      <DashboardRuntime
        key={`${activePreset.id}:${activePreset.updatedAt}`}
        initialDashboard={initialDashboard}
        initiallyEditing={initiallyEditing}
        repository={dashboardRepository}
        role={role}
        registry={registry}
        showPerformanceDebug={showPerformanceDebug}
      />
    </div>
  );
}

const subscribeToNothing = () => () => undefined;
const getBrowserSnapshot = () => true;
const getServerSnapshot = () => false;

export default function CustomizableDashboardContainer({
  initialDashboard = defaultDashboard,
  repository,
  personalizationUserId = "demo-user",
  personalizationRepository,
  ...props
}: CustomizableDashboardContainerProps) {
  // Presets live in localStorage, which the server render cannot see. Both the server
  // and the hydrating client start from an empty in-memory repository so the markup
  // matches; the stored presets are picked up on the commit after hydration.
  const isBrowser = useSyncExternalStore(subscribeToNothing, getBrowserSnapshot, getServerSnapshot);
  const defaultPersonalizationRepository = useMemo(
    () =>
      isBrowser
        ? createLocalStorageDashboardPersonalizationRepository(window.localStorage)
        : createMemoryDashboardPersonalizationRepository(),
    [isBrowser],
  );

  if (repository) {
    return <DashboardRuntime {...props} initialDashboard={initialDashboard} repository={repository} />;
  }

  return (
    <PersonalizedDashboard
      {...props}
      key={isBrowser ? "browser" : "server"}
      initialDashboard={initialDashboard}
      repository={personalizationRepository ?? defaultPersonalizationRepository}
      userId={personalizationUserId}
    />
  );
}
