import type { ParsedMovement } from "./movement";

export type WorkoutKind = "crossfit" | "hyrox";

export type ParsedWod = {
  date: string;
  title?: string;
  workoutKind: WorkoutKind;
  rawText: string;
  movements: ParsedMovement[];
  estimatedIntensity: 1 | 2 | 3 | 4 | 5;
};

export type WodInput = {
  date: string;
  title?: string;
  workoutKind: WorkoutKind;
  rawText: string;
};

export type WorkoutResult = {
  durationMinutes?: string;
  calories?: string;
  avgHeartRate?: string;
  distanceKm?: string;
  notes?: string;
};

export type WodArchiveEntry = ParsedWod & {
  id: string;
  source: "manual-import" | "daily-input" | "healthkit";
  importedAt: string;
  result?: WorkoutResult;
};
