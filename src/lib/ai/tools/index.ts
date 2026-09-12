import { tool } from "ai";
import { z } from "zod";
import {
  completeWorkout,
  getProfile,
  getTodayNutrition,
  logFood,
  logWeight,
  saveWorkout,
  updateFood,
  upsertProfile,
} from "@/lib/db/queries";
import {
  logFoodInputSchema,
  rememberPreferencesInputSchema,
  completeProgramSessionSetLogSchema,
} from "@/lib/ai/tool-input-schemas";
import {
  resolveFoodLogEstimate,
  scoreFoodLogConfidence,
  searchFoodCatalog,
} from "@/lib/fitness/foods";
import { suggestDailyMeals } from "@/lib/fitness/meals";
import {
  buildPreferenceNote,
  inferPlaceFromEquipmentPref,
  mergePreferenceField,
} from "@/lib/fitness/preferences";
import {
  checkInService,
  programService,
  type UserProgramWithDays,
} from "@/lib/fitness/programs";
import { suggestWorkoutPlanWithHistory } from "@/lib/fitness/templates";
import { searchWeb } from "./web-search";

/** Prisma Date 等不能直接进入 ModelMessage，需转成 JSON 安全结构 */
function toJsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const fitnessTools = {
  getProfile: tool({
    description:
      "读取用户档案（身高体重、目标模式 cut/maintain/bulk、热量预算、训练场所等）",
    inputSchema: z.object({}),
    execute: async () => {
      const profile = await getProfile();
      if (!profile) {
        return {
          exists: false as const,
          message: "尚未建档，请先收集用户基本信息并调用 upsertProfile",
        };
      }
      return toJsonSafe({ exists: true as const, profile });
    },
  }),

  upsertProfile: tool({
    description:
      "创建或更新用户档案。目标模式 goalMode：cut=减脂、maintain=维持、bulk=增肌，会改变热量缺口/盈余策略。若用户不知道热量预算，可根据身高体重年龄性别活动量与目标模式让系统估算。训练经验 experienceLevel 影响计划页信息密度与推荐偏好。",
    inputSchema: z.object({
      heightCm: z.number().optional().describe("身高 cm"),
      weightKg: z.number().optional().describe("当前体重 kg"),
      targetWeightKg: z.number().optional().describe("目标体重 kg"),
      sex: z.enum(["male", "female"]).optional().describe("性别"),
      age: z.number().int().optional().describe("年龄"),
      activityLevel: z
        .enum(["sedentary", "light", "moderate", "active"])
        .optional()
        .describe("日常活动量"),
      goalMode: z
        .enum(["cut", "maintain", "bulk"])
        .optional()
        .describe("目标：cut减脂 / maintain维持 / bulk增肌"),
      dailyCalorieGoal: z
        .number()
        .int()
        .optional()
        .describe("每日热量预算 kcal；不知道可不传，由服务端按目标模式估算"),
      trainingPlace: z.enum(["home", "gym"]).optional().describe("训练场所"),
      daysPerWeek: z
        .number()
        .int()
        .min(1)
        .max(7)
        .optional()
        .describe("每周可练天数"),
      experienceLevel: z
        .enum(["beginner", "intermediate"])
        .optional()
        .describe(
          "训练经验：beginner=小白（多引导少选择）；intermediate=有基础（可看全方案/自建）",
        ),
      dailyProteinGoal: z
        .number()
        .int()
        .optional()
        .describe("每日蛋白质目标 g；不传则按目标模式与体重自动估算"),
      dietRestrictions: z
        .string()
        .optional()
        .describe("忌口，如不吃牛肉、海鲜过敏"),
      injuryNotes: z
        .string()
        .optional()
        .describe("伤病规避，如膝盖不适避免跳跃"),
      equipmentPref: z
        .string()
        .optional()
        .describe("器械偏好，如只有哑铃、偏好器械"),
      notes: z.string().optional().describe("其他备注"),
    }),
    execute: async (input) => {
      const profile = await upsertProfile(input);
      return toJsonSafe({ ok: true as const, profile });
    },
  }),

  rememberPreferences: tool({
    description:
      "长期画像：把用户口头偏好写入档案并合并去重（不覆盖旧忌口）。用户说「不吃牛肉」「海鲜过敏」「膝盖不好少跳跃」「只有哑铃」时必须调用。mode 默认 append；改口用 replace；取消某类用 clear。",
    inputSchema: rememberPreferencesInputSchema,
    execute: async (input) => {
      const existing = await getProfile();
      const mode = input.mode ?? "append";
      const patch: {
        dietRestrictions?: string;
        injuryNotes?: string;
        equipmentPref?: string;
        notes?: string;
      } = {};

      const apply = (
        key: keyof typeof patch,
        incoming: string | undefined,
        current: string | null | undefined,
      ) => {
        if (incoming === undefined) return;
        if (mode === "clear") {
          patch[key] = "";
          return;
        }
        patch[key] =
          mergePreferenceField(current, incoming, mode) ?? "";
      };

      apply("dietRestrictions", input.dietRestrictions, existing?.dietRestrictions);
      apply("injuryNotes", input.injuryNotes, existing?.injuryNotes);
      apply("equipmentPref", input.equipmentPref, existing?.equipmentPref);
      apply("notes", input.notes, existing?.notes);

      if (!Object.keys(patch).length) {
        return toJsonSafe({
          ok: false as const,
          message: "未提供可写入的偏好字段",
        });
      }

      const profile = await upsertProfile(patch);
      return toJsonSafe({
        ok: true as const,
        profile: {
          dietRestrictions: profile.dietRestrictions,
          injuryNotes: profile.injuryNotes,
          equipmentPref: profile.equipmentPref,
          notes: profile.notes,
        },
        preferenceNote: buildPreferenceNote(profile),
        message: "偏好已写入档案，之后推餐/推练会自动参考。",
      });
    },
  }),

  lookupFood: tool({
    description:
      "查本地中式食物库（含螺蛳粉、奶茶、麻辣烫等高热量项）。记餐前可先查；logFood 内也会自动查库覆盖。",
    inputSchema: z.object({
      query: z.string().describe("食物名或关键词，如螺蛳粉、鸡胸"),
    }),
    execute: async ({ query }) => {
      const items = searchFoodCatalog(query, 10).map((f) => ({
        id: f.id,
        name: f.name,
        servingLabel: f.servingLabel,
        calories: f.serving.calories,
        proteinG: f.serving.proteinG,
        carbsG: f.serving.carbsG,
        fatG: f.serving.fatG,
        highCal: f.tags?.includes("high_cal") ?? false,
        note: f.note ?? null,
      }));
      return toJsonSafe({
        ok: true as const,
        count: items.length,
        items,
        tip:
          items.length === 0
            ? "未找到，记餐时由模型估算，或换常见叫法再查"
            : "高热量项务必按库内一份估算，勿故意低估",
      });
    },
  }),

  logFood: tool({
    description:
      "记录一餐饮食。传入估算与 proteinG。命中食物库会覆盖数值。低置信时不会静默写入，需 confirmed=true 用户确认后再记。",
    inputSchema: logFoodInputSchema,
    execute: async (input) => {
      const resolved = resolveFoodLogEstimate(input);
      const confidence = scoreFoodLogConfidence({
        description: resolved.description,
        calories: resolved.calories,
        proteinG: resolved.proteinG,
        carbsG: resolved.carbsG,
        fatG: resolved.fatG,
        source: resolved.source,
        lookup: resolved.lookup,
      });

      const draft = {
        description: resolved.description,
        calories: resolved.calories,
        proteinG: resolved.proteinG,
        carbsG: resolved.carbsG,
        fatG: resolved.fatG,
        source: resolved.source,
      };

      if (confidence.needsConfirm && input.confirmed !== true) {
        return toJsonSafe({
          ok: false as const,
          needsConfirm: true as const,
          confidence,
          draft,
          fromFoodDb: resolved.lookup.matched,
          foodDbDetail: resolved.lookup.detail,
          warnings: [
            ...resolved.lookup.warnings,
            "置信度偏低，请用户确认热量/宏量后再写入",
          ],
          message:
            "未写入。请展示草稿让用户确认或修改后，再以 confirmed=true 调用 logFood。",
        });
      }

      const entry = await logFood({
        ...draft,
        source:
          confidence.needsConfirm && input.confirmed
            ? `${draft.source}|confirmed`
            : draft.source,
      });
      const today = await getTodayNutrition();
      return toJsonSafe({
        ok: true as const,
        entry,
        today,
        confidence,
        fromFoodDb: resolved.lookup.matched,
        foodDbDetail: resolved.lookup.detail,
        warnings: resolved.lookup.warnings,
      });
    },
  }),

  updateFood: tool({
    description:
      "修正已记录饮食的描述/热量/蛋白等。用户说估错了、改成某某热量时调用。",
    inputSchema: z.object({
      id: z.string().describe("饮食记录 id"),
      description: z.string().optional(),
      calories: z.number().int().optional(),
      proteinG: z.number().nullable().optional(),
      carbsG: z.number().nullable().optional(),
      fatG: z.number().nullable().optional(),
    }),
    execute: async (input) => {
      const { id, ...patch } = input;
      const entry = await updateFood(id, patch);
      const today = await getTodayNutrition();
      return toJsonSafe({ ok: true as const, entry, today });
    },
  }),

  getTodayNutrition: tool({
    description: "查询今日已摄入热量/蛋白与剩余预算（含 proteinGoal）",
    inputSchema: z.object({}),
    execute: async () => toJsonSafe(await getTodayNutrition()),
  }),

  listTrainingPrograms: tool({
    description:
      "列出内置训练分化（如推拉腿 PPL）与用户已保存计划，以及当前激活计划。用户说想练推拉腿/固定分化时先用这个。",
    inputSchema: z.object({
      place: z.enum(["home", "gym"]).optional(),
    }),
    execute: async ({ place }) => {
      const profile = await getProfile();
      const resolvedPlace =
        place ?? (profile?.trainingPlace === "gym" ? "gym" : "home");
      const builtin = programService.listBuiltin(resolvedPlace);
      const programs = await programService.listUserPrograms();
      const todayPlan = await programService.resolveToday();
      return toJsonSafe({
        place: resolvedPlace,
        builtin: builtin.map((p) => ({
          key: p.key,
          name: p.name,
          splitType: p.splitType,
          dayCount: p.days.length,
          notes: p.notes,
          days: p.days.map((d) => ({
            name: d.name,
            estimatedMin: d.estimatedMin,
            exercises: d.exercises.map((e) => `${e.name} ${e.sets}×${e.reps}`),
          })),
        })),
        programs: programs.map((p: UserProgramWithDays) => ({
          id: p.id,
          name: p.name,
          source: p.source,
          isActive: p.isActive,
          splitType: p.splitType,
          dayCount: p.days.length,
        })),
        todayPlan,
      });
    },
  }),

  adoptBuiltinProgram: tool({
    description:
      "启用内置计划。居家：home_fullbody_3 / home_express / home_push_pull_core / home_upper_lower / home_dumbbell_3；健身房：gym_ppl / gym_fullbody_3 / gym_upper_lower。会写入并默认激活。档案为居家时优先推 home_*。",
    inputSchema: z.object({
      key: z
        .string()
        .describe(
          "内置 key，如 home_fullbody_3、home_express、gym_ppl",
        ),
      place: z.enum(["home", "gym"]).optional(),
      activate: z.boolean().optional().describe("默认 true"),
    }),
    execute: async ({ key, place, activate }) => {
      const program = await programService.adoptBuiltin(
        key,
        place,
        activate !== false,
      );
      const todayPlan = await programService.resolveToday();
      return toJsonSafe({ ok: true as const, program, todayPlan });
    },
  }),

  createCustomProgram: tool({
    description:
      "按用户口述创建自定义多日训练计划并激活。days 为数组，每天含 name 与 exercises。",
    inputSchema: z.object({
      name: z.string(),
      place: z.enum(["home", "gym"]).optional(),
      notes: z.string().optional(),
      days: z.array(
        z.object({
          name: z.string(),
          focus: z.string().optional(),
          estimatedMin: z.number().int().optional(),
          exercises: z.array(
            z.object({
              name: z.string(),
              sets: z.number().int().default(3),
              reps: z.string().default("8-12"),
              exerciseId: z.string().optional(),
              notes: z.string().optional(),
            }),
          ),
        }),
      ),
    }),
    execute: async (input) => {
      const program = await programService.createCustom(
        {
          name: input.name,
          source: "ai",
          splitType: "custom",
          place: input.place ?? "gym",
          notes: input.notes,
          days: input.days.map((d, dayIndex) => ({
            dayIndex,
            name: d.name,
            focus: d.focus,
            estimatedMin: d.estimatedMin ?? Math.max(30, d.exercises.length * 8),
            exercises: d.exercises.map((e) => ({
              exerciseId: e.exerciseId ?? e.name,
              name: e.name,
              sets: e.sets,
              reps: e.reps,
              notes: e.notes,
            })),
          })),
        },
        true,
      );
      return toJsonSafe({
        ok: true as const,
        program,
        todayPlan: await programService.resolveToday(),
      });
    },
  }),

  getTodayProgramWorkout: tool({
    description: "解析当前激活计划下「今天该练哪一天」的课表",
    inputSchema: z.object({}),
    execute: async () => {
      const todayPlan = await programService.resolveToday();
      if (!todayPlan) {
        return {
          exists: false as const,
          message:
            "没有激活的训练计划，可先 adoptBuiltinProgram 或 createCustomProgram",
        };
      }
      return toJsonSafe({ exists: true as const, todayPlan });
    },
  }),

  startProgramWorkout: tool({
    description:
      "按今日计划开练：创建训练会话、估算消耗热量，并默认打卡。用户说「按计划练」「开始今天的推日」时用。",
    inputSchema: z.object({
      durationMin: z.number().int().optional(),
      checkIn: z.boolean().optional().describe("默认 true"),
      notes: z.string().optional(),
    }),
    execute: async (input) => {
      try {
        const result = await programService.startTodaySession(input);
        return toJsonSafe({ ok: true as const, ...result });
      } catch (error) {
        return {
          ok: false as const,
          error: error instanceof Error ? error.message : "开练失败",
        };
      }
    },
  }),

  completeProgramSession: tool({
    description:
      "将某次计划训练会话标记完成，并更新消耗与打卡。可附带各组实际次数/重量/RPE。",
    inputSchema: z.object({
      sessionId: z.string(),
      durationMin: z.number().int().optional(),
      setLogs: z
        .array(completeProgramSessionSetLogSchema)
        .optional()
        .describe("实际完成的组数据，供下次渐进超负荷"),
    }),
    execute: async ({ sessionId, durationMin, setLogs }) => {
      const session = await programService.completeSession(sessionId, {
        durationMin,
        setLogs,
      });
      return toJsonSafe({ ok: true as const, session });
    },
  }),

  checkInToday: tool({
    description: "今日训练打卡（可不关联具体会话）。用户说「打卡了」时用。",
    inputSchema: z.object({
      note: z.string().optional(),
      workoutSessionId: z.string().optional(),
    }),
    execute: async ({ note, workoutSessionId }) => {
      const checkIn = await checkInService.checkIn(note, workoutSessionId);
      return toJsonSafe({ ok: true as const, checkIn });
    },
  }),

  suggestWorkout: tool({
    description:
      "基于本地训练模板生成今日课表（临时推课）。会附带上次同动作负荷与今日建议（若有历史）。focus=cardio 推有氧。",
    inputSchema: z.object({
      place: z.enum(["home", "gym"]).optional(),
      minutes: z.number().int().optional().describe("可用分钟数"),
      lazy: z.boolean().optional().describe("偷懒精简版"),
      focus: z
        .enum(["full", "push", "pull", "legs", "cardio"])
        .optional()
        .describe("cardio=有氧；其余为力量分化"),
      save: z
        .boolean()
        .optional()
        .describe("是否写入今日训练日志，默认 true"),
    }),
    execute: async (input) => {
      const profile = await getProfile();
      const placeFallback =
        profile?.trainingPlace === "gym" ? "gym" : "home";
      const plan = await suggestWorkoutPlanWithHistory({
        place:
          input.place ??
          inferPlaceFromEquipmentPref(
            profile?.equipmentPref,
            placeFallback,
          ),
        minutes: input.minutes,
        daysPerWeek: profile?.daysPerWeek,
        lazy: input.lazy,
        focus: input.focus,
        injuryNotes: profile?.injuryNotes,
      });

      const pref = buildPreferenceNote(profile);
      if (pref) {
        plan.tips = [...(plan.tips ?? []), `档案偏好：${pref}`];
      }

      let workoutId: string | undefined;
      if (input.save !== false) {
        const saved = await saveWorkout({
          templateId: plan.templateId,
          title: plan.title,
          exercises: plan.exercises,
          notes: plan.tips.join("；"),
          completed: false,
        });
        workoutId = saved.id;
      }

      return toJsonSafe({ ok: true as const, workoutId, plan });
    },
  }),

  suggestDailyMeals: tool({
    description:
      "按今日剩余热量与剩余蛋白质推荐一日三餐。点子来自本地食物库组合，卡片可一键记入。",
    inputSchema: z.object({
      preferenceNote: z.string().optional().describe("饮食偏好，如少油、素食"),
      remainingCalories: z
        .number()
        .int()
        .optional()
        .describe("若不传则自动读取今日剩余热量"),
    }),
    execute: async (input) => {
      const profile = await getProfile();
      const today = await getTodayNutrition();
      const remaining = input.remainingCalories ?? today.remainingCalories;
      const preferenceNote =
        input.preferenceNote?.trim() ||
        buildPreferenceNote(profile) ||
        undefined;
      const meals = suggestDailyMeals({
        remainingCalories: remaining,
        remainingProteinG: today.remainingProteinG,
        proteinGoal: today.proteinGoal,
        preferenceNote,
        dietRestrictions: profile?.dietRestrictions,
      });
      return toJsonSafe({
        ok: true as const,
        remainingCalories: remaining,
        remainingProteinG: today.remainingProteinG,
        proteinGoal: today.proteinGoal,
        preferenceNote: preferenceNote ?? null,
        meals,
      });
    },
  }),

  logWeight: tool({
    description: "记录体重并更新档案中的当前体重",
    inputSchema: z.object({
      weightKg: z.number().describe("体重 kg"),
    }),
    execute: async ({ weightKg }) => {
      const entry = await logWeight(weightKg);
      return toJsonSafe({ ok: true as const, entry });
    },
  }),

  completeWorkout: tool({
    description: "将某次旧版训练日志标记为已完成（非计划会话）",
    inputSchema: z.object({
      workoutId: z.string().describe("训练日志 id"),
    }),
    execute: async ({ workoutId }) => {
      const entry = await completeWorkout(workoutId);
      return toJsonSafe({ ok: true as const, entry });
    },
  }),

  deletePendingWorkout: tool({
    description:
      "删除今日尚未完成的待练记录（临时推课或计划开练产生的会话均可）。已完成的不能删。",
    inputSchema: z.object({
      workoutId: z.string().describe("训练 id"),
      source: z
        .enum(["session", "legacy"])
        .optional()
        .describe("session=计划会话，legacy=旧版日志；不确定可先试 session"),
    }),
    execute: async ({ workoutId, source }) => {
      const { deletePendingWorkout } = await import("@/lib/db/queries");
      try {
        await deletePendingWorkout(workoutId, source ?? "session");
        return { ok: true as const };
      } catch (error) {
        if (source == null || source === "session") {
          try {
            await deletePendingWorkout(workoutId, "legacy");
            return { ok: true as const };
          } catch {
            /* fall through */
          }
        }
        return {
          ok: false as const,
          error: error instanceof Error ? error.message : "删除失败",
        };
      }
    },
  }),

  webSearch: tool({
    description:
      "联网搜索健身/饮食资料。用于动作标准、少见食物热量、用户明确要求查询时。不要用于替代本地课表生成。",
    inputSchema: z.object({
      query: z.string().describe("搜索词，中文或中英均可"),
      maxResults: z.number().int().min(1).max(8).optional(),
    }),
    execute: async ({ query, maxResults }) =>
      toJsonSafe(await searchWeb(query, maxResults ?? 5)),
  }),
};
