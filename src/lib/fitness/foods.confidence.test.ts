import { describe, expect, it } from "vitest";
import {
  scoreFoodLogConfidence,
  type FoodLookupResult,
} from "@/lib/fitness/foods";

const miss: FoodLookupResult = {
  matched: false,
  matches: [],
  macros: null,
  source: "llm",
  warnings: [],
  detail: "",
};

const hit: FoodLookupResult = {
  matched: true,
  matches: [
    {
      item: {
        id: "chicken_breast",
        name: "鸡胸肉",
        aliases: ["鸡胸"],
        servingLabel: "100g",
        serving: { calories: 165, proteinG: 31, carbsG: 0, fatG: 3.5 },
      },
      servings: 1,
      macros: { calories: 165, proteinG: 31, carbsG: 0, fatG: 3.5 },
      matchedAlias: "鸡胸肉",
    },
  ],
  macros: { calories: 165, proteinG: 31, carbsG: 0, fatG: 3.5 },
  source: "food_db",
  warnings: [],
  detail: "鸡胸肉",
};

describe("scoreFoodLogConfidence", () => {
  it("命中食物库通常高置信、不需确认", () => {
    const c = scoreFoodLogConfidence({
      description: "鸡胸肉",
      calories: 165,
      proteinG: 31,
      carbsG: 0,
      fatG: 3.5,
      source: "food_db",
      lookup: hit,
    });
    expect(c.level).toBe("high");
    expect(c.needsConfirm).toBe(false);
  });

  it("含糊描述 + 未命中库 → 低置信需确认", () => {
    const c = scoreFoodLogConfidence({
      description: "随便吃了一些",
      calories: 600,
      proteinG: 10,
      source: "llm",
      lookup: miss,
    });
    expect(c.needsConfirm).toBe(true);
    expect(c.level).toBe("low");
  });
});
