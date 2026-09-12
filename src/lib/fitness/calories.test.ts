import { describe, expect, it } from "vitest";
import {
  estimateBmr,
  estimateCalorieGoal,
  estimateTdee,
} from "@/lib/fitness/calories";

const maleLight = {
  sex: "male" as const,
  weightKg: 70,
  heightCm: 175,
  age: 28,
  activityLevel: "light" as const,
};

describe("estimateBmr / estimateTdee", () => {
  it("Mifflin-St Jeor 男", () => {
    // 10*70 + 6.25*175 - 5*28 + 5 = 700 + 1093.75 - 140 + 5 = 1658.75 → 1659
    expect(estimateBmr(maleLight)).toBe(1659);
  });

  it("Mifflin-St Jeor 女", () => {
    const bmr = estimateBmr({
      sex: "female",
      weightKg: 55,
      heightCm: 160,
      age: 30,
    });
    // 10*55 + 6.25*160 - 5*30 - 161 = 550 + 1000 - 150 - 161 = 1239
    expect(bmr).toBe(1239);
  });

  it("TDEE = BMR × 活动系数", () => {
    const bmr = estimateBmr(maleLight);
    expect(estimateTdee(maleLight)).toBe(Math.round(bmr * 1.375));
  });
});

describe("estimateCalorieGoal 目标模式与下限", () => {
  it("减脂：默认缺口约 400，且不低于男 1500", () => {
    const r = estimateCalorieGoal({ ...maleLight, goalMode: "cut" });
    expect(r.goalMode).toBe("cut");
    expect(r.dailyCalorieGoal).toBe(Math.max(r.tdee - 400, 1500));
    expect(r.dailyCalorieGoal).toBeGreaterThanOrEqual(1500);
  });

  it("减脂预算下限：女不低于 1200", () => {
    const r = estimateCalorieGoal({
      sex: "female",
      weightKg: 45,
      heightCm: 150,
      age: 25,
      activityLevel: "sedentary",
      goalMode: "cut",
      deficit: 800,
    });
    expect(r.dailyCalorieGoal).toBe(1200);
    expect(r.deficit).toBe(r.tdee - 1200);
  });

  it("维持：预算 ≈ TDEE", () => {
    const r = estimateCalorieGoal({ ...maleLight, goalMode: "maintain" });
    expect(r.dailyCalorieGoal).toBe(r.tdee);
    expect(r.deficit).toBe(0);
    expect(r.surplus).toBe(0);
  });

  it("增肌：默认 +250 盈余", () => {
    const r = estimateCalorieGoal({ ...maleLight, goalMode: "bulk" });
    expect(r.dailyCalorieGoal).toBe(r.tdee + 250);
    expect(r.surplus).toBe(250);
  });
});
