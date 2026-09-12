import { FOOD_CATALOG, type FoodMacros } from "@/lib/fitness/foods";
import { filterMealIdeaLabels } from "@/lib/fitness/preferences";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export type MealIdea = {
  id: string;
  label: string;
  /** 写入饮食记录用的描述 */
  logDescription: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  foodIds: string[];
};

export type SuggestedMeal = {
  name: string;
  slot: MealSlot;
  /** 本餐预算 */
  calories: number;
  proteinG: number;
  ideas: MealIdea[];
};

export type MealSuggestion = {
  totalTarget: number;
  proteinTargetRemaining: number;
  proteinGoal: number | null;
  preferenceNote: string | null;
  meals: SuggestedMeal[];
  tips: string[];
};

type IdeaTemplate = {
  id: string;
  slot: MealSlot;
  label: string;
  /** foodId → 相对默认一份的倍数 */
  parts: Array<{ foodId: string; servings?: number }>;
};

const IDEA_TEMPLATES: IdeaTemplate[] = [
  // 早餐
  {
    id: "bf_oats_egg_fruit",
    slot: "breakfast",
    label: "燕麦 + 鸡蛋 + 苹果",
    parts: [
      { foodId: "oats" },
      { foodId: "egg", servings: 1 },
      { foodId: "apple" },
    ],
  },
  {
    id: "bf_bread_yogurt_banana",
    slot: "breakfast",
    label: "全麦面包 + 希腊酸奶 + 香蕉",
    parts: [
      { foodId: "whole_wheat_bread" },
      { foodId: "greek_yogurt" },
      { foodId: "banana" },
    ],
  },
  {
    id: "bf_egg_milk_mantou",
    slot: "breakfast",
    label: "鸡蛋 + 牛奶 + 馒头",
    parts: [
      { foodId: "egg", servings: 2 },
      { foodId: "milk" },
      { foodId: "mantou", servings: 0.5 },
    ],
  },
  {
    id: "bf_soymilk_egg",
    slot: "breakfast",
    label: "豆浆 + 鸡蛋（轻量）",
    parts: [
      { foodId: "soy_milk" },
      { foodId: "egg", servings: 2 },
    ],
  },

  // 午餐
  {
    id: "lc_chicken_rice_veg",
    slot: "lunch",
    label: "鸡胸 + 半碗米饭 + 时蔬",
    parts: [
      { foodId: "chicken_breast", servings: 1.2 },
      { foodId: "rice_small" },
      { foodId: "vegetables_mix" },
    ],
  },
  {
    id: "lc_fish_rice_broccoli",
    slot: "lunch",
    label: "鱼肉 + 米饭 + 西兰花",
    parts: [
      { foodId: "fish" },
      { foodId: "rice_bowl", servings: 0.75 },
      { foodId: "broccoli" },
    ],
  },
  {
    id: "lc_tofu_shrimp_rice",
    slot: "lunch",
    label: "虾仁豆腐 + 半碗饭 + 青菜",
    parts: [
      { foodId: "shrimp" },
      { foodId: "tofu" },
      { foodId: "rice_small" },
      { foodId: "vegetables_mix" },
    ],
  },
  {
    id: "lc_beef_veg_rice",
    slot: "lunch",
    label: "瘦牛肉 + 时蔬 + 半碗饭",
    parts: [
      { foodId: "beef_lean" },
      { foodId: "vegetables_mix" },
      { foodId: "rice_small" },
    ],
  },

  // 晚餐
  {
    id: "dn_shrimp_tofu_veg",
    slot: "dinner",
    label: "虾仁豆腐 + 青菜（少主食）",
    parts: [
      { foodId: "shrimp", servings: 1.2 },
      { foodId: "tofu" },
      { foodId: "vegetables_mix" },
    ],
  },
  {
    id: "dn_chicken_broccoli",
    slot: "dinner",
    label: "鸡胸 + 西兰花 + 少量米饭",
    parts: [
      { foodId: "chicken_breast" },
      { foodId: "broccoli" },
      { foodId: "rice_small", servings: 0.75 },
    ],
  },
  {
    id: "dn_fish_veg",
    slot: "dinner",
    label: "清蒸鱼 + 时蔬",
    parts: [
      { foodId: "fish", servings: 1.2 },
      { foodId: "vegetables_mix" },
    ],
  },
  {
    id: "dn_egg_tofu_veg",
    slot: "dinner",
    label: "鸡蛋 + 豆腐 + 青菜",
    parts: [
      { foodId: "egg", servings: 2 },
      { foodId: "tofu" },
      { foodId: "vegetables_mix" },
    ],
  },

  // 加餐
  {
    id: "sn_yogurt",
    slot: "snack",
    label: "希腊酸奶",
    parts: [{ foodId: "greek_yogurt" }],
  },
  {
    id: "sn_protein",
    slot: "snack",
    label: "蛋白粉一杯",
    parts: [{ foodId: "protein_shake" }],
  },
  {
    id: "sn_egg_white",
    slot: "snack",
    label: "鸡蛋白",
    parts: [{ foodId: "egg_white" }],
  },
  {
    id: "sn_apple",
    slot: "snack",
    label: "苹果",
    parts: [{ foodId: "apple" }],
  },
  {
    id: "sn_nuts_small",
    slot: "snack",
    label: "坚果一小把（注意别多）",
    parts: [{ foodId: "nuts_handful" }],
  },
];

