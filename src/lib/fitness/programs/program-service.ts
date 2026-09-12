import { endOfDay, startOfDay, startOfMonth, endOfMonth } from "date-fns";
import type { Prisma } from "@prisma/client";
import {
  checkInRepository,
  programRepository,
  workoutSessionRepository,
} from "@/lib/db/program-repository";
import { prisma } from "@/lib/db/prisma";
import {
  exerciseSetLogRepository,
  type SetLogInput,
} from "@/lib/db/exercise-set-log";
import { attachOverloadToExercises } from "@/lib/fitness/overload";
import {
  estimateWorkoutCalories,
  inferIntensity,
} from "@/lib/fitness/workout-calories";
import { getBuiltinProgram, listBuiltinPrograms } from "./builtin";
import { buildResolvedWorkout, resolveCycleDayIndex, toDateKey } from "./cycle";
import type {
  ProgramDraft,
  ProgramExercise,
  ResolvedTodayWorkout,
  TrainingPlace,
} from "./types";

async function getWeightKg() {
  const profile = await prisma.profile.findUnique({ where: { id: "local" } });
  return profile?.weightKg ?? 65;
}

/** 用户已保存计划（含日课表） */
export type UserProgramWithDays = Prisma.TrainingProgramGetPayload<{
  include: { days: true };
}>;

/** 今日训练会话摘要 */
export type TodaySessionSummary = {
  id: string;
  title: string;
  completed: boolean;
  caloriesBurned: number | null;
  durationMin: number | null;
  exercises: ProgramExercise[];
};

export type ProgramAwareTodaySlice = {
  activeProgram: {
    id: string;
    name: string;
    splitType: string;
    place: string;
    dayCount: number;
  } | null;
  todayPlan: ResolvedTodayWorkout | null;
  checkedIn: boolean;
  checkIn: {
    dateKey: string;
    note: string | null;
    workoutSessionId: string | null;
  } | null;
  sessions: TodaySessionSummary[];
};

/**
 * 训练计划应用服务：编排仓储与领域规则（与 Prisma 解耦，便于测试）。
 */
export const programService = {
  listBuiltin(place?: TrainingPlace) {
    return listBuiltinPrograms(place ?? "gym");
  },

  async listUserPrograms(): Promise<UserProgramWithDays[]> {
    return programRepository.listPrograms();
  },

  async adoptBuiltin(key: string, place?: TrainingPlace, activate = true) {
    const draft = getBuiltinProgram(key, place ?? "gym");
    if (!draft) {
      throw new Error(`未找到内置计划：${key}`);
    }
    return programRepository.createFromDraft(draft, activate);
  },

  async createCustom(draft: ProgramDraft, activate = true) {
    const normalized: ProgramDraft = {
      ...draft,
      source: draft.source ?? "custom",
      days: draft.days.map((d, i) => ({
        ...d,
        dayIndex: d.dayIndex ?? i,
      })),
    };
    return programRepository.createFromDraft(normalized, activate);
  },

  async updateCustom(id: string, draft: ProgramDraft, activate?: boolean) {
    const normalized: ProgramDraft = {
      ...draft,
      source: draft.source ?? "custom",
      days: draft.days.map((d, i) => ({
        ...d,
        dayIndex: d.dayIndex ?? i,
      })),
    };
    return programRepository.updateFromDraft(id, normalized, activate);
  },

  async activate(id: string) {
    return programRepository.activate(id);
  },

  async delete(id: string) {
    return programRepository.delete(id);
  },

  async resolveToday(today = new Date()): Promise<
    (ResolvedTodayWorkout & { overloadTips?: string[] }) | null
  > {
    const active = await programRepository.getActive();
    if (!active || active.days.length === 0) return null;

    const startedAt = active.startedAt ?? active.createdAt;
    const dayIndex = resolveCycleDayIndex(startedAt, active.days.length, today);
    const day = active.days.find((d) => d.dayIndex === dayIndex) ?? active.days[0];

    const base = buildResolvedWorkout({
      programId: active.id,
      programName: active.name,
      day,
    });
    if (base.isRestDay) return { ...base, overloadTips: [] };

    const { exercises, tips } = await attachOverloadToExercises(base.exercises);
    const profile = await prisma.profile.findUnique({ where: { id: "local" } });
    const overloadTips = [...tips];
    if (profile?.injuryNotes?.trim()) {
      overloadTips.push(`伤病注意：${profile.injuryNotes.trim()}，不适即停`);
    }
    return { ...base, exercises, overloadTips };
  },

  /**
   * 按今日计划开练：创建 WorkoutSession，可选自动打卡。
   */
  async startTodaySession(opts?: {
    durationMin?: number;
    checkIn?: boolean;
    notes?: string;
  }) {
    const todayPlan = await this.resolveToday();
    if (!todayPlan) {
      throw new Error("当前没有激活的训练计划");
    }
    if (todayPlan.isRestDay) {
      throw new Error("今日为休息日");
    }

    const duration = opts?.durationMin ?? todayPlan.estimatedMin;
    const hasCompound = todayPlan.exercises.some((e) =>
      /蹲|硬拉|卧推|推举|dead|squat|bench|press/i.test(e.name + e.exerciseId),
    );
    const caloriesBurned = estimateWorkoutCalories({
      weightKg: await getWeightKg(),
      durationMin: duration,
      intensity: inferIntensity(todayPlan.exercises.length, hasCompound),
    });

    const session = await workoutSessionRepository.create({
      title: todayPlan.title,
      exercises: todayPlan.exercises,
      programId: todayPlan.programId,
      programDayId: todayPlan.programDayId,
      durationMin: duration,
      caloriesBurned,
      completed: false,
      notes: opts?.notes,
    });

    let checkIn = null;
    if (opts?.checkIn !== false) {
      checkIn = await checkInRepository.upsert({
        dateKey: toDateKey(),
        workoutSessionId: session.id,
        note: opts?.notes,
      });
    }

    return {
      session,
      todayPlan,
      checkIn,
      caloriesBurned,
      overloadTips: todayPlan.overloadTips ?? [],
    };
  },

  async completeSession(
    sessionId: string,
    opts?: {
      durationMin?: number;
      weightKg?: number;
      setLogs?: SetLogInput[];
    },
  ) {
    let caloriesBurned: number | undefined;
    if (opts?.durationMin != null) {
      caloriesBurned = estimateWorkoutCalories({
        weightKg: opts.weightKg ?? (await getWeightKg()),
        durationMin: opts.durationMin,
      });
    }
    const session = await workoutSessionRepository.complete(sessionId, {
      durationMin: opts?.durationMin,
      caloriesBurned,
    });
    if (opts?.setLogs?.length) {
      await exerciseSetLogRepository.replaceForSession(sessionId, opts.setLogs);
    }
    await checkInRepository.upsert({
      dateKey: toDateKey(session.date),
      workoutSessionId: session.id,
    });
    return session;
  },

  async estimateBurn(input: {
    durationMin: number;
    exerciseCount?: number;
    weightKg?: number;
  }) {
    return estimateWorkoutCalories({
      weightKg: input.weightKg ?? (await getWeightKg()),
      durationMin: input.durationMin,
      intensity: inferIntensity(input.exerciseCount ?? 5, true),
    });
  },
};

