"use client";

import { useEffect, useMemo, useState } from "react";
import { parseWodArchiveText } from "@/parser/wodArchiveParser";
import { parseWod } from "@/parser/wodParser";
import { emptyFatigueScore, scoreFatigue } from "@/planner/fatigueScorer";
import { recommendWorkout } from "@/planner/workoutRecommender";
import type { PainFlags, RecentWorkoutEntry } from "@/types/fatigue";
import type { RecommendationType } from "@/types/recommendation";
import type { WodArchiveEntry, WodInput as WodInputType, WorkoutKind, WorkoutResult } from "@/types/wod";
import { addDays, toDateInputValue } from "@/utils/date";
import { RecommendationCard } from "./RecommendationCard";
import { WeeklyLoadView } from "./WeeklyLoadView";
import { WodAnalysisCard } from "./WodAnalysisCard";
import { WodInput } from "./WodInput";
import styles from "./WodPlanner.module.scss";

type CompletionResult = Required<WorkoutResult>;

type ConfirmedWorkout = {
  id: string;
  date: string;
  source: "today-input" | "recommendation";
  status: "planned" | "completed";
  title: string;
  workoutKind: WorkoutKind;
  recommendationType?: RecommendationType;
  rawText: string;
  result: CompletionResult;
  completedAt?: string;
};

type AttendanceStatus = "attended" | "missed" | "rest";

type AttendanceEntry = {
  date: string;
  status: AttendanceStatus;
  wodId?: string;
  notes?: string;
};

type PersonalRecord = {
  id: string;
  date: string;
  movement: string;
  value: string;
  unit: "kg" | "reps" | "time" | "calories" | "meters" | "score";
  sourceWodId?: string;
  notes?: string;
};

type PlannerState = {
  today: WodInputType;
  tomorrow: WodInputType;
  painFlags: PainFlags;
  recentWorkouts: RecentWorkoutEntry[];
  confirmedWorkout: ConfirmedWorkout | null;
  wodArchive: WodArchiveEntry[];
  attendanceLog: AttendanceEntry[];
  personalRecords: PersonalRecord[];
};

const storageKey = "wod-planner:v1";

const painOptions: Array<{ key: keyof PainFlags; label: string }> = [
  { key: "calves", label: "종아리" },
  { key: "feet", label: "발바닥" },
  { key: "lowerBack", label: "허리" },
  { key: "shoulders", label: "어깨" },
  { key: "knees", label: "무릎" },
];

const focusOptions: RecentWorkoutEntry["focus"][] = ["mixed", "lower", "upper", "pull", "push", "core", "conditioning"];
const loadOptions: RecentWorkoutEntry["load"][] = ["easy", "moderate", "hard"];
const recordUnits: PersonalRecord["unit"][] = ["kg", "reps", "time", "calories", "meters", "score"];

const emptyResult: CompletionResult = {
  durationMinutes: "",
  calories: "",
  avgHeartRate: "",
  distanceKm: "",
  notes: "",
};

const emptyRecord: Omit<PersonalRecord, "id"> = {
  date: toDateInputValue(new Date()),
  movement: "",
  value: "",
  unit: "kg",
  notes: "",
};

function createInitialState(): PlannerState {
  const today = new Date();

  return {
    today: {
      date: toDateInputValue(today),
      title: "오늘 WOD",
      workoutKind: "crossfit",
      rawText: "run\nsled push\nrow",
    },
    tomorrow: {
      date: toDateInputValue(addDays(today, 1)),
      title: "내일 WOD",
      workoutKind: "crossfit",
      rawText: "snatch\nsquat",
    },
    painFlags: {
      calves: false,
      feet: false,
      lowerBack: false,
      shoulders: false,
      knees: false,
    },
    recentWorkouts: [
      { date: toDateInputValue(addDays(today, -1)), label: "CrossFit WOD", load: "moderate", focus: "mixed" },
      { date: toDateInputValue(addDays(today, -2)), label: "Zone2 bike", load: "easy", focus: "conditioning" },
      { date: toDateInputValue(addDays(today, -3)), label: "Accessory", load: "moderate", focus: "upper" },
    ],
    confirmedWorkout: null,
    wodArchive: [],
    attendanceLog: [],
    personalRecords: [],
  };
}

