export type FatigueScore = {
  quads: number;
  hamstrings: number;
  glutes: number;
  calves: number;
  feet: number;
  back: number;
  shoulders: number;
  lower_back: number;
  core: number;
  conditioning: number;
};

export type PainFlags = {
  calves: boolean;
  feet: boolean;
  lowerBack: boolean;
  shoulders: boolean;
  knees: boolean;
};

export type RecentWorkoutEntry = {
  date: string;
  label: string;
  load: "easy" | "moderate" | "hard";
  focus: "lower" | "upper" | "pull" | "push" | "core" | "conditioning" | "mixed";
};
