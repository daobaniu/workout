import { describe, expect, it } from "vitest";
import {
  filterMealIdeaLabels,
  mergePreferenceField,
} from "@/lib/fitness/preferences";

describe("mergePreferenceField", () => {
  it("append 合并去重", () => {
    expect(mergePreferenceField("牛肉", "海鲜", "append")).toBe("牛肉、海鲜");
    expect(mergePreferenceField("牛肉", "不吃牛肉", "append")).toBe("牛肉");
  });

  it("replace 整段替换", () => {
    expect(mergePreferenceField("牛肉、海鲜", "辣", "replace")).toBe("辣");
  });

  it("clear 清空", () => {
    expect(mergePreferenceField("牛肉", "x", "clear")).toBeNull();
  });
});

describe("filterMealIdeaLabels 忌口同义词", () => {
  const ideas = [
    "鸡胸 + 半碗米饭 + 时蔬",
    "瘦牛肉 + 时蔬 + 半碗饭",
    "虾仁豆腐 + 青菜",
    "鱼肉 + 米饭 + 西兰花",
  ];

  it("不吃牛肉会过滤牛排/瘦牛肉类", () => {
    const out = filterMealIdeaLabels(ideas, "牛肉");
    expect(out.some((x) => x.includes("牛肉"))).toBe(false);
    expect(out.some((x) => x.includes("鸡胸"))).toBe(true);
  });

  it("海鲜同义词过滤虾", () => {
    const out = filterMealIdeaLabels(ideas, "海鲜");
    expect(out.some((x) => x.includes("虾"))).toBe(false);
  });
});
