import type { WodInput } from "@/types/wod";

export type WodFetchAdapter = {
  source: "manual" | "naver-cafe";
  fetchDailyWod(date: string): Promise<WodInput | null>;
};
