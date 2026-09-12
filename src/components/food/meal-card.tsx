"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type MealIdeaView = {
  id: string;
  label: string;
  logDescription: string;
  calories: number;
  proteinG: number;
  carbsG?: number;
  fatG?: number;
};

type Meal = {
  name: string;
  calories: number;
  proteinG?: number;
  ideas: MealIdeaView[] | string[];
};

type MealPlan = {
  totalTarget: number;
  meals: Meal[];
  tips?: string[];
};

function normalizeIdeas(ideas: Meal["ideas"]): MealIdeaView[] {
  return ideas.map((idea, i) => {
    if (typeof idea === "string") {
      return {
        id: `legacy-${i}`,
        label: idea,
        logDescription: idea,
        calories: 0,
        proteinG: 0,
      };
    }
    return idea;
  });
}

export function MealCard({
  meals,
  remainingCalories,
}: {
  meals: MealPlan;
  remainingCalories?: number;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [logged, setLogged] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function logIdea(mealName: string, idea: MealIdeaView) {
    if (idea.calories <= 0) return;
    const key = `${mealName}:${idea.id}`;
    setBusyId(key);
    setError(null);
    try {
      const res = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: `${mealName}：${idea.logDescription}`,
          calories: idea.calories,
          proteinG: idea.proteinG,
          carbsG: idea.carbsG,
          fatG: idea.fatG,
          source: `meal_suggest:${idea.id}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(typeof data.error === "string" ? data.error : "记入失败");
        return;
      }
      setLogged((prev) => ({ ...prev, [key]: data.entry?.id ?? "ok" }));
    } catch {
      setError("网络异常，请重试");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            饮食建议
          </p>
          <h3 className="text-base font-semibold text-foreground">
            今日三餐草案
          </h3>
        </div>
        <span className="rounded-md bg-accent px-2 py-1 text-xs text-primary">
          目标 {meals.totalTarget} kcal
          {typeof remainingCalories === "number"
            ? ` · 剩余 ${remainingCalories}`
            : ""}
        </span>
      </div>
      <div className="space-y-4">
        {meals.meals.map((meal) => {
          const ideas = normalizeIdeas(meal.ideas);
          return (
            <div key={meal.name} className="text-sm">
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="font-medium text-foreground">{meal.name}</span>
                <span className="text-xs text-muted-foreground">
                  预算 ~{meal.calories} kcal
                  {typeof meal.proteinG === "number"
                    ? ` · 蛋白 ~${meal.proteinG}g`
                    : ""}
                </span>
              </div>
              <ul className="space-y-2">
                {ideas.map((idea) => {
                  const key = `${meal.name}:${idea.id}`;
                  const done = Boolean(logged[key]);
                  return (
                    <li
                      key={idea.id}
                      className="flex items-start justify-between gap-2 rounded-lg bg-muted/40 px-2.5 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-foreground">{idea.label}</p>
                        {idea.calories > 0 ? (
                          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                            约 {idea.calories} kcal · 蛋白{" "}
                            {Math.round(idea.proteinG)}g
                          </p>
                        ) : null}
                      </div>
                      {idea.calories > 0 ? (
                        <Button
                          type="button"
                          size="sm"
                          variant={done ? "outline" : "default"}
                          className="h-7 shrink-0 px-2 text-xs"
                          disabled={busyId === key || done}
                          onClick={() => logIdea(meal.name, idea)}
                        >
                          {done
                            ? "已记"
                            : busyId === key
                              ? "…"
                              : "记这顿"}
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      {meals.tips && meals.tips.length > 0 ? (
        <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
          {meals.tips.slice(0, 3).map((tip) => (
            <li key={tip}>· {tip}</li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
