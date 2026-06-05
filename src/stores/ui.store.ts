"use client";

import { create } from "zustand";
import { parseState } from "@/core/state/validateState";
import { uiStateSnapshotSchema } from "./ui.schema";

type UiState = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set(parseState(uiStateSnapshotSchema, { sidebarOpen: open }, "ui.setSidebarOpen")),
}));
