import { z } from "zod";

export const uiStateSnapshotSchema = z.object({
  sidebarOpen: z.boolean(),
});

export type UiStateSnapshot = z.infer<typeof uiStateSnapshotSchema>;