export const checkInService = {
  async getToday() {
    return checkInRepository.getByDateKey(toDateKey());
  },

  async checkIn(note?: string, workoutSessionId?: string) {
    return checkInRepository.upsert({
      dateKey: toDateKey(),
      note,
      workoutSessionId,
    });
  },

  async undo(dateKey?: string) {
    return checkInRepository.remove(dateKey ?? toDateKey());
  },

  async monthCalendar(year: number, month: number) {
    const anchor = new Date(year, month - 1, 1);
    const from = startOfMonth(anchor);
    const to = endOfMonth(anchor);
    const fromKey = toDateKey(from);
    const toKey = toDateKey(to);
    const [checkIns, sessions] = await Promise.all([
      checkInRepository.listBetween(fromKey, toKey),
      workoutSessionRepository.listByDateRange(from, to),
    ]);
    return { fromKey, toKey, checkIns, sessions };
  },
};

export async function getProgramAwareTodaySlice(
  date = new Date(),
): Promise<ProgramAwareTodaySlice> {
  const [activeProgram, todayPlan, checkIn, sessions] = await Promise.all([
    programRepository.getActive(),
    programService.resolveToday(date),
    checkInRepository.getByDateKey(toDateKey(date)),
    workoutSessionRepository.listToday(date, startOfDay(date), endOfDay(date)),
  ]);

  return {
    activeProgram: activeProgram
      ? {
          id: activeProgram.id,
          name: activeProgram.name,
          splitType: activeProgram.splitType,
          place: activeProgram.place,
          dayCount: activeProgram.days.length,
        }
      : null,
    todayPlan,
    checkedIn: Boolean(checkIn),
    checkIn: checkIn
      ? {
          dateKey: checkIn.dateKey,
          note: checkIn.note,
          workoutSessionId: checkIn.workoutSessionId,
        }
      : null,
    sessions: sessions.map((s) => ({
      id: s.id,
      title: s.title,
      completed: s.completed,
      caloriesBurned: s.caloriesBurned,
      durationMin: s.durationMin,
      exercises: JSON.parse(s.exercisesJson) as ProgramExercise[],
    })),
  };
}
