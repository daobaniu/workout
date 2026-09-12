/**
 * 精简中式食物库（P2-1）
 * 数值为常见市售/外卖「一份」粗估，偏提醒减脂用户勿低估高油高粉项。
 * 记餐：查库优先，未命中再走 LLM。
 */

export type FoodMacros = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type FoodItem = {
  id: string;
  name: string;
  aliases: string[];
  /** 默认一份的说法，如「1 碗」「1 杯」 */
  servingLabel: string;
  /** 默认一份营养 */
  serving: FoodMacros;
  /** 每 100g（有则支持「200g 鸡胸」缩放） */
  per100g?: FoodMacros;
  /** high_cal = 易低估的高热量项 */
  tags?: Array<"high_cal" | "staple" | "protein" | "drink" | "snack" | "fastfood">;
  note?: string;
};

function m(
  calories: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
): FoodMacros {
  return { calories, proteinG, carbsG, fatG };
}

export const FOOD_CATALOG: FoodItem[] = [
  // —— 高热量陷阱（优先收录）——
  {
    id: "luosifen",
    name: "螺蛳粉",
    aliases: ["螺丝粉", "柳州螺蛳粉"],
    servingLabel: "1 碗（加腐竹花生等常见料）",
    serving: m(680, 22, 88, 26),
    tags: ["high_cal", "fastfood"],
    note: "加炸蛋/卤蛋/多腐竹可到 800+；汤尽量少喝略减油",
  },
  {
    id: "suanlafen",
    name: "酸辣粉",
    aliases: ["重庆酸辣粉"],
    servingLabel: "1 碗",
    serving: m(520, 12, 78, 18),
    tags: ["high_cal", "fastfood"],
  },
  {
    id: "malatang",
    name: "麻辣烫",
    aliases: ["冒菜"],
    servingLabel: "1 份中等（约 500g 捞出）",
    serving: m(750, 35, 70, 35),
    tags: ["high_cal", "fastfood"],
    note: "全红油/宽粉多时轻松破千；清汤+少粉更可控",
  },
  {
    id: "hotpot_meal",
    name: "火锅（个人份）",
    aliases: ["火锅", "自助火锅", "海底捞"],
    servingLabel: "1 人正餐（含锅底油与主食）",
    serving: m(1100, 55, 80, 60),
    tags: ["high_cal"],
    note: "差异极大；蘸料、油碟、饮料另计",
  },
  {
    id: "self_heating_hotpot",
    name: "自热火锅",
    aliases: ["自热锅"],
    servingLabel: "1 盒整份",
    serving: m(720, 22, 75, 38),
    tags: ["high_cal", "fastfood"],
  },
  {
    id: "bbq_skewers",
    name: "烧烤（个人份）",
    aliases: ["烤串", "羊肉串", "夜宵烧烤"],
    servingLabel: "约 10–12 串 + 主食感",
    serving: m(900, 45, 50, 55),
    tags: ["high_cal"],
  },
  {
    id: "fried_chicken",
    name: "炸鸡",
    aliases: ["炸鸡块", "香辣鸡翅", "肯德基", "汉堡王炸鸡"],
    servingLabel: "约 3–4 块 / 小份",
    serving: m(650, 35, 35, 40),
    tags: ["high_cal", "fastfood"],
  },
  {
    id: "chicken_cutlet",
    name: "鸡排",
    aliases: ["炸鸡排", "香鸡排"],
    servingLabel: "1 片大鸡排",
    serving: m(480, 28, 32, 26),
    tags: ["high_cal", "fastfood"],
  },
  {
    id: "burger",
    name: "汉堡",
    aliases: ["汉堡包", "牛肉堡", "鸡腿堡"],
    servingLabel: "1 个标准汉堡",
    serving: m(520, 25, 45, 26),
    tags: ["high_cal", "fastfood"],
  },
  {
    id: "pizza_slice",
    name: "披萨",
    aliases: ["比萨"],
    servingLabel: "2 块（约 1/4 寸 9 寸饼）",
    serving: m(560, 22, 58, 26),
    tags: ["high_cal", "fastfood"],
  },
  {
    id: "bubble_tea",
    name: "珍珠奶茶",
    aliases: ["奶茶", "波霸奶茶", "芋圆奶茶", "一点点", "茶百道"],
    servingLabel: "1 杯中杯（全糖常见配方）",
    serving: m(420, 5, 65, 14),
    tags: ["high_cal", "drink"],
    note: "少糖/去珍珠可降一大截；芝芝类往往更高",
  },
  {
    id: "milk_tea_cheese",
    name: "芝芝莓莓/多肉类奶茶",
    aliases: ["芝芝", "多肉葡萄", "奶油顶奶茶"],
    servingLabel: "1 杯",
    serving: m(520, 6, 72, 22),
    tags: ["high_cal", "drink"],
  },
  {
    id: "cola",
    name: "可乐",
    aliases: ["肥宅快乐水", "汽水", "雪碧", "芬达"],
    servingLabel: "1 罐 330ml",
    serving: m(140, 0, 35, 0),
    tags: ["drink", "high_cal"],
  },
  {
    id: "beer",
    name: "啤酒",
    aliases: ["扎啤"],
    servingLabel: "1 瓶 500ml",
    serving: m(210, 2, 16, 0),
    tags: ["drink", "high_cal"],
  },
  {
    id: "instant_noodles",
    name: "方便面",
    aliases: ["泡面", "干脆面", "红烧牛肉面"],
    servingLabel: "1 包连调料",
    serving: m(470, 10, 62, 20),
    tags: ["high_cal", "fastfood"],
  },
  {
    id: "chaofen",
    name: "炒粉/炒河粉",
    aliases: ["炒河粉", "干炒牛河", "炒米粉"],
    servingLabel: "1 份外卖",
    serving: m(650, 20, 85, 24),
    tags: ["high_cal", "fastfood"],
  },
  {
    id: "fried_rice",
    name: "炒饭",
    aliases: ["蛋炒饭", "扬州炒饭"],
    servingLabel: "1 份",
    serving: m(550, 16, 75, 18),
    tags: ["high_cal", "staple"],
  },
  {
    id: "gaijiaofan",
    name: "盖浇饭",
    aliases: ["盖饭", "卤肉饭", "鱼香肉丝盖饭", "宫保鸡丁盖饭"],
    servingLabel: "1 份",
    serving: m(720, 28, 90, 26),
    tags: ["high_cal", "staple"],
  },
  {
    id: "huangmenji",
    name: "黄焖鸡米饭",
    aliases: ["黄焖鸡"],
    servingLabel: "1 份",
    serving: m(780, 40, 85, 30),
    tags: ["high_cal", "fastfood"],
  },
  {
    id: "claypot_rice",
    name: "煲仔饭",
    aliases: ["腊味煲仔饭"],
    servingLabel: "1 煲",
    serving: m(750, 28, 95, 28),
    tags: ["high_cal"],
  },
  {
    id: "lamian",
    name: "兰州拉面",
    aliases: ["牛肉拉面", "拉面"],
    servingLabel: "1 碗",
    serving: m(550, 28, 70, 16),
    tags: ["high_cal", "staple"],
  },
  {
    id: "chongqing_noodles",
    name: "重庆小面",
    aliases: ["小面", "担担面"],
    servingLabel: "1 碗",
    serving: m(580, 18, 75, 22),
    tags: ["high_cal"],
  },
  {
    id: "guoqiao",
    name: "过桥米线",
    aliases: ["米线"],
    servingLabel: "1 碗",
    serving: m(620, 25, 80, 20),
    tags: ["high_cal"],
  },
  {
    id: "roubing",
    name: "肉夹馍",
    aliases: ["腊汁肉夹馍"],
    servingLabel: "1 个",
    serving: m(480, 22, 48, 22),
    tags: ["high_cal", "fastfood"],
  },
  {
    id: "jianbing",
    name: "煎饼果子",
    aliases: ["煎饼", "手抓饼"],
    servingLabel: "1 份（加蛋加薄脆）",
    serving: m(450, 15, 52, 20),
    tags: ["high_cal", "fastfood"],
  },
  {
    id: "youtiao",
    name: "油条",
    aliases: ["油饼"],
    servingLabel: "1 根",
    serving: m(250, 5, 25, 14),
    tags: ["high_cal", "snack"],
  },
  {
    id: "shaokao_potato",
    name: "炸薯条",
    aliases: ["薯条"],
    servingLabel: "中份",
    serving: m(340, 4, 42, 16),
    tags: ["high_cal", "snack"],
  },
  {
    id: "xiaolongxia",
    name: "小龙虾",
    aliases: ["十三香小龙虾", "麻辣小龙虾"],
    servingLabel: "约 500g（含壳，可食部分估）",
    serving: m(450, 45, 8, 28),
    tags: ["high_cal"],
    note: "主要热量在油料；汤汁别喝太多",
  },
  {
    id: "shuizhuyu",
    name: "水煮鱼",
    aliases: ["水煮肉片"],
    servingLabel: "1 人份菜量（不含主食）",
    serving: m(650, 40, 12, 48),
    tags: ["high_cal"],
  },
  {
    id: "hongshaorou",
    name: "红烧肉",
    aliases: ["东坡肉"],
    servingLabel: "约 100g 可食",
    serving: m(380, 15, 8, 32),
    per100g: m(380, 15, 8, 32),
    tags: ["high_cal"],
  },
  {
    id: "huiguorou",
    name: "回锅肉",
    aliases: [],
    servingLabel: "1 盘个人份",
    serving: m(520, 22, 10, 42),
    tags: ["high_cal"],
  },
  {
    id: "tangcupaigu",
    name: "糖醋排骨",
    aliases: [],
    servingLabel: "1 盘个人份",
    serving: m(480, 25, 35, 26),
    tags: ["high_cal"],
  },
  {
    id: "yuebing",
    name: "月饼",
    aliases: ["蛋黄月饼"],
    servingLabel: "1 个中式月饼",
    serving: m(420, 6, 55, 20),
    tags: ["high_cal", "snack"],
  },
  {
    id: "zongzi",
    name: "粽子",
    aliases: ["肉粽", "蛋黄肉粽"],
    servingLabel: "1 只中等",
    serving: m(350, 10, 55, 10),
    tags: ["high_cal", "snack"],
  },
  {
    id: "cream_cake",
    name: "奶油蛋糕",
    aliases: ["蛋糕", "芝士蛋糕", "提拉米苏"],
    servingLabel: "1 块切角",
    serving: m(380, 5, 40, 22),
    tags: ["high_cal", "snack"],
  },
  {
    id: "icecream",
    name: "冰淇淋",
    aliases: ["雪糕", "哈根达斯"],
    servingLabel: "1 支/1 球",
    serving: m(220, 3, 24, 12),
    tags: ["high_cal", "snack"],
  },
  {
    id: "chocolate",
    name: "巧克力",
    aliases: ["黑巧", "德芙"],
    servingLabel: "约 40g（两小排）",
    serving: m(220, 3, 22, 14),
    per100g: m(550, 7, 55, 35),
    tags: ["high_cal", "snack"],
  },
  {
    id: "nuts_handful",
    name: "坚果",
    aliases: ["每日坚果", "腰果", "杏仁", "花生米"],
    servingLabel: "一小把约 30g",
    serving: m(180, 6, 6, 15),
    per100g: m(600, 20, 20, 50),
    tags: ["high_cal", "snack"],
    note: "健康但仍高热量，容易一把接一把",
  },

  // —— 常见主食 / 蛋白（记准日常）——
  {
    id: "rice_bowl",
    name: "米饭",
    aliases: ["白米饭", "一碗饭"],
    servingLabel: "1 碗约 200g 熟重",
    serving: m(230, 5, 50, 0.5),
    per100g: m(116, 2.6, 26, 0.3),
    tags: ["staple"],
  },
  {
    id: "rice_small",
    name: "半碗米饭",
    aliases: [],
    servingLabel: "约 100g 熟重",
    serving: m(115, 2.5, 25, 0.3),
    tags: ["staple"],
  },
  {
    id: "noodles_plain",
    name: "清汤面",
    aliases: ["阳春面", "挂面"],
    servingLabel: "1 碗",
    serving: m(350, 12, 65, 4),
    tags: ["staple"],
  },
  {
    id: "mantou",
    name: "馒头",
    aliases: ["花卷"],
    servingLabel: "1 个中等",
    serving: m(220, 7, 45, 1),
    tags: ["staple"],
  },
  {
    id: "whole_wheat_bread",
    name: "全麦面包",
    aliases: ["全麦吐司"],
    servingLabel: "2 片",
    serving: m(160, 7, 28, 2),
    tags: ["staple"],
  },
  {
    id: "oats",
    name: "燕麦",
    aliases: ["燕麦片", "即食燕麦"],
    servingLabel: "干重 40g + 水",
    serving: m(150, 5, 27, 3),
    per100g: m(380, 13, 67, 7),
    tags: ["staple"],
  },
  {
    id: "chicken_breast",
    name: "鸡胸肉",
    aliases: ["鸡胸", "水煮鸡胸"],
    servingLabel: "约 100g 熟重",
    serving: m(165, 31, 0, 3.5),
    per100g: m(165, 31, 0, 3.5),
    tags: ["protein"],
  },
  {
    id: "egg",
    name: "鸡蛋",
    aliases: ["水煮蛋", "茶叶蛋", "煎蛋"],
    servingLabel: "1 个",
    serving: m(75, 6.5, 0.5, 5),
    tags: ["protein"],
  },
  {
    id: "egg_white",
    name: "鸡蛋白",
    aliases: ["蛋白"],
    servingLabel: "约 3 个蛋白",
    serving: m(50, 11, 0.5, 0),
    tags: ["protein"],
  },
  {
    id: "beef_lean",
    name: "瘦牛肉",
    aliases: ["牛肉", "牛排瘦"],
    servingLabel: "约 100g",
    serving: m(200, 26, 0, 10),
    per100g: m(200, 26, 0, 10),
    tags: ["protein"],
  },
  {
    id: "pork_lean",
    name: "瘦猪肉",
    aliases: ["里脊"],
    servingLabel: "约 100g",
    serving: m(180, 22, 0, 9),
    per100g: m(180, 22, 0, 9),
    tags: ["protein"],
  },
  {
    id: "fish",
    name: "鱼肉",
    aliases: ["清蒸鱼", "龙利鱼", "巴沙鱼"],
    servingLabel: "约 120g",
    serving: m(150, 28, 0, 4),
    tags: ["protein"],
  },
  {
    id: "shrimp",
    name: "虾仁",
    aliases: ["虾", "白灼虾"],
    servingLabel: "约 100g",
    serving: m(100, 20, 1, 1.5),
    per100g: m(100, 20, 1, 1.5),
    tags: ["protein"],
  },
  {
    id: "tofu",
    name: "豆腐",
    aliases: ["北豆腐", "嫩豆腐"],
    servingLabel: "约 150g",
    serving: m(120, 12, 4, 6),
    per100g: m(80, 8, 2, 4),
    tags: ["protein"],
  },
  {
    id: "greek_yogurt",
    name: "希腊酸奶",
    aliases: ["酸奶", "无糖酸奶"],
    servingLabel: "1 杯约 150g",
    serving: m(130, 12, 8, 5),
    tags: ["protein", "snack"],
  },
  {
    id: "protein_shake",
    name: "蛋白粉",
    aliases: ["乳清蛋白", "蛋白奶昔"],
    servingLabel: "1 勺约 30g + 水",
    serving: m(120, 24, 2, 1.5),
    tags: ["protein"],
  },
  {
    id: "broccoli",
    name: "西兰花",
    aliases: ["绿菜花"],
    servingLabel: "约 200g",
    serving: m(70, 6, 12, 0.5),
    tags: ["staple"],
  },
  {
    id: "vegetables_mix",
    name: "清炒时蔬",
    aliases: ["青菜", "蔬菜", "生菜"],
    servingLabel: "1 盘（少油）",
    serving: m(80, 3, 10, 3),
  },
  {
    id: "apple",
    name: "苹果",
    aliases: [],
    servingLabel: "1 个中等",
    serving: m(95, 0.5, 25, 0.3),
    tags: ["snack"],
  },
  {
    id: "banana",
    name: "香蕉",
    aliases: [],
    servingLabel: "1 根",
    serving: m(105, 1.3, 27, 0.4),
    tags: ["snack"],
  },
  {
    id: "milk",
    name: "牛奶",
    aliases: ["纯牛奶"],
    servingLabel: "250ml",
    serving: m(150, 8, 12, 8),
    tags: ["drink"],
  },
  {
    id: "soy_milk",
    name: "豆浆",
    aliases: ["无糖豆浆"],
    servingLabel: "300ml",
    serving: m(110, 8, 10, 4),
    tags: ["drink"],
  },
];

