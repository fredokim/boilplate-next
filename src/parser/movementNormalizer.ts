import movementData from "@/data/movements.json";
import type { MovementDefinition } from "@/types/movement";

export const movementDefinitions = movementData as MovementDefinition[];

export function normalizeMovementToken(value: string): string {
  return value.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, " ").trim();
}

export function extractMovementDefinitions(rawText: string): MovementDefinition[] {
  const normalizedText = normalizeMovementToken(rawText);

  return movementDefinitions.filter((movement) =>
    [movement.name, ...movement.aliases].some((alias) => {
      const normalizedAlias = normalizeMovementToken(alias);
      const pattern = new RegExp(`(^|\\b)${escapeRegExp(normalizedAlias)}s?(\\b|$)`, "i");
      return pattern.test(normalizedText);
    }),
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
