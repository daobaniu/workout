import { getExercise, type Exercise } from "@/lib/fitness/exercises";

/** 从档案拼出推餐/推练用的偏好摘要 */
export function buildPreferenceNote(profile: {
  dietRestrictions?: string | null;
  injuryNotes?: string | null;
  equipmentPref?: string | null;
  notes?: string | null;
} | null | undefined): string | null {
  if (!profile) return null;
  const parts = [
    profile.dietRestrictions?.trim()
      ? `忌口：${profile.dietRestrictions.trim()}`
      : null,
    profile.injuryNotes?.trim()
      ? `伤病规避：${profile.injuryNotes.trim()}`
      : null,
    profile.equipmentPref?.trim()
      ? `器械偏好：${profile.equipmentPref.trim()}`
      : null,
    profile.notes?.trim() ? `备注：${profile.notes.trim()}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join("；") : null;
}

/** 拆分偏好条目（顿号/逗号等） */
export function splitPreferenceTokens(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,，、；;\n]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 1);
}

/**
 * 合并偏好字段：默认追加去重，不覆盖旧内容。
 * mode=replace 整段替换；clear 清空。
 */
export function mergePreferenceField(
  existing: string | null | undefined,
  incoming: string | null | undefined,
  mode: "append" | "replace" | "clear" = "append",
): string | null {
  if (mode === "clear") return null;
  if (incoming == null) return existing?.trim() || null;
  const normalize = (t: string) =>
    t.replace(/^(不吃|忌口?|避免|尽量少|少吃)/, "").trim() || t;
  if (mode === "replace") {
    const parts = splitPreferenceTokens(incoming).map(normalize).filter(Boolean);
    return parts.length ? [...new Set(parts)].join("、") : null;
  }
  const set = new Set(splitPreferenceTokens(existing).map(normalize));
  for (const t of splitPreferenceTokens(incoming)) {
    const cleaned = normalize(t);
    if (cleaned) set.add(cleaned);
  }
  const uniq = [...set].filter(Boolean);
  return uniq.length ? uniq.join("、") : null;
}

/** 忌口同义词：过滤餐点时扩展匹配 */
const DIET_SYNONYMS: Record<string, string[]> = {
  牛肉: ["牛肉", "牛腩", "肥牛", "牛排", "牛肉面", "牛杂"],
  猪肉: ["猪肉", "猪排", "五花", "红烧肉", "猪蹄", "排骨"],
  羊肉: ["羊肉", "羊排", "涮羊肉"],
  鸡肉: ["鸡肉", "鸡胸", "鸡腿", "鸡翅"],
  鸭: ["鸭", "鸭肉", "烤鸭"],
  鱼: ["鱼", "鱼肉", "清蒸鱼", "三文鱼", "鲈鱼"],
  海鲜: ["海鲜", "虾", "虾仁", "蟹", "贝", "扇贝", "生蚝", "鱿鱼", "蛤蜊"],
  虾: ["虾", "虾仁"],
  蛋: ["蛋", "鸡蛋", "蛋清", "鸡蛋白"],
  奶: ["奶", "牛奶", "酸奶", "希腊酸奶", "奶茶", "奶酪"],
  乳糖: ["奶", "牛奶", "酸奶", "希腊酸奶", "奶茶"],
  花生: ["花生", "花生酱"],
  坚果: ["坚果", "花生", "杏仁", "核桃"],
  辣: ["辣", "麻辣", "香辣", "酸辣", "螺蛳粉", "火锅"],
  螺蛳粉: ["螺蛳粉"],
  面: ["面", "面条", "拉面", "方便面", "螺蛳粉"],
  米饭: ["米饭", "饭", "炒饭"],
  小麦: ["面", "面包", "馒头", "全麦"],
  麸质: ["面", "面包", "馒头", "全麦", "燕麦"],
  油炸: ["油炸", "炸鸡", "薯条"],
  甜食: ["甜", "蛋糕", "奶茶", "糖"],
};

function expandDietTokens(tokens: string[]): string[] {
  const out = new Set<string>();
  for (const raw of tokens) {
    const t = raw.replace(/^(不吃|忌口?|避免|尽量少|少吃)/, "").trim() || raw;
    out.add(t);
    for (const [key, syns] of Object.entries(DIET_SYNONYMS)) {
      if (t.includes(key) || key.includes(t)) {
        for (const s of syns) out.add(s);
      }
    }
  }
  return [...out].filter((x) => x.length >= 1);
}

/** 按忌口关键字粗过滤餐点 idea（规则优先，含同义词） */
export function filterMealIdeas(
  ideas: string[],
  dietRestrictions?: string | null,
): string[] {
  return filterMealIdeaLabels(ideas, dietRestrictions);
}

export function filterMealIdeaLabels(
  labels: string[],
  dietRestrictions?: string | null,
): string[] {
  const raw = dietRestrictions?.trim();
  if (!raw) return labels;
  const tokens = expandDietTokens(splitPreferenceTokens(raw));
  if (!tokens.length) return labels;
  const filtered = labels.filter(
    (label) => !tokens.some((t) => t.length >= 1 && label.includes(t)),
  );
  // 全滤光时回退，避免推餐空窗；调用方 tips 仍会提示偏好
  return filtered.length ? filtered : labels;
}

/** 伤病 → 应规避的动作 id / 名称关键字 */
const INJURY_BLOCKS: Array<{
  match: RegExp;
  exerciseIds: string[];
  nameKeywords: string[];
}> = [
  {
    match: /膝|膝盖|半月板|髌/,
    exerciseIds: [
      "jumping_jack",
      "jump_rope",
      "mountain_climber",
      "lunge",
      "run_intervals",
      "jog",
      "stair_climb",
      "hiking",
    ],
    nameKeywords: ["跳", "弓步", "冲刺", "开合"],
  },
  {
    match: /腰|腰椎|椎间盘/,
    exerciseIds: ["rdl", "back_squat", "dead_bug"],
    nameKeywords: ["硬拉", "早安", "负重体前屈"],
  },
  {
    match: /肩|肩袖|肩膀/,
    exerciseIds: [
      "overhead_press",
      "pike_pushup",
      "lateral_raise",
      "bench_press",
      "dumbbell_press",
    ],
    nameKeywords: ["推举", "过头", "飞鸟"],
  },
  {
    match: /腕|手腕/,
    exerciseIds: ["pushup", "plank", "pike_pushup"],
    nameKeywords: ["平板", "俯卧撑"],
  },
  {
    match: /肘/,
    exerciseIds: ["tricep_extension", "bicep_curl", "pullup"],
    nameKeywords: ["臂屈伸", "引体"],
  },
];

export function isExerciseBlockedByInjury(
  exercise: Pick<Exercise, "id" | "name"> | { id: string; name: string },
  injuryNotes?: string | null,
): boolean {
  const raw = injuryNotes?.trim();
  if (!raw) return false;
  for (const rule of INJURY_BLOCKS) {
    if (!rule.match.test(raw)) continue;
    if (rule.exerciseIds.includes(exercise.id)) return true;
    if (rule.nameKeywords.some((k) => exercise.name.includes(k))) return true;
  }
  return false;
}

/**
 * 按伤病过滤动作列表；若过滤后太少则保留原列表并依赖 tips 提示。
 */
export function filterExercisesByInjury<
  T extends { exerciseId?: string; id?: string; name: string },
>(items: T[], injuryNotes?: string | null, minKeep = 2): T[] {
  if (!injuryNotes?.trim()) return items;
  const filtered = items.filter((item) => {
    const id = item.exerciseId ?? item.id ?? "";
    const meta = id ? getExercise(id) : undefined;
    return !isExerciseBlockedByInjury(
      { id, name: meta?.name ?? item.name },
      injuryNotes,
    );
  });
  return filtered.length >= minKeep ? filtered : items;
}

/** 器械偏好是否倾向居家/徒手（影响临时推课场所） */
export function inferPlaceFromEquipmentPref(
  equipmentPref?: string | null,
  fallback: "home" | "gym" = "home",
): "home" | "gym" {
  const raw = equipmentPref?.trim() ?? "";
  if (!raw) return fallback;
  if (/健身房|器械房|杠铃|龙门|史密斯/.test(raw)) return "gym";
  if (/居家|家里|徒手|哑铃|弹力带|只有哑铃|无器械/.test(raw)) return "home";
  return fallback;
}
