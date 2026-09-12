import { z } from "zod";

/** 关键 Tool 入参契约（P2-8）：单测与 tools 共用，避免漂移 */

export const logFoodInputSchema = z.object({
  description: z.string().describe("食物描述，尽量含品名，如「一碗螺蛳粉」"),
  calories: z.number().int().describe("估算热量 kcal（库未命中时采用）"),
  proteinG: z
    .number()
    .describe("估算蛋白质克数 g，必须尽量填写，不要省略"),
  carbsG: z
    .number()
    .optional()
    .describe("估算碳水克数 g，尽量填写以完善宏量进度"),
  fatG: z
    .number()
    .optional()
    .describe("估算脂肪克数 g，尽量填写以完善宏量进度"),
  confirmed: z
    .boolean()
    .optional()
    .describe("用户已确认低置信草稿时传 true"),
});

export const rememberPreferencesInputSchema = z.object({
  dietRestrictions: z
    .string()
    .optional()
    .describe("忌口片段，如：牛肉、海鲜、辣、奶"),
  injuryNotes: z
    .string()
    .optional()
    .describe("伤病规避，如：膝盖不适少跳跃"),
  equipmentPref: z
    .string()
    .optional()
    .describe("器械偏好，如：只有哑铃、居家徒手"),
  notes: z.string().optional().describe("其他长期备注"),
  mode: z
    .enum(["append", "replace", "clear"])
    .optional()
    .describe("append=追加合并；replace=整段替换该字段；clear=清空所传字段"),
});

export const completeProgramSessionSetLogSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  setIndex: z.number().int().optional(),
  reps: z.number().int(),
  weightKg: z.number().nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
});
