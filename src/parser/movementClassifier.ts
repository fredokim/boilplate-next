import type { ParsedMovement } from "@/types/movement";
import { extractMovementDefinitions } from "./movementNormalizer";

export function classifyMovements(rawText: string): ParsedMovement[] {
  return extractMovementDefinitions(rawText).map((movement) => {
    const parsedMovement: ParsedMovement = {
      name: movement.name,
      normalizedName: movement.name,
      muscleGroups: movement.muscleGroups,
      loadScore: movement.baseLoadScore,
    };

    if (movement.notes) {
      parsedMovement.notes = movement.notes;
    }

    return parsedMovement;
  });
}
