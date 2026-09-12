import type { ExperienceLevel } from "@/lib/fitness/experience";

/** 目标模式：驱动热量缺口/盈余与宏量策略（与 Prisma profile.goalMode 对齐） */
export type GoalMode = "cut" | "maintain" | "bulk";

export function parseGoalMode(value: unknown): GoalMode {
  if (value === "maintain" || value === "bulk") return value;
  if (value === "fat_loss" || value === "lose" || value === "cut") return "cut";
  if (value === "gain" || value === "muscle" || value === "surplus") return "bulk";
  return "cut";
}

export function goalModeLabel(mode: GoalMode): string {
  return GOAL_MODE_OPTIONS.find((o) => o.value === mode)?.label ?? "减脂";
}

export const GOAL_MODE_OPTIONS: Array<{
  label: string;
  value: GoalMode;
  hint: string;
}> = [
  {
    label: "减脂",
    value: "cut",
    hint: "热量低于维持，优先掉脂、尽量保肌",
  },
  {
    label: "维持",
    value: "maintain",
    hint: "吃到维持量，稳住体重与训练表现",
  },
  {
    label: "增肌",
    value: "bulk",
    hint: "小幅热量盈余，配合力量训练长肌肉",
  },
];

/** 蛋白 g/kg：减脂略高保肌；维持/增肌按常见力量训练区间 */
export function proteinGramsPerKg(
  goalMode: GoalMode,
  experienceLevel?: ExperienceLevel | string | null,
): number {
  const intermediate = experienceLevel === "intermediate";
  switch (goalMode) {
    case "cut":
      return intermediate ? 2.0 : 1.8;
    case "bulk":
      return intermediate ? 1.8 : 1.6;
    case "maintain":
    default:
      return intermediate ? 1.8 : 1.6;
  }
}
