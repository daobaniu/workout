"use client";

type Meal = {
  name: string;
  calories: number;
  ideas: string[];
};

type MealPlan = {
  totalTarget: number;
  meals: Meal[];
  tips?: string[];
};

export function MealCard({
  meals,
  remainingCalories,
}: {
  meals: MealPlan;
  remainingCalories?: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">饮食建议</p>
          <h3 className="text-base font-semibold text-foreground">今日三餐草案</h3>
        </div>
        <span className="rounded-md bg-accent px-2 py-1 text-xs text-primary">
          目标 {meals.totalTarget} kcal
          {typeof remainingCalories === "number" ? ` · 剩余 ${remainingCalories}` : ""}
        </span>
      </div>
      <div className="space-y-3">
        {meals.meals.map((meal) => (
          <div key={meal.name} className="text-sm">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="font-medium text-foreground">{meal.name}</span>
              <span className="text-muted-foreground">~{meal.calories} kcal</span>
            </div>
            <p className="text-muted-foreground">{meal.ideas.join(" / ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
