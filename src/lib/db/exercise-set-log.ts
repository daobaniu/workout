import { prisma } from "@/lib/db/prisma";

export type SetLogInput = {
  exerciseId: string;
  exerciseName: string;
  setIndex?: number;
  reps: number;
  weightKg?: number | null;
  rpe?: number | null;
};

export type ExerciseSetLogRow = {
  id: string;
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  setIndex: number;
  reps: number;
  weightKg: number | null;
  rpe: number | null;
  createdAt: Date;
};

export type ExercisePerformance = {
  exerciseId: string;
  exerciseName: string;
  reps: number;
  weightKg: number | null;
  rpe: number | null;
  setIndex: number;
  date: Date;
  sessionId: string;
};

/**
 * IDE 偶发缓存旧 PrismaClient（无 exerciseSetLog）；
 * 运行时与 tsc 用的生成客户端已有该 delegate，这里做窄化访问。
 */
type ExerciseSetLogDelegate = {
  deleteMany: (args: {
    where: { sessionId: string };
  }) => Promise<{ count: number }>;
  createMany: (args: {
    data: Array<{
      sessionId: string;
      exerciseId: string;
      exerciseName: string;
      setIndex: number;
      reps: number;
      weightKg: number | null;
      rpe: number | null;
    }>;
  }) => Promise<{ count: number }>;
  findMany: (args: {
    where: { sessionId: string };
    orderBy: Array<Record<string, "asc" | "desc">>;
  }) => Promise<ExerciseSetLogRow[]>;
  findFirst: (args: {
    where: {
      exerciseId: string;
      session: { completed: boolean };
    };
    orderBy: Array<Record<string, "asc" | "desc">>;
    include: { session: { select: { id: true; date: true } } };
  }) => Promise<
    | (ExerciseSetLogRow & {
        session: { id: string; date: Date };
      })
    | null
  >;
};

function exerciseSetLog(): ExerciseSetLogDelegate {
  return (prisma as unknown as { exerciseSetLog: ExerciseSetLogDelegate })
    .exerciseSetLog;
}

export const exerciseSetLogRepository = {
  async replaceForSession(sessionId: string, sets: SetLogInput[]) {
    const db = exerciseSetLog();
    await db.deleteMany({ where: { sessionId } });
    if (!sets.length) return [] as ExerciseSetLogRow[];
    await db.createMany({
      data: sets.map((s, i) => ({
        sessionId,
        exerciseId: s.exerciseId,
        exerciseName: s.exerciseName,
        setIndex: s.setIndex ?? i + 1,
        reps: Math.max(0, Math.round(s.reps)),
        weightKg: s.weightKg ?? null,
        rpe: s.rpe ?? null,
      })),
    });
    return db.findMany({
      where: { sessionId },
      orderBy: [{ exerciseId: "asc" }, { setIndex: "asc" }],
    });
  },

  async listBySession(sessionId: string) {
    return exerciseSetLog().findMany({
      where: { sessionId },
      orderBy: [{ exerciseId: "asc" }, { setIndex: "asc" }],
    });
  },

  /** 最近一次同动作有效负荷（优先有重量的顶组） */
  async getLastPerformance(
    exerciseId: string,
  ): Promise<ExercisePerformance | null> {
    const row = await exerciseSetLog().findFirst({
      where: {
        exerciseId,
        session: { completed: true },
      },
      orderBy: [{ createdAt: "desc" }, { setIndex: "desc" }],
      include: { session: { select: { id: true, date: true } } },
    });
    if (!row) return null;
    return {
      exerciseId: row.exerciseId,
      exerciseName: row.exerciseName,
      reps: row.reps,
      weightKg: row.weightKg,
      rpe: row.rpe,
      setIndex: row.setIndex,
      date: row.session.date,
      sessionId: row.session.id,
    };
  },

  async getLastPerformances(
    exerciseIds: string[],
  ): Promise<Map<string, ExercisePerformance>> {
    const map = new Map<string, ExercisePerformance>();
    const unique = [...new Set(exerciseIds.filter(Boolean))];
    await Promise.all(
      unique.map(async (id) => {
        const p = await this.getLastPerformance(id);
        if (p) map.set(id, p);
      }),
    );
    return map;
  },
};
