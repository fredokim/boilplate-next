export type MuscleGroup =
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "feet"
  | "back"
  | "lats"
  | "shoulders"
  | "chest"
  | "triceps"
  | "biceps"
  | "core"
  | "lower_back"
  | "conditioning"
  | "grip"
  | "traps";

export type MovementDefinition = {
  name: string;
  aliases: string[];
  muscleGroups: MuscleGroup[];
  baseLoadScore: number;
  notes?: string;
};

export type ParsedMovement = {
  name: string;
  normalizedName: string;
  muscleGroups: MuscleGroup[];
  loadScore: number;
  notes?: string;
};