const CN_NUM: Record<string, number> = {
  半: 0.5,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

export type FoodMatch = {
  item: FoodItem;
  /** 相对默认一份的倍数 */
  servings: number;
  /** 若按克数计算则有值 */
  grams?: number;
  macros: FoodMacros;
  matchedAlias: string;
};

export type FoodLookupResult = {
  matched: boolean;
  matches: FoodMatch[];
  macros: FoodMacros | null;
  source: "food_db" | "llm";
  /** 命中高热量项时的提醒 */
  warnings: string[];
  detail: string;
};

function scaleMacros(base: FoodMacros, factor: number): FoodMacros {
  return {
    calories: Math.round(base.calories * factor),
    proteinG: Math.round(base.proteinG * factor * 10) / 10,
    carbsG: Math.round(base.carbsG * factor * 10) / 10,
    fatG: Math.round(base.fatG * factor * 10) / 10,
  };
}

function addMacros(a: FoodMacros, b: FoodMacros): FoodMacros {
  return {
    calories: a.calories + b.calories,
    proteinG: Math.round((a.proteinG + b.proteinG) * 10) / 10,
    carbsG: Math.round((a.carbsG + b.carbsG) * 10) / 10,
    fatG: Math.round((a.fatG + b.fatG) * 10) / 10,
  };
}

/** 在片段里找份数；默认 1 */
export function parseServingsNear(text: string, alias: string): {
  servings: number;
  grams?: number;
} {
  const idx = text.indexOf(alias);
  const window =
    idx >= 0
      ? text.slice(Math.max(0, idx - 6), idx + alias.length + 4)
      : text;

  const gramMatch = window.match(/(\d+(?:\.\d+)?)\s*(?:g|克|G)/i);
  if (gramMatch) {
    return { servings: 1, grams: Number(gramMatch[1]) };
  }

  const half = window.match(/半\s*(?:碗|份|个|杯|瓶|根|盘|盒)?/);
  if (half) return { servings: 0.5 };

  const digitUnit = window.match(
    /(\d+(?:\.\d+)?)\s*(?:碗|份|个|杯|瓶|根|盘|盒|串)?/,
  );
  if (digitUnit) return { servings: Number(digitUnit[1]) };

  const cnUnit = window.match(
    /([一二两三四五六七八九十半])\s*(?:碗|份|个|杯|瓶|根|盘|盒|串)/,
  );
  if (cnUnit && CN_NUM[cnUnit[1]] != null) {
    return { servings: CN_NUM[cnUnit[1]] };
  }

  return { servings: 1 };
}

type AliasHit = { item: FoodItem; alias: string };

function collectAliasHits(description: string): AliasHit[] {
  const text = description.trim();
  const hits: AliasHit[] = [];

  for (const item of FOOD_CATALOG) {
    const names = [item.name, ...item.aliases].filter(Boolean);
    // 长别名优先
    names.sort((a, b) => b.length - a.length);
    for (const alias of names) {
      if (alias.length >= 2 && text.includes(alias)) {
        hits.push({ item, alias });
        break;
      }
    }
  }

  // 去掉被更长命中覆盖的短词（同一段重叠）
  hits.sort((a, b) => b.alias.length - a.alias.length);
  const kept: AliasHit[] = [];
  for (const hit of hits) {
    const covered = kept.some(
      (k) =>
        k.item.id !== hit.item.id &&
        (k.alias.includes(hit.alias) ||
          (description.includes(k.alias) &&
            description.indexOf(hit.alias) >= description.indexOf(k.alias) &&
            description.indexOf(hit.alias) <
              description.indexOf(k.alias) + k.alias.length)),
    );
    // 同 id 只留一次
    if (kept.some((k) => k.item.id === hit.item.id)) continue;
    if (covered) continue;
    kept.push(hit);
  }
  return kept;
}

function macrosForHit(item: FoodItem, description: string, alias: string): FoodMatch {
  const { servings, grams } = parseServingsNear(description, alias);
  if (grams != null && item.per100g) {
    const macros = scaleMacros(item.per100g, grams / 100);
    return { item, servings: grams / 100, grams, macros, matchedAlias: alias };
  }
  const macros = scaleMacros(item.serving, servings);
  return { item, servings, grams, macros, matchedAlias: alias };
}

/**
 * 从用户描述查库估算。多食物（「螺蛳粉和奶茶」）会叠加。
 */
export function lookupFoodNutrition(description: string): FoodLookupResult {
  const text = description.trim();
  if (!text) {
    return {
      matched: false,
      matches: [],
      macros: null,
      source: "llm",
      warnings: [],
      detail: "空描述",
    };
  }

  const hits = collectAliasHits(text);
  if (hits.length === 0) {
    return {
      matched: false,
      matches: [],
      macros: null,
      source: "llm",
      warnings: [],
      detail: "食物库未命中，使用模型估算",
    };
  }

  const matches = hits.map((h) => macrosForHit(h.item, text, h.alias));
  const macros = matches.reduce(
    (acc, m) => addMacros(acc, m.macros),
    m(0, 0, 0, 0),
  );

  const warnings: string[] = [];
  for (const match of matches) {
    if (match.item.tags?.includes("high_cal")) {
      warnings.push(
        `${match.item.name}属易低估高热量食物，库内按「${match.item.servingLabel}」×${match.servings} 计约 ${match.macros.calories} kcal` +
          (match.item.note ? `（${match.item.note}）` : ""),
      );
    }
  }

  const detail = matches
    .map(
      (x) =>
        `${x.item.name}×${x.grams != null ? `${x.grams}g` : x.servings}→${x.macros.calories}kcal`,
    )
    .join("；");

  return {
    matched: true,
    matches,
    macros,
    source: "food_db",
    warnings,
    detail,
  };
}

export function searchFoodCatalog(query: string, limit = 12): FoodItem[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return FOOD_CATALOG.filter((f) => f.tags?.includes("high_cal")).slice(
      0,
      limit,
    );
  }
  return FOOD_CATALOG.filter((f) => {
    const blob = [f.name, ...f.aliases, f.id].join(" ").toLowerCase();
    return blob.includes(q) || q.includes(f.name);
  }).slice(0, limit);
}

