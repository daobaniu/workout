import { prisma } from "./prisma";
import type { ProgramDraft } from "@/lib/fitness/programs/types";

/**
 * 训练计划仓储：只做持久化，不含业务规则（SRP）。
 */
export const programRepository = {
  async listPrograms() {
    return prisma.trainingProgram.findMany({
      include: { days: { orderBy: { dayIndex: "asc" } } },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    });
  },

  async getById(id: string) {
    return prisma.trainingProgram.findUnique({
      where: { id },
      include: { days: { orderBy: { dayIndex: "asc" } } },
    });
  },

  async getActive() {
    return prisma.trainingProgram.findFirst({
      where: { isActive: true },
      include: { days: { orderBy: { dayIndex: "asc" } } },
    });
  },

  async createFromDraft(draft: ProgramDraft, activate: boolean) {
    if (activate) {
      await prisma.trainingProgram.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    return prisma.trainingProgram.create({
      data: {
        name: draft.name,
        source: draft.source,
        splitType: draft.splitType,
        place: draft.place,
        notes: draft.notes,
        isActive: activate,
        startedAt: activate ? new Date() : null,
        days: {
          create: draft.days.map((d) => ({
            dayIndex: d.dayIndex,
            name: d.name,
            focus: d.focus,
            estimatedMin: d.estimatedMin,
            exercisesJson: JSON.stringify(d.exercises),
          })),
        },
      },
      include: { days: { orderBy: { dayIndex: "asc" } } },
    });
  },

  async activate(id: string) {
    await prisma.trainingProgram.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
    return prisma.trainingProgram.update({
      where: { id },
      data: { isActive: true, startedAt: new Date() },
      include: { days: { orderBy: { dayIndex: "asc" } } },
    });
  },

  async deactivateAll() {
    return prisma.trainingProgram.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
  },

  async delete(id: string) {
    return prisma.trainingProgram.delete({ where: { id } });
  },

  /** 用新课表覆盖已有计划（自建编辑） */
  async updateFromDraft(id: string, draft: ProgramDraft, activate?: boolean) {
    const existing = await prisma.trainingProgram.findUnique({ where: { id } });
    if (!existing) throw new Error("计划不存在");

    if (activate) {
      await prisma.trainingProgram.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    await prisma.programDay.deleteMany({ where: { programId: id } });

    return prisma.trainingProgram.update({
      where: { id },
      data: {
        name: draft.name,
        source: draft.source ?? existing.source,
        splitType: draft.splitType,
        place: draft.place,
        notes: draft.notes,
        ...(activate
          ? { isActive: true, startedAt: new Date() }
          : {}),
        days: {
          create: draft.days.map((d) => ({
            dayIndex: d.dayIndex,
            name: d.name,
            focus: d.focus,
            estimatedMin: d.estimatedMin,
            exercisesJson: JSON.stringify(d.exercises),
          })),
        },
      },
      include: { days: { orderBy: { dayIndex: "asc" } } },
    });
  },
};

export const workoutSessionRepository = {
  async create(input: {
    title: string;
    exercises: unknown;
    programId?: string;
    programDayId?: string;
    durationMin?: number;
    caloriesBurned?: number;
    completed?: boolean;
    notes?: string;
    date?: Date;
  }) {
    return prisma.workoutSession.create({
      data: {
        title: input.title,
        exercisesJson: JSON.stringify(input.exercises),
        programId: input.programId,
        programDayId: input.programDayId,
        durationMin: input.durationMin,
        caloriesBurned: input.caloriesBurned,
        completed: input.completed ?? false,
        notes: input.notes,
        date: input.date,
      },
    });
  },

  async complete(id: string, patch?: { durationMin?: number; caloriesBurned?: number }) {
    return prisma.workoutSession.update({
      where: { id },
      data: {
        completed: true,
        ...(patch?.durationMin != null ? { durationMin: patch.durationMin } : {}),
        ...(patch?.caloriesBurned != null
          ? { caloriesBurned: patch.caloriesBurned }
          : {}),
      },
    });
  },

  async listByDateRange(from: Date, to: Date) {
    return prisma.workoutSession.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: { date: "desc" },
    });
  },

  async listToday(date: Date, start: Date, end: Date) {
    return prisma.workoutSession.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: "desc" },
    });
  },

  async getById(id: string) {
    return prisma.workoutSession.findUnique({ where: { id } });
  },

  async delete(id: string) {
    return prisma.workoutSession.delete({ where: { id } });
  },
};

export const checkInRepository = {
  async getByDateKey(dateKey: string) {
    return prisma.checkIn.findUnique({
      where: { dateKey },
      include: { workoutSession: true },
    });
  },

  async listBetween(fromKey: string, toKey: string) {
    return prisma.checkIn.findMany({
      where: { dateKey: { gte: fromKey, lte: toKey } },
      include: { workoutSession: true },
      orderBy: { dateKey: "asc" },
    });
  },

  async upsert(input: {
    dateKey: string;
    note?: string;
    workoutSessionId?: string | null;
  }) {
    return prisma.checkIn.upsert({
      where: { dateKey: input.dateKey },
      create: {
        dateKey: input.dateKey,
        note: input.note,
        workoutSessionId: input.workoutSessionId ?? undefined,
      },
      update: {
        note: input.note,
        ...(input.workoutSessionId !== undefined
          ? { workoutSessionId: input.workoutSessionId }
          : {}),
      },
      include: { workoutSession: true },
    });
  },

  async remove(dateKey: string) {
    return prisma.checkIn.delete({ where: { dateKey } });
  },
};
