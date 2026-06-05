import type { WodFetchAdapter } from "./fetchAdapter";

export const manualInputAdapter: WodFetchAdapter = {
  source: "manual",
  async fetchDailyWod() {
    return null;
  },
};
