"use client";

import { useState } from "react";
import {
  ExerciseGuideList,
  type ExerciseGuideItem,
} from "@/components/workout/exercise-guide";
import {
  rowsToSetLogs,
  WorkoutLoadForm,
} from "@/components/workout/workout-load-form";
import { Button } from "@/components/ui/button";

type WorkoutPlan = {
  title: string;
  estimatedMinutes: number;
  place: string;
  exercises: ExerciseGuideItem[];
  tips?: string[];
};

export function WorkoutCard({
  plan,
  workoutId,
  source = "session",
  onCompleted,
}: {
  plan: WorkoutPlan;
  workoutId?: string;
  source?: "session" | "legacy";
  onCompleted?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function complete(setLogs?: ReturnType<typeof rowsToSetLogs>) {
    if (!workoutId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          id: workoutId,
          source,
          setLogs: source === "session" ? setLogs : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(typeof data.error === "string" ? data.error : "标记失败");
        return;
      }
      setDone(true);
      onCompleted?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            今日训练
          </p>
          <h3 className="text-base font-semibold text-foreground">{plan.title}</h3>
        </div>
        <span className="rounded-md bg-accent px-2 py-1 text-xs text-primary">
          ~{plan.estimatedMinutes} 分钟 ·{" "}
          {plan.place === "gym" ? "健身房" : "居家"}
        </span>
      </div>
      <ExerciseGuideList
        idPrefix={`workout-${plan.title}`}
        exercises={plan.exercises}
      />
      {plan.tips?.length ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {plan.tips.join("；")}
        </p>
      ) : null}
      {workoutId ? (
        <div className="mt-3 space-y-2">
          {done ? (
            <p className="text-xs text-primary">已标记完成</p>
          ) : (
            <>
              <Button size="sm" disabled={busy} onClick={() => complete()}>
                {busy ? "标记中…" : "勾选完成"}
              </Button>
              {source === "session" ? (
                <WorkoutLoadForm
                  exercises={plan.exercises}
                  busy={busy}
                  onSubmit={async (rows) => {
                    await complete(rowsToSetLogs(rows));
                  }}
                />
              ) : null}
            </>
          )}
          <p className="text-xs text-muted-foreground">
            已写入日志 · ID {workoutId.slice(0, 8)}
          </p>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
