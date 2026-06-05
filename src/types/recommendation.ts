export type RecommendationType =
  | "REST"
  | "CROSSFIT_ONLY"
  | "UPPER_ACCESSORY"
  | "LOWER_ACCESSORY"
  | "PULL_ACCESSORY"
  | "PUSH_ACCESSORY"
  | "CORE_MOBILITY"
  | "EASY_ZONE2";

export type WorkoutRecommendation = {
  type: RecommendationType;
  title: string;
  reason: string[];
  suggestedWorkout?: string[];
  avoid?: string[];
};
