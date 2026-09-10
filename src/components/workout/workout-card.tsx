"use client";

type WorkoutExercise = {
  name: string;
  sets: number;
  reps: string;
  notes?: string;
};

type WorkoutPlan = {
  title: string;
  estimatedMinutes: number;
  place: string;
  exercises: WorkoutExercise[];
  tips?: string[];
};

export function WorkoutCard({
  plan,
  workoutId,
}: {
  plan: WorkoutPlan;
  workoutId?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">今日训练</p>
          <h3 className="text-base font-semibold text-foreground">{plan.title}</h3>
        </div>
        <span className="rounded-md bg-accent px-2 py-1 text-xs text-primary">
          ~{plan.estimatedMinutes} 分钟 · {plan.place === "gym" ? "健身房" : "居家"}
        </span>
      </div>
      <ul className="space-y-2">
        {plan.exercises.map((ex) => (
          <li
            key={`${ex.name}-${ex.sets}-${ex.reps}`}
            className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-2 text-sm last:border-0"
          >
            <span className="font-medium text-foreground">{ex.name}</span>
            <span className="shrink-0 text-muted-foreground">
              {ex.sets} × {ex.reps}
            </span>
          </li>
        ))}
      </ul>
      {workoutId ? (
        <p className="mt-3 text-xs text-muted-foreground">
          已写入日志 · ID {workoutId.slice(0, 8)}
        </p>
      ) : null}
    </div>
  );
}
