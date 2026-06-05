import type { ParsedWod, WodInput } from "@/types/wod";
import { classifyMovements } from "./movementClassifier";

const highIntensityTerms = ["for time", "amrap", "emom", "sprint", "max", "rx", "rounds"];

export function parseWod(input: WodInput): ParsedWod {
  const movements = classifyMovements(input.rawText);
  const title = input.title?.trim() || inferTitle(input.rawText);
  const parsedWod: ParsedWod = {
    date: input.date,
    workoutKind: input.workoutKind,
    rawText: input.rawText,
    movements,
    estimatedIntensity: estimateIntensity(input.rawText, movements.length, input.workoutKind),
  };

  if (title) {
    parsedWod.title = title;
  }

  return parsedWod;
}

function inferTitle(rawText: string): string | undefined {
  return rawText
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
}

function estimateIntensity(rawText: string, movementCount: number, workoutKind: WodInput["workoutKind"]): 1 | 2 | 3 | 4 | 5 {
  const lowerText = rawText.toLowerCase();
  const termScore = highIntensityTerms.reduce((score, term) => score + (lowerText.includes(term) ? 1 : 0), 0);
  const volumeScore = Math.min(2, Math.floor(rawText.length / 180));
  const movementScore = movementCount >= 4 ? 1 : 0;
  const workoutKindScore = workoutKind === "hyrox" ? 1 : 0;

  return Math.max(1, Math.min(5, 2 + termScore + volumeScore + movementScore + workoutKindScore)) as 1 | 2 | 3 | 4 | 5;
}
