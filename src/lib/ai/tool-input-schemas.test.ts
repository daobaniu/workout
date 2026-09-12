import { describe, expect, it } from "vitest";
import {
  completeProgramSessionSetLogSchema,
  logFoodInputSchema,
  rememberPreferencesInputSchema,
} from "@/lib/ai/tool-input-schemas";

describe("logFood 入参契约", () => {
  it("接受合法记餐入参", () => {
    const parsed = logFoodInputSchema.parse({
      description: "一碗螺蛳粉",
      calories: 650,
      proteinG: 22,
      carbsG: 80,
      fatG: 20,
    });
    expect(parsed.description).toContain("螺蛳粉");
  });

  it("拒绝非整数热量", () => {
    expect(() =>
      logFoodInputSchema.parse({
        description: "米饭",
        calories: 200.5,
        proteinG: 5,
      }),
    ).toThrow();
  });

  it("缺少 proteinG 失败", () => {
    expect(() =>
      logFoodInputSchema.parse({
        description: "米饭",
        calories: 200,
      }),
    ).toThrow();
  });
});

describe("rememberPreferences 入参契约", () => {
  it("可只传忌口片段", () => {
    const parsed = rememberPreferencesInputSchema.parse({
      dietRestrictions: "牛肉",
      mode: "append",
    });
    expect(parsed.dietRestrictions).toBe("牛肉");
  });

  it("拒绝非法 mode", () => {
    expect(() =>
      rememberPreferencesInputSchema.parse({
        dietRestrictions: "牛肉",
        mode: "merge",
      }),
    ).toThrow();
  });
});

describe("completeProgramSession setLogs 条目", () => {
  it("接受顶组负荷", () => {
    const row = completeProgramSessionSetLogSchema.parse({
      exerciseId: "pushup",
      exerciseName: "俯卧撑",
      reps: 12,
      weightKg: null,
      rpe: 7,
    });
    expect(row.reps).toBe(12);
  });
});