function scale(m: FoodMacros, factor: number): FoodMacros {
  return {
    calories: Math.round(m.calories * factor),
    proteinG: Math.round(m.proteinG * factor * 10) / 10,
    carbsG: Math.round(m.carbsG * factor * 10) / 10,
    fatG: Math.round(m.fatG * factor * 10) / 10,
  };
}

function sumMacros(parts: FoodMacros[]): FoodMacros {
  return parts.reduce(
    (acc, p) => ({
      calories: acc.calories + p.calories,
      proteinG: Math.round((acc.proteinG + p.proteinG) * 10) / 10,
      carbsG: Math.round((acc.carbsG + p.carbsG) * 10) / 10,
      fatG: Math.round((acc.fatG + p.fatG) * 10) / 10,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

function buildIdea(template: IdeaTemplate): MealIdea | null {
  const macrosList: FoodMacros[] = [];
  const names: string[] = [];
  const foodIds: string[] = [];

  for (const part of template.parts) {
    const item = FOOD_CATALOG.find((f) => f.id === part.foodId);
    if (!item) return null;
    const servings = part.servings ?? 1;
    macrosList.push(scale(item.serving, servings));
    names.push(servings === 1 ? item.name : `${item.name}×${servings}`);
    foodIds.push(item.id);
  }

  const macros = sumMacros(macrosList);
  return {
    id: template.id,
    label: template.label,
    logDescription: template.label,
    calories: macros.calories,
    proteinG: macros.proteinG,
    carbsG: macros.carbsG,
    fatG: macros.fatG,
    foodIds,
  };
}

/** 选出贴合本餐预算的点子（优先够蛋白、不超太多热量） */
function pickIdeasForSlot(
  slot: MealSlot,
  budgetCal: number,
  budgetProtein: number,
  dietRestrictions?: string | null,
  limit = 2,
): MealIdea[] {
  const built = IDEA_TEMPLATES.filter((t) => t.slot === slot)
    .map(buildIdea)
    .filter((x): x is MealIdea => x != null);

  const allowedLabels = new Set(
    filterMealIdeaLabels(
      built.map((b) => b.label),
      dietRestrictions,
    ),
  );
  const filtered = built.filter((b) => allowedLabels.has(b.label));

  const scored = filtered
    .map((idea) => {
      const overCal = Math.max(0, idea.calories - budgetCal * 1.15);
      const proteinGap = Math.max(0, budgetProtein - idea.proteinG);
      // 越贴近预算、蛋白越够分越高
      const score =
        -overCal * 2 -
        proteinGap * 3 -
        Math.abs(idea.calories - budgetCal) * 0.15 +
        idea.proteinG * 0.8;
      return { idea, score, overCal };
    })
    .filter((x) => x.overCal < budgetCal * 0.5 || budgetCal < 200)
    .sort((a, b) => b.score - a.score);

  const picked = scored.slice(0, limit).map((x) => x.idea);
  return picked.length ? picked : filtered.slice(0, limit);
}

const SLOT_META: Array<{
  slot: MealSlot;
  name: string;
  calRatio: number;
  proteinRatio: number;
}> = [
  { slot: "breakfast", name: "早餐", calRatio: 0.25, proteinRatio: 0.25 },
  { slot: "lunch", name: "午餐", calRatio: 0.35, proteinRatio: 0.35 },
  { slot: "dinner", name: "晚餐", calRatio: 0.3, proteinRatio: 0.3 },
  { slot: "snack", name: "加餐", calRatio: 0.1, proteinRatio: 0.1 },
];

/**
 * 轻量推餐：按剩余热量/蛋白拆餐次，点子来自食物库组合（可一键记入）。
 */
export function suggestDailyMeals(options: {
  remainingCalories: number;
  remainingProteinG?: number;
  proteinGoal?: number;
  preferenceNote?: string;
  dietRestrictions?: string | null;
}): MealSuggestion {
  const remaining = Math.max(options.remainingCalories, 400);
  const proteinLeft = Math.max(options.remainingProteinG ?? 0, 0);
  const note = options.preferenceNote?.trim();
  const proteinGoal = options.proteinGoal ?? null;
  const diet = options.dietRestrictions;

  const snackCal = Math.max(
    remaining -
      Math.round(remaining * 0.25) -
      Math.round(remaining * 0.35) -
      Math.round(remaining * 0.3),
    0,
  );
  const includeSnack = snackCal > 80;

  const meals: SuggestedMeal[] = SLOT_META.filter(
    (s) => s.slot !== "snack" || includeSnack,
  ).map((s) => {
    const calories =
      s.slot === "snack"
        ? snackCal
        : Math.round(remaining * s.calRatio);
    const proteinG =
      s.slot === "snack"
        ? Math.max(
            proteinLeft -
              Math.round(proteinLeft * 0.25) -
              Math.round(proteinLeft * 0.35) -
              Math.round(proteinLeft * 0.3),
            0,
          )
        : Math.round(proteinLeft * s.proteinRatio);

    return {
      name: s.name,
      slot: s.slot,
      calories,
      proteinG,
      ideas: pickIdeasForSlot(s.slot, calories, proteinG, diet, 2),
    };
  });

  return {
    totalTarget: remaining,
    proteinTargetRemaining: proteinLeft,
    proteinGoal,
    preferenceNote: note || null,
    meals,
    tips: [
      proteinGoal
        ? `今日蛋白目标约 ${proteinGoal}g，优先凑够蛋白再调主食`
        : "优先保证蛋白质；主食可按饥饿感微调",
      proteinLeft > 0
        ? `按当前缺口，后面餐次大约还需 ${proteinLeft}g 蛋白`
        : "蛋白目标已接近或达标，注意别只堆热量",
      "点子热量来自本地食物库粗估，可点「记这顿」写入；高油外卖请另记或改数值",
      note ? `已参考偏好：${note}` : "无特殊偏好时可按上述轮换",
    ],
  };
}

/**
 * 今日页用：按剩余蛋白/热量挑几条「下一顿补蛋白」点子（可一键记）。
 */
export function suggestProteinBoosts(options: {
  remainingCalories: number;
  remainingProteinG: number;
  dietRestrictions?: string | null;
  limit?: number;
}): MealIdea[] {
  const limit = options.limit ?? 3;
  const calLeft = Math.max(options.remainingCalories, 0);
  const proteinLeft = Math.max(options.remainingProteinG, 0);

  const plan = suggestDailyMeals({
    remainingCalories: Math.max(calLeft, 400),
    remainingProteinG: proteinLeft,
    dietRestrictions: options.dietRestrictions,
  });

  const fromMeals = plan.meals.flatMap((m) => m.ideas);

  // 单品高蛋白（缺口不大时更合适）
  const singles: MealIdea[] = FOOD_CATALOG.filter((f) =>
    f.tags?.includes("protein"),
  )
    .map((f) => ({
      id: `single_${f.id}`,
      label: f.name,
      logDescription: f.name,
      calories: f.serving.calories,
      proteinG: f.serving.proteinG,
      carbsG: f.serving.carbsG,
      fatG: f.serving.fatG,
      foodIds: [f.id],
    }))
    .filter((idea) => {
      const labels = filterMealIdeaLabels([idea.label], options.dietRestrictions);
      return labels.includes(idea.label);
    });

  const pool = [...fromMeals, ...singles];
  const seen = new Set<string>();
  const unique = pool.filter((idea) => {
    if (seen.has(idea.id)) return false;
    seen.add(idea.id);
    return true;
  });

  // 下一顿大约用掉剩余热量的一半（至少 180），避免一次吃光全天
  const mealBudget = Math.max(
    180,
    Math.min(calLeft > 0 ? Math.round(calLeft * 0.55) : 450, 650),
  );

  const scored = unique
    .map((idea) => {
      const overCal = Math.max(0, idea.calories - mealBudget);
      const proteinScore = idea.proteinG;
      const density =
        idea.calories > 0 ? idea.proteinG / idea.calories : idea.proteinG;
      let score = proteinScore * 2 + density * 80 - overCal * 1.5;
      if (proteinLeft > 0 && idea.proteinG >= Math.min(proteinLeft, 25)) {
        score += 15;
      }
      if (proteinLeft <= 0) {
        // 已达标：偏好低热量
        score = -idea.calories + idea.proteinG * 0.3;
      }
      return { idea, score, overCal };
    })
    .filter((x) => x.overCal <= mealBudget * 0.35 || mealBudget < 220)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.idea);
}
