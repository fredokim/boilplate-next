import type { FatigueScore, PainFlags, RecentWorkoutEntry } from "@/types/fatigue";
import type { MuscleGroup } from "@/types/movement";
import type { ParsedWod } from "@/types/wod";

export const emptyFatigueScore: FatigueScore = {
  quads: 0,
  hamstrings: 0,
  glutes: 0,
  calves: 0,
  feet: 0,
  back: 0,
  shoulders: 0,
  lower_back: 0,
  core: 0,
  conditioning: 0,
};

const scoreKeys = Object.keys(emptyFatigueScore) as Array<keyof FatigueScore>;

const painScoreMap: Record<keyof PainFlags, Partial<FatigueScore>> = {
  calves: { calves: 10, feet: 5 },
  feet: { feet: 10, calves: 4 },
  lowerBack: { lower_back: 10, hamstrings: 4, back: 4 },
  shoulders: { shoulders: 10 },
  knees: { quads: 7, glutes: 3 },
};

const recentFocusMap: Record<RecentWorkoutEntry["focus"], Partial<FatigueScore>> = {
  lower: { quads: 5, hamstrings: 5, glutes: 5, calves: 3, feet: 2 },
  upper: { shoulders: 4, back: 3, core: 2 },
  pull: { back: 5, lower_back: 3, hamstrings: 2 },
  push: { shoulders: 5, quads: 2 },
  core: { core: 5, lower_back: 2 },
  conditioning: { conditioning: 6, calves: 2, feet: 2 },
  mixed: { quads: 3, hamstrings: 3, glutes: 3, back: 3, shoulders: 3, conditioning: 3 },
};

const loadMultiplier: Record<RecentWorkoutEntry["load"], number> = {
  easy: 0.7,
  moderate: 1,
  hard: 1.35,
};

export function scoreFatigue(today: ParsedWod, tomorrow: ParsedWod, painFlags: PainFlags, recentWorkouts: RecentWorkoutEntry[]): FatigueScore {
  const score = { ...emptyFatigueScore };
  addWodScore(score, today, 1);
  addWodScore(score, tomorrow, 0.65);
  addPainScore(score, painFlags);
  addRecentWorkoutScore(score, recentWorkouts);

  for (const key of scoreKeys) {
    score[key] = Math.round(Math.min(30, score[key]));
  }

  return score;
}

function addWodScore(score: FatigueScore, wod: ParsedWod, dayMultiplier: number): void {
  for (const movement of wod.movements) {
    const load = movement.loadScore * dayMultiplier * (wod.estimatedIntensity / 3);

    for (const group of movement.muscleGroups) {
      addGroupScore(score, group, load * getWorkoutKindMultiplier(wod, group));
    }
  }
}

function getWorkoutKindMultiplier(wod: ParsedWod, group: MuscleGroup): number {
  if (wod.workoutKind !== "hyrox") {
    return 1;
  }

  if (group === "conditioning") {
    return 1.25;
  }

  if (group === "calves" || group === "feet" || group === "quads" || group === "glutes") {
    return 1.15;
  }

  return 1.05;
}

function addPainScore(score: FatigueScore, painFlags: PainFlags): void {
  for (const [painKey, active] of Object.entries(painFlags) as Array<[keyof PainFlags, boolean]>) {
    if (!active) {
      continue;
    }

    for (const [key, value] of Object.entries(painScoreMap[painKey]) as Array<[keyof FatigueScore, number]>) {
      score[key] += value;
    }
  }
}

function addRecentWorkoutScore(score: FatigueScore, recentWorkouts: RecentWorkoutEntry[]): void {
  recentWorkouts.forEach((entry, index) => {
    const recencyMultiplier = [1, 0.75, 0.5][index] ?? 0.4;

    for (const [key, value] of Object.entries(recentFocusMap[entry.focus]) as Array<[keyof FatigueScore, number]>) {
      score[key] += value * loadMultiplier[entry.load] * recencyMultiplier;
    }
  });
}

function addGroupScore(score: FatigueScore, group: MuscleGroup, value: number): void {
  if (group === "lats") {
    score.back += value * 0.75;
  } else if (group === "triceps" || group === "chest") {
    score.shoulders += value * 0.45;
  } else if (group === "biceps" || group === "grip" || group === "traps") {
    score.back += value * 0.35;
    score.core += value * 0.15;
  } else if (group in score) {
    score[group as keyof FatigueScore] += value;
  }
}
