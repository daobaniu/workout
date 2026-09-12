"use client";

function pct(eaten: number, goal: number) {
  return Math.min(100, Math.round((eaten / Math.max(goal, 1)) * 100));
}

function MacroRow({
  label,
  eaten,
  goal,
  unit = "g",
  barClassName = "bg-foreground/70",
}: {
  label: string;
  eaten: number;
  goal: number;
  unit?: string;
  barClassName?: string;
}) {
  const p = pct(eaten, goal);
  const left = Math.max(goal - eaten, 0);
  return (
    <div>
      <div className="mb-1 flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">
            {Math.round(eaten)}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / {goal}
              {unit}
            </span>
          </p>
        </div>
        <p className="text-xs text-primary">
          {left > 0 ? `还差 ${Math.round(left)}${unit}` : "已达标"}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full transition-all ${barClassName}`}
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );
}

export function MacroDashboard({
  calories,
  calorieGoal,
  proteinG,
  proteinGoal,
  carbsG,
  carbsGoal,
  fatG,
  fatGoal,
  goalModeLabel,
  compact = false,
}: {
  calories: number;
  calorieGoal: number;
  proteinG: number;
  proteinGoal: number;
  carbsG: number;
  carbsGoal: number;
  fatG: number;
  fatGoal: number;
  goalModeLabel?: string | null;
  compact?: boolean;
}) {
  const calPct = pct(calories, calorieGoal);
  const remainingCal = Math.max(calorieGoal - calories, 0);

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${calPct}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center text-xs text-muted-foreground">
          <span>
            蛋白 {Math.round(proteinG)}/{proteinGoal}
          </span>
          <span>
            碳 {Math.round(carbsG)}/{carbsGoal}
          </span>
          <span>
            脂 {Math.round(fatG)}/{fatGoal}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <div className="h-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-foreground/70"
              style={{ width: `${pct(proteinG, proteinGoal)}%` }}
            />
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-foreground/50"
              style={{ width: `${pct(carbsG, carbsGoal)}%` }}
            />
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-foreground/40"
              style={{ width: `${pct(fatG, fatGoal)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              今日热量
              {goalModeLabel ? ` · ${goalModeLabel}` : ""}
            </p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {calories}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {calorieGoal} kcal
              </span>
            </p>
          </div>
          <p className="text-sm text-primary">剩余 {remainingCal}</p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${calPct}%` }}
          />
        </div>
      </div>

      <MacroRow
        label="蛋白质"
        eaten={proteinG}
        goal={proteinGoal}
        barClassName="bg-foreground/70"
      />
      <div className="grid grid-cols-2 gap-3">
        <MacroRow
          label="碳水"
          eaten={carbsG}
          goal={carbsGoal}
          barClassName="bg-foreground/50"
        />
        <MacroRow
          label="脂肪"
          eaten={fatG}
          goal={fatGoal}
          barClassName="bg-foreground/40"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        蛋白优先；碳/脂由热量预算推算，记餐时尽量带上三宏量。
      </p>
    </div>
  );
}
