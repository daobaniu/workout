import type { ProgramDraft, TrainingPlace } from "./types";

export type ProgramRecommendContext = {
  place: TrainingPlace;
  daysPerWeek: number;
  experienceLevel?: "beginner" | "intermediate";
};

/**
 * 按档案给内置方案打分排序（单一职责：只做推荐，不碰持久化）。
 * 开闭：新方案只要带 pitch/tags/suggestedDays，这里规则可继续复用。
 */
export function rankBuiltinPrograms(
  builtins: ProgramDraft[],
  ctx: ProgramRecommendContext,
) {
  // 只推荐与档案训练场所一致的方案（居家不混健身房）
  const scoped = builtins.filter((p) => p.place === ctx.place);
  const scored = scoped.map((p) => ({
    program: p,
    score: scoreProgram(p, ctx),
  }));
  scored.sort((a, b) => b.score - a.score);

  const recommended = scored.filter((s) => s.score >= 40).slice(0, 2);
  const recommendedKeys = new Set(
    recommended.map((s) => s.program.key ?? s.program.name),
  );
  const others = scored
    .map((s) => s.program)
    .filter((p) => !recommendedKeys.has(p.key ?? p.name));

  return {
    recommended: recommended.map((s) => s.program),
    others,
  };
}

function scoreProgram(p: ProgramDraft, ctx: ProgramRecommendContext): number {
  let score = 0;
  if (p.place === ctx.place) score += 50;
  else score -= 20;

  const suggested = p.suggestedDaysPerWeek ?? [];
  if (suggested.includes(ctx.daysPerWeek)) score += 40;
  else if (suggested.some((d) => Math.abs(d - ctx.daysPerWeek) <= 1)) score += 15;

  const experience = ctx.experienceLevel ?? "beginner";
  if (experience === "beginner") {
    if (p.level === "beginner") score += 25;
    if (p.level === "intermediate") score -= 10;
  } else {
    if (p.level === "intermediate") score += 20;
    if (p.level === "beginner") score += 5;
  }

  if (p.level === "beginner" && ctx.daysPerWeek <= 3) score += 10;
  if (p.level === "intermediate" && ctx.daysPerWeek >= 4) score += 10;

  return score;
}