function normalizePlannerState(saved: Partial<PlannerState>): PlannerState {
  const fallback = createInitialState();

  return {
    today: { ...fallback.today, ...saved.today, workoutKind: saved.today?.workoutKind ?? "crossfit" },
    tomorrow: { ...fallback.tomorrow, ...saved.tomorrow, workoutKind: saved.tomorrow?.workoutKind ?? "crossfit" },
    painFlags: { ...fallback.painFlags, ...saved.painFlags },
    recentWorkouts: saved.recentWorkouts ?? fallback.recentWorkouts,
    confirmedWorkout: saved.confirmedWorkout
      ? { ...saved.confirmedWorkout, result: { ...emptyResult, ...saved.confirmedWorkout.result } }
      : null,
    wodArchive: saved.wodArchive ?? [],
    attendanceLog: saved.attendanceLog ?? [],
    personalRecords: saved.personalRecords ?? [],
  };
}

function createConfirmedWorkout(
  source: ConfirmedWorkout["source"],
  today: WodInputType,
  recommendationType?: RecommendationType,
  recommendationTitle?: string,
): ConfirmedWorkout {
  const title = source === "recommendation" ? recommendationTitle ?? recommendationType ?? "추천 운동" : today.title || "오늘 운동";
  const confirmedWorkout: ConfirmedWorkout = {
    id: `${Date.now()}`,
    date: today.date,
    source,
    status: "planned",
    title,
    workoutKind: today.workoutKind,
    rawText: source === "recommendation" ? title : today.rawText,
    result: { ...emptyResult },
  };

  if (recommendationType) {
    confirmedWorkout.recommendationType = recommendationType;
  }

  return confirmedWorkout;
}

function mergeArchive(existing: WodArchiveEntry[], incoming: WodArchiveEntry[]): WodArchiveEntry[] {
  const byId = new Map(existing.map((entry) => [entry.id, entry]));
  incoming.forEach((entry) => byId.set(entry.id, entry));
  return Array.from(byId.values()).sort((a, b) => b.date.localeCompare(a.date));
}