/**
 * 合并查库与模型估算：命中则覆盖热量/宏量。
 */
export function resolveFoodLogEstimate(input: {
  description: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}): {
  description: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  source: string;
  lookup: FoodLookupResult;
} {
  const lookup = lookupFoodNutrition(input.description);
  if (!lookup.matched || !lookup.macros) {
    return {
      description: input.description,
      calories: input.calories,
      proteinG: input.proteinG,
      carbsG: input.carbsG,
      fatG: input.fatG,
      source: "chat",
      lookup,
    };
  }

  const ids = lookup.matches.map((x) => x.item.id).join("+");
  return {
    description: input.description,
    calories: lookup.macros.calories,
    proteinG: lookup.macros.proteinG,
    carbsG: lookup.macros.carbsG,
    fatG: lookup.macros.fatG,
    source: `food_db:${ids}`,
    lookup,
  };
}

export type FoodConfidence = {
  /** 0–1，越高越可信 */
  score: number;
  level: "high" | "medium" | "low";
  reasons: string[];
  /** low 时需用户确认再写入 */
  needsConfirm: boolean;
};

/**
 * P2-2：记餐置信度。食物库高置信；纯模型 / 离谱数值 → 低置信需确认。
 */
export function scoreFoodLogConfidence(input: {
  description: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  source: string;
  lookup: FoodLookupResult;
}): FoodConfidence {
  const reasons: string[] = [];
  let score = 0.45;
  const desc = input.description.trim();
  const fromDb = input.source.startsWith("food_db") || input.lookup.matched;

  if (fromDb) {
    score = 0.9;
    reasons.push("命中本地食物库");
    if (input.lookup.matches.length > 1) {
      score -= 0.08;
      reasons.push("含多项食物叠加估算");
    }
  } else {
    reasons.push("未命中食物库，为模型估算");
    if (desc.length < 4) {
      score -= 0.15;
      reasons.push("描述过短");
    }
    if (/之类|随便|差不多|估计|一堆|一些/.test(desc)) {
      score -= 0.12;
      reasons.push("描述含糊");
    }
  }

  if (!Number.isFinite(input.calories) || input.calories <= 0) {
    score -= 0.3;
    reasons.push("热量无效");
  } else if (input.calories > 1800) {
    score -= 0.12;
    reasons.push("单餐热量偏高，请核对");
  } else if (input.calories < 30 && !/茶|水|黑咖/.test(desc)) {
    score -= 0.1;
    reasons.push("热量异常偏低");
  }

  if (input.proteinG == null) {
    score -= 0.08;
    reasons.push("缺少蛋白");
  } else if (input.proteinG > 120) {
    score -= 0.1;
    reasons.push("蛋白数值偏高");
  }

  const macrosSum =
    (input.proteinG ?? 0) * 4 +
    (input.carbsG ?? 0) * 4 +
    (input.fatG ?? 0) * 9;
  if (
    input.proteinG != null &&
    input.carbsG != null &&
    input.fatG != null &&
    input.calories > 0
  ) {
    const ratio = macrosSum / input.calories;
    if (ratio < 0.55 || ratio > 1.45) {
      score -= 0.15;
      reasons.push("宏量与热量不太匹配");
    }
  }

  score = Math.max(0, Math.min(1, score));
  const level = score >= 0.75 ? "high" : score >= 0.55 ? "medium" : "low";
  return {
    score: Math.round(score * 100) / 100,
    level,
    reasons,
    needsConfirm: level === "low",
  };
}
