import { tool } from "ai";
import { z } from "zod";
import {
  completeWorkout,
  getProfile,
  getTodayNutrition,
  logFood,
  logWeight,
  saveWorkout,
  upsertProfile,
} from "@/lib/db/queries";
import { suggestDailyMeals } from "@/lib/fitness/meals";
import { suggestWorkoutPlan } from "@/lib/fitness/templates";
import { searchWeb } from "./web-search";

export const fitnessTools = {
  getProfile: tool({
    description: "读取用户减脂档案（身高体重目标、热量预算、训练场所等）",
    inputSchema: z.object({}),
    execute: async () => {
      const profile = await getProfile();
      if (!profile) {
        return { exists: false, message: "尚未建档，请先收集用户基本信息并调用 upsertProfile" };
      }
      return { exists: true, profile };
    },
  }),

  upsertProfile: tool({
    description: "创建或更新用户减脂档案。若用户不知道热量预算，可根据身高体重年龄性别活动量让系统估算，不必强求用户报数字。",
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
      dailyCalorieGoal: z
        .number()
        .int()
        .optional()
        .describe("每日热量预算 kcal；不知道可不传，由服务端估算"),
      trainingPlace: z.enum(["home", "gym"]).optional().describe("训练场所"),
      daysPerWeek: z.number().int().min(1).max(7).optional().describe("每周可练天数"),
      notes: z.string().optional().describe("备注偏好或伤病规避说明"),
    }),
    execute: async (input) => {
      const profile = await upsertProfile(input);
      return { ok: true, profile };
    },
  }),

  logFood: tool({
    description: "记录一餐饮食（粗估热量与宏量）",
    inputSchema: z.object({
      description: z.string().describe("食物描述"),
      calories: z.number().int().describe("估算热量 kcal"),
      proteinG: z.number().optional(),
      carbsG: z.number().optional(),
      fatG: z.number().optional(),
    }),
    execute: async (input) => {
      const entry = await logFood(input);
      const today = await getTodayNutrition();
      return { ok: true, entry, today };
    },
  }),

  getTodayNutrition: tool({
    description: "查询今日已摄入热量/宏量与剩余热量预算",
    inputSchema: z.object({}),
    execute: async () => getTodayNutrition(),
  }),

  suggestWorkout: tool({
    description:
      "基于本地力量训练模板生成今日课表。根据场所、时长、是否偷懒日生成，不要用搜索替代。",
    inputSchema: z.object({
      place: z.enum(["home", "gym"]).optional(),
      minutes: z.number().int().optional().describe("可用分钟数"),
      lazy: z.boolean().optional().describe("偷懒精简版"),
      focus: z.enum(["full", "push", "pull", "legs"]).optional(),
      save: z.boolean().optional().describe("是否写入今日训练日志，默认 true"),
    }),
    execute: async (input) => {
      const profile = await getProfile();
      const plan = suggestWorkoutPlan({
        place: input.place ?? (profile?.trainingPlace === "gym" ? "gym" : "home"),
        minutes: input.minutes,
        daysPerWeek: profile?.daysPerWeek,
        lazy: input.lazy,
        focus: input.focus,
      });

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

      return { ok: true, workoutId, plan };
    },
  }),

  suggestDailyMeals: tool({
    description: "按今日剩余热量预算推荐一日三餐（家常可执行）",
    inputSchema: z.object({
      preferenceNote: z.string().optional().describe("饮食偏好，如少油、素食"),
      remainingCalories: z
        .number()
        .int()
        .optional()
        .describe("若不传则自动读取今日剩余热量"),
    }),
    execute: async (input) => {
      const today = await getTodayNutrition();
      const remaining = input.remainingCalories ?? today.remainingCalories;
      const meals = suggestDailyMeals({
        remainingCalories: remaining,
        preferenceNote: input.preferenceNote,
      });
      return { ok: true, remainingCalories: remaining, meals };
    },
  }),

  logWeight: tool({
    description: "记录体重并更新档案中的当前体重",
    inputSchema: z.object({
      weightKg: z.number().describe("体重 kg"),
    }),
    execute: async ({ weightKg }) => {
      const entry = await logWeight(weightKg);
      return { ok: true, entry };
    },
  }),

  completeWorkout: tool({
    description: "将某次训练标记为已完成",
    inputSchema: z.object({
      workoutId: z.string().describe("训练日志 id"),
    }),
    execute: async ({ workoutId }) => {
      const entry = await completeWorkout(workoutId);
      return { ok: true, entry };
    },
  }),

  webSearch: tool({
    description:
      "联网搜索健身/饮食资料。用于动作标准、少见食物热量、用户明确要求查询时。不要用于替代本地课表生成。",
    inputSchema: z.object({
      query: z.string().describe("搜索词，中文或中英均可"),
      maxResults: z.number().int().min(1).max(8).optional(),
    }),
    execute: async ({ query, maxResults }) => searchWeb(query, maxResults ?? 5),
  }),
};
