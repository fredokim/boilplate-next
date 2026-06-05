import type { WodFetchAdapter } from "./fetchAdapter";

export const naverCafeFetcher: WodFetchAdapter = {
  source: "naver-cafe",
  async fetchDailyWod() {
    throw new Error("Naver Cafe fetching is intentionally not implemented for the manual-input MVP.");
  },
};
