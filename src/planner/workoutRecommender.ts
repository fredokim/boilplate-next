import type { FatigueScore, PainFlags, RecentWorkoutEntry } from "@/types/fatigue";
import type { WorkoutRecommendation } from "@/types/recommendation";
import type { ParsedWod } from "@/types/wod";
import { accessoryWorkouts, avoidByConcern } from "./recommendationRules";

export function recommendWorkout(
  today: ParsedWod,
  tomorrow: ParsedWod,
  fatigue: FatigueScore,
  painFlags: PainFlags,
  recentWorkouts: RecentWorkoutEntry[],
): WorkoutRecommendation {
  const reason: string[] = [];
  const avoid = new Set<string>();
  const lowerStress = fatigue.quads + fatigue.hamstrings + fatigue.glutes + fatigue.calves + fatigue.feet;
  const posteriorStress = fatigue.lower_back + fatigue.back + fatigue.hamstrings;
  const painCount = Object.values(painFlags).filter(Boolean).length;

  if (today.movements.length === 0 && tomorrow.movements.length === 0) {
    reason.push("오늘/내일 운동에서 인식된 동작이 아직 없습니다.");
  }

  if (today.workoutKind === "hyrox" || tomorrow.workoutKind === "hyrox") {
    reason.push("HYROX 입력이 있어 러닝, 썰매, 머신류 컨디셔닝 피로를 더 보수적으로 반영했습니다.");
  }

  if (painFlags.calves || painFlags.feet) {
    reason.push("종아리/발바닥 통증 신호가 있어 러닝, 더블언더, 썰매 푸시는 제한합니다.");
    avoidByConcern.calvesFeet.forEach((item) => avoid.add(item));
  }

  if (painFlags.shoulders) {
    reason.push("어깨 통증 신호가 있어 오버헤드 동작과 물구나무 계열을 피합니다.");
    avoidByConcern.shoulders.forEach((item) => avoid.add(item));
  }

  if (painFlags.lowerBack) {
    reason.push("허리 통증 신호가 있어 힌지, 로우, 썰매 당기기 볼륨을 줄입니다.");
    avoidByConcern.lowerBack.forEach((item) => avoid.add(item));
  }

  if (painFlags.knees) {
    reason.push("무릎 통증 신호가 있어 깊은 스쿼트와 런지 볼륨을 낮춥니다.");
    avoidByConcern.lower.forEach((item) => avoid.add(item));
  }

  if (lowerStress >= 44 || painCount >= 3) {
    reason.push("하체 누적 부하가 높거나 통증 체크가 많아 회복 우선 판단입니다.");
    return {
      type: "REST",
      title: "휴식 또는 아주 가벼운 회복",
      reason,
      suggestedWorkout: ["20-30분 산책", "발/종아리/고관절 가벼운 가동성", "수면과 수분 보충"],
      avoid: Array.from(avoid),
    };
  }

  if (isTomorrowOverhead(tomorrow) && fatigue.shoulders >= 16) {
    reason.push("내일 운동에 스내치/푸시프레스/핸드스탠드 계열이 있어 어깨 보조운동을 줄입니다.");
    return {
      type: "CORE_MOBILITY",
      title: "코어와 가동성만 짧게",
      reason,
      suggestedWorkout: [...accessoryWorkouts.CORE_MOBILITY],
      avoid: Array.from(new Set([...avoidByConcern.shoulders, ...avoid])),
    };
  }

  if (lowerStress >= 30 || recentLowerFatigue(recentWorkouts) >= 2) {
    reason.push("최근 3일 또는 운동 분석에서 하체 피로가 높아 하체 보조는 비추천입니다.");
    return {
      type: "UPPER_ACCESSORY",
      title: "상체 당기기 중심 보조운동",
      reason,
      suggestedWorkout: [...accessoryWorkouts.UPPER_ACCESSORY],
      avoid: Array.from(new Set([...avoidByConcern.lower, ...avoid])),
    };
  }

  if (posteriorStress >= 28) {
    reason.push("후면사슬/허리 부하가 높아 당기기와 힌지 볼륨을 낮춥니다.");
    return {
      type: "PUSH_ACCESSORY",
      title: "짧은 푸시 보조운동",
      reason,
      suggestedWorkout: [...accessoryWorkouts.PUSH_ACCESSORY],
      avoid: Array.from(new Set([...avoidByConcern.lowerBack, ...avoid])),
    };
  }

  if (today.estimatedIntensity >= 4 || tomorrow.estimatedIntensity >= 4) {
    reason.push("운동 강도가 충분히 높아 추가 운동은 30-40분 이하로 제한합니다.");
    return {
      type: "CROSSFIT_ONLY",
      title: "오늘 운동만 수행",
      reason,
      suggestedWorkout: ["메인 운동 품질 유지", "쿨다운 10분", "통증 부위 추가 부하 금지"],
      avoid: Array.from(avoid),
    };
  }

  reason.push("현재 부하가 과도하지 않아 짧은 코어/Zone2 보조가 가장 무난합니다.");

  return {
    type: "EASY_ZONE2",
    title: "쉬운 Zone2 보조운동",
    reason,
    suggestedWorkout: [...accessoryWorkouts.EASY_ZONE2],
    avoid: Array.from(avoid),
  };
}

function isTomorrowOverhead(wod: ParsedWod): boolean {
  return wod.movements.some((movement) => ["snatch", "push press", "wall walk", "thruster", "wall ball"].includes(movement.normalizedName));
}

function recentLowerFatigue(recentWorkouts: RecentWorkoutEntry[]): number {
  return recentWorkouts.filter((entry) => entry.focus === "lower" || entry.focus === "mixed" || entry.focus === "conditioning").length;
}
