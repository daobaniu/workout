/** 训练经验水平：驱动 UI 信息密度与推荐偏好（与 Prisma profile.experienceLevel 对齐） */
export type ExperienceLevel = "beginner" | "intermediate";

export function parseExperienceLevel(value: unknown): ExperienceLevel {
  return value === "intermediate" ? "intermediate" : "beginner";
}

export function isBeginner(level: ExperienceLevel): boolean {
  return level === "beginner";
}

export const EXPERIENCE_OPTIONS: Array<{
  label: string;
  value: ExperienceLevel;
  hint: string;
}> = [
  {
    label: "健身小白",
    value: "beginner",
    hint: "刚开始或不太会安排训练，需要多说明、少选择",
  },
  {
    label: "有一定基础",
    value: "intermediate",
    hint: "熟悉常见动作，想自己调计划、看更全方案",
  },
];