function getMovementSummary(entries: WodArchiveEntry[]): Array<{ name: string; count: number }> {
  const countMap = new Map<string, number>();

  for (const entry of entries) {
    for (const movement of entry.movements) {
      countMap.set(movement.name, (countMap.get(movement.name) ?? 0) + 1);
    }
  }

  return Array.from(countMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getAttendanceSummary(attendanceLog: AttendanceEntry[]): { attended: number; missed: number; rest: number; rate: number } {
  const attended = attendanceLog.filter((entry) => entry.status === "attended").length;
  const missed = attendanceLog.filter((entry) => entry.status === "missed").length;
  const rest = attendanceLog.filter((entry) => entry.status === "rest").length;
  const trainingDays = attended + missed;

  return {
    attended,
    missed,
    rest,
    rate: trainingDays > 0 ? Math.round((attended / trainingDays) * 100) : 0,
  };
}

function getAbilityScores(entries: WodArchiveEntry[], attendanceLog: AttendanceEntry[], records: PersonalRecord[]) {
  const attendedDates = new Set(attendanceLog.filter((entry) => entry.status === "attended").map((entry) => entry.date));
  const completedEntries = entries.filter((entry) => attendedDates.has(entry.date) || entry.result);
  const movementNames = new Set(completedEntries.flatMap((entry) => entry.movements.map((movement) => movement.name)));
  const attendance = getAttendanceSummary(attendanceLog);

  return [
    { label: "출석 꾸준함", score: attendance.rate, detail: `${attendance.attended}회 출석 / ${attendance.missed}회 결석` },
    { label: "근력 데이터", score: Math.min(100, records.filter((record) => record.unit === "kg").length * 20), detail: `${records.filter((record) => record.unit === "kg").length}개 중량 기록` },
    { label: "엔진", score: Math.min(100, ["run", "row", "ski erg", "sled push", "sled pull"].filter((name) => movementNames.has(name)).length * 20), detail: "러닝/머신/썰매 노출 기반" },
    { label: "짐내스틱", score: Math.min(100, ["pull-up", "toes to bar", "wall walk"].filter((name) => movementNames.has(name)).length * 34), detail: "풀업/토투바/핸드스탠드 계열 기반" },
    { label: "데이터 완성도", score: Math.min(100, records.length * 10 + completedEntries.filter((entry) => entry.result).length * 15), detail: `${records.length}개 개인 기록, ${completedEntries.filter((entry) => entry.result).length}개 수행 결과` },
  ];
}

export function WodPlanner() {
  const [state, setState] = useState<PlannerState>(() => createInitialState());
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [archiveImportText, setArchiveImportText] = useState("");
  const [archiveImportKind, setArchiveImportKind] = useState<WorkoutKind>("crossfit");
  const [recordDraft, setRecordDraft] = useState<Omit<PersonalRecord, "id">>(emptyRecord);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      setState(normalizePlannerState(JSON.parse(saved) as Partial<PlannerState>));
    }
    setHasLoadedStorage(true);
  }, []);

  useEffect(() => {
    if (hasLoadedStorage) {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [hasLoadedStorage, state]);

  const todayWod = useMemo(() => parseWod(state.today), [state.today]);
  const tomorrowWod = useMemo(() => parseWod(state.tomorrow), [state.tomorrow]);
  const fatigue = useMemo(
    () => (hasLoadedStorage ? scoreFatigue(todayWod, tomorrowWod, state.painFlags, state.recentWorkouts) : emptyFatigueScore),
    [hasLoadedStorage, state.painFlags, state.recentWorkouts, todayWod, tomorrowWod],
  );
  const recommendation = useMemo(
    () => recommendWorkout(todayWod, tomorrowWod, fatigue, state.painFlags, state.recentWorkouts),
    [fatigue, state.painFlags, state.recentWorkouts, todayWod, tomorrowWod],
  );
  const movementSummary = useMemo(() => getMovementSummary(state.wodArchive), [state.wodArchive]);
  const attendanceSummary = useMemo(() => getAttendanceSummary(state.attendanceLog), [state.attendanceLog]);
  const abilityScores = useMemo(
    () => getAbilityScores(state.wodArchive, state.attendanceLog, state.personalRecords),
    [state.attendanceLog, state.personalRecords, state.wodArchive],
  );

  function updateWod(day: "today" | "tomorrow", value: WodInputType): void {
    setState((current) => ({ ...current, [day]: value }));
  }

  function updateRecentWorkout(index: number, nextEntry: RecentWorkoutEntry): void {
    setState((current) => ({
      ...current,
      recentWorkouts: current.recentWorkouts.map((entry, entryIndex) => (entryIndex === index ? nextEntry : entry)),
    }));
  }

  function setAttendance(date: string, status: AttendanceStatus, wodId?: string): void {
    setState((current) => ({
      ...current,
      attendanceLog: [
        ...current.attendanceLog.filter((entry) => entry.date !== date),
        {
          date,
          status,
          ...(wodId ? { wodId } : {}),
        },
      ].sort((a, b) => b.date.localeCompare(a.date)),
    }));
  }

  function confirmWorkout(source: ConfirmedWorkout["source"]): void {
    setState((current) => ({
      ...current,
      confirmedWorkout: createConfirmedWorkout(source, current.today, recommendation.type, recommendation.title),
    }));
  }

  function updateResult(nextResult: Partial<CompletionResult>): void {
    setState((current) => {
      if (!current.confirmedWorkout) {
        return current;
      }

      return {
        ...current,
        confirmedWorkout: {
          ...current.confirmedWorkout,
          result: { ...current.confirmedWorkout.result, ...nextResult },
        },
      };
    });
  }

  function completeWorkout(): void {
    setState((current) => {
      if (!current.confirmedWorkout) {
        return current;
      }

      const completedWorkout = {
        ...current.confirmedWorkout,
        status: "completed" as const,
        completedAt: new Date().toISOString(),
      };
      const parsed = parseWod({
        date: completedWorkout.date,
        title: completedWorkout.title,
        workoutKind: completedWorkout.workoutKind,
        rawText: completedWorkout.rawText,
      });
      const archiveEntry: WodArchiveEntry = {
        ...parsed,
        id: completedWorkout.id,
        source: "daily-input",
        importedAt: completedWorkout.completedAt,
        result: completedWorkout.result,
      };

      return {
        ...current,
        confirmedWorkout: completedWorkout,
        attendanceLog: [
          ...current.attendanceLog.filter((entry) => entry.date !== completedWorkout.date),
          { date: completedWorkout.date, status: "attended" as const, wodId: completedWorkout.id },
        ],
        wodArchive: mergeArchive(current.wodArchive, [archiveEntry]),
      };
    });
  }

  function importArchiveText(): void {
    const entries = parseWodArchiveText(archiveImportText, {
      fallbackDate: state.today.date,
      workoutKind: archiveImportKind,
    });
    setState((current) => ({ ...current, wodArchive: mergeArchive(current.wodArchive, entries) }));
    setArchiveImportText("");
  }

  function addPersonalRecord(): void {
    if (!recordDraft.movement.trim() || !recordDraft.value.trim()) {
      return;
    }

    setState((current) => ({
      ...current,
      personalRecords: [
        {
          ...recordDraft,
          id: `${Date.now()}`,
          movement: recordDraft.movement.trim(),
          value: recordDraft.value.trim(),
        },
        ...current.personalRecords,
      ],
    }));
    setRecordDraft({ ...emptyRecord, date: state.today.date });
  }

  const recentArchive = state.wodArchive.slice(0, 10);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>WOD Planner MVP</p>
          <h1>WOD, 출석, 기록을 한 번에 쌓기</h1>
        </div>
        <div className={styles.goalBox} aria-label="User goal">
          <span>목표</span>
          <strong>84kg / 체지방 8-10% / 골격근량 40kg</strong>
        </div>
      </header>

      <section className={styles.workspace} aria-label="WOD planner workspace">
        <div className={styles.inputColumn}>
          <WodInput label="오늘 운동" value={state.today} onChange={(value) => updateWod("today", value)} />
          <WodInput label="내일 운동" value={state.tomorrow} onChange={(value) => updateWod("tomorrow", value)} />
        </div>

        <aside className={styles.sideColumn}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>최근 통증</h2>
              <span>{Object.values(state.painFlags).filter(Boolean).length}개 체크</span>
            </div>
            <div className={styles.checkGrid}>
              {painOptions.map((option) => (
                <label className={styles.checkTile} key={option.key}>
                  <input
                    checked={state.painFlags[option.key]}
                    type="checkbox"
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        painFlags: { ...current.painFlags, [option.key]: event.target.checked },
                      }))
                    }
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>최근 3일 운동</h2>
              <span>localStorage 저장</span>
            </div>
            <div className={styles.recentList}>
              {state.recentWorkouts.map((entry, index) => (
                <div className={styles.recentRow} key={`${entry.date}-${index}`}>
                  <input
                    aria-label={`최근 운동 ${index + 1} 이름`}
                    value={entry.label}
                    onChange={(event) => updateRecentWorkout(index, { ...entry, label: event.target.value })}
                  />
                  <select
                    aria-label={`최근 운동 ${index + 1} 부하`}
                    value={entry.load}
                    onChange={(event) => updateRecentWorkout(index, { ...entry, load: event.target.value as RecentWorkoutEntry["load"] })}
                  >
                    {loadOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={`최근 운동 ${index + 1} 부위`}
                    value={entry.focus}
                    onChange={(event) => updateRecentWorkout(index, { ...entry, focus: event.target.value as RecentWorkoutEntry["focus"] })}
                  >
                    {focusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className={styles.results} aria-label="Analysis and recommendation">
        <WodAnalysisCard title="오늘 분석" wod={todayWod} />
        <WodAnalysisCard title="내일 분석" wod={tomorrowWod} />
        <WeeklyLoadView fatigue={fatigue} />
        <RecommendationCard recommendation={recommendation} />
      </section>

      <section className={styles.panel} aria-label="Confirmed workout">
        <div className={styles.panelHeader}>
          <h2>운동 확정 / 수행 결과</h2>
          <span>{state.confirmedWorkout ? (state.confirmedWorkout.status === "completed" ? "완료" : "확정됨") : "미확정"}</span>
        </div>
        {state.confirmedWorkout ? (
          <div className={styles.confirmedLayout}>
            <div className={styles.confirmedSummary}>
              <strong>{state.confirmedWorkout.title}</strong>
              <span>
                {state.confirmedWorkout.workoutKind === "hyrox" ? "HYROX" : "WOD"} · {state.confirmedWorkout.date}
              </span>
              {state.confirmedWorkout.recommendationType ? <span>{state.confirmedWorkout.recommendationType}</span> : null}
            </div>
            <div className={styles.resultGrid}>
              <input aria-label="운동 시간" placeholder="시간(분)" value={state.confirmedWorkout.result.durationMinutes} onChange={(event) => updateResult({ durationMinutes: event.target.value })} />
              <input aria-label="칼로리" placeholder="칼로리" value={state.confirmedWorkout.result.calories} onChange={(event) => updateResult({ calories: event.target.value })} />
              <input aria-label="평균 심박" placeholder="평균 심박" value={state.confirmedWorkout.result.avgHeartRate} onChange={(event) => updateResult({ avgHeartRate: event.target.value })} />
              <input aria-label="거리" placeholder="거리(km)" value={state.confirmedWorkout.result.distanceKm} onChange={(event) => updateResult({ distanceKm: event.target.value })} />
            </div>
            <textarea
              aria-label="수행 메모"
              className={styles.resultMemo}
              placeholder="실제 난이도, 통증, 실패/성공 여부 메모"
              value={state.confirmedWorkout.result.notes}
              onChange={(event) => updateResult({ notes: event.target.value })}
            />
            <div className={styles.confirmActions}>
              <button type="button" onClick={completeWorkout}>
                완료 저장
              </button>
              <button type="button" onClick={() => setState((current) => ({ ...current, confirmedWorkout: null }))}>
                확정 취소
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.confirmActions}>
            <button type="button" onClick={() => confirmWorkout("recommendation")}>
              추천대로 확정
            </button>
            <button type="button" onClick={() => confirmWorkout("today-input")}>
              오늘 입력 운동 확정
            </button>
          </div>
        )}
      </section>

      <section className={styles.archiveGrid} aria-label="WOD database">
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>WOD DB 가져오기</h2>
            <span>{state.wodArchive.length}개 저장됨</span>
          </div>
          <div className={styles.inputTools}>
            <div className={styles.segmentedControl} aria-label="import workout type">
              <button className={archiveImportKind === "crossfit" ? styles.segmentActive : undefined} type="button" onClick={() => setArchiveImportKind("crossfit")}>
                WOD
              </button>
              <button className={archiveImportKind === "hyrox" ? styles.segmentActive : undefined} type="button" onClick={() => setArchiveImportKind("hyrox")}>
                HYROX
              </button>
            </div>
          </div>
          <textarea
            aria-label="몇 주치 WOD 붙여넣기"
            className={styles.archiveTextarea}
            placeholder={"여기에 몇 주치 WOD를 붙여넣으세요.\n\n예:\n2026-06-01\nFor time\n400m run\n20 wall balls\n\n2026-06-02\nAMRAP 12\nrow\nburpee"}
            value={archiveImportText}
            onChange={(event) => setArchiveImportText(event.target.value)}
          />
          <div className={styles.confirmActions}>
            <button type="button" disabled={!archiveImportText.trim()} onClick={importArchiveText}>
              DB에 추가
            </button>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>동작 빈도</h2>
            <span>상위 10개</span>
          </div>
          <div className={styles.movementChips}>
            {movementSummary.length > 0 ? movementSummary.map((item) => <span key={item.name}>{item.name} · {item.count}</span>) : <p className={styles.emptyText}>아직 저장된 WOD가 없습니다.</p>}
          </div>
        </article>
      </section>

      <section className={styles.abilityGrid} aria-label="Attendance and records">
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>출석 체크</h2>
            <span>출석률 {attendanceSummary.rate}%</span>
          </div>
          <div className={styles.attendanceList}>
            {recentArchive.length > 0 ? (
              recentArchive.map((entry) => {
                const currentStatus = state.attendanceLog.find((item) => item.date === entry.date)?.status;
                return (
                  <div className={styles.attendanceRow} key={entry.id}>
                    <div>
                      <strong>{entry.date}</strong>
                      <span>{entry.title ?? "WOD"} · {entry.movements.map((movement) => movement.name).join(", ") || "동작 미인식"}</span>
                    </div>
                    <div className={styles.attendanceButtons}>
                      <button className={currentStatus === "attended" ? styles.statusActive : undefined} type="button" onClick={() => setAttendance(entry.date, "attended", entry.id)}>
                        출석
                      </button>
                      <button className={currentStatus === "missed" ? styles.statusActive : undefined} type="button" onClick={() => setAttendance(entry.date, "missed", entry.id)}>
                        결석
                      </button>
                      <button className={currentStatus === "rest" ? styles.statusActive : undefined} type="button" onClick={() => setAttendance(entry.date, "rest", entry.id)}>
                        휴식
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className={styles.emptyText}>WOD DB에 기록을 추가하면 여기서 출석을 체크할 수 있습니다.</p>
            )}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>내 기록 매핑</h2>
            <span>{state.personalRecords.length}개 기록</span>
          </div>
          <div className={styles.recordForm}>
            <input aria-label="기록 날짜" type="date" value={recordDraft.date} onChange={(event) => setRecordDraft((current) => ({ ...current, date: event.target.value }))} />
            <input aria-label="동작명" placeholder="동작명 예: clean" value={recordDraft.movement} onChange={(event) => setRecordDraft((current) => ({ ...current, movement: event.target.value }))} />
            <input aria-label="기록값" placeholder="기록값 예: 95" value={recordDraft.value} onChange={(event) => setRecordDraft((current) => ({ ...current, value: event.target.value }))} />
            <select aria-label="단위" value={recordDraft.unit} onChange={(event) => setRecordDraft((current) => ({ ...current, unit: event.target.value as PersonalRecord["unit"] }))}>
              {recordUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
            </select>
            <input aria-label="기록 메모" placeholder="메모" value={recordDraft.notes ?? ""} onChange={(event) => setRecordDraft((current) => ({ ...current, notes: event.target.value }))} />
            <button type="button" onClick={addPersonalRecord}>기록 추가</button>
          </div>
          <div className={styles.recordList}>
            {state.personalRecords.slice(0, 8).map((record) => (
              <div className={styles.recordItem} key={record.id}>
                <strong>{record.movement}</strong>
                <span>{record.value} {record.unit} · {record.date}</span>
                {record.notes ? <small>{record.notes}</small> : null}
              </div>
            ))}
          </div>
        </article>

        <article className={[styles.panel, styles.abilityPanel].join(" ")}>
          <div className={styles.panelHeader}>
            <h2>능력치 요약</h2>
            <span>임시 스코어</span>
          </div>
          <div className={styles.abilityList}>
            {abilityScores.map((ability) => (
              <div className={styles.abilityRow} key={ability.label}>
                <div>
                  <strong>{ability.label}</strong>
                  <span>{ability.detail}</span>
                </div>
                <div className={styles.loadTrack}>
                  <div className={styles.loadBar} style={{ width: `${ability.score}%` }} />
                </div>
                <b>{ability.score}</b>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.panel} aria-label="Saved WOD list">
        <div className={styles.panelHeader}>
          <h2>저장된 WOD</h2>
          <span>결과와 출석을 같은 날짜에 매핑</span>
        </div>
        <div className={styles.archiveList}>
          {state.wodArchive.slice(0, 12).map((entry) => (
            <div className={styles.archiveItem} key={entry.id}>
              <strong>{entry.title ?? entry.date}</strong>
              <span>{entry.date} · {entry.workoutKind === "hyrox" ? "HYROX" : "WOD"} · 강도 {entry.estimatedIntensity}/5</span>
              <small>{entry.movements.map((movement) => movement.name).join(", ") || "동작 미인식"}</small>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
