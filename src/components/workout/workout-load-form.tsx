"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type LoadDraftRow = {
  exerciseId: string;
  exerciseName: string;
  weightKg: string;
  reps: string;
  rpe: string;
};

type ExerciseSeed = {
  exerciseId?: string;
  name: string;
  sets: number;
  reps: string;
  weightKg?: number | null;
  notes?: string;
};

function parseFirstRep(reps: string): string {
  const m = reps.match(/(\d+)/);
  return m ? m[1] : "";
}

/**
 * P2-3：完成训练时记录顶组负荷（重量/次数/RPE）
 */
export function WorkoutLoadForm({
  exercises,
  onSubmit,
  busy,
}: {
  exercises: ExerciseSeed[];
  onSubmit: (rows: LoadDraftRow[]) => void | Promise<void>;
  busy?: boolean;
}) {
  const seeds = useMemo(
    () =>
      exercises
        .filter((e) => e.exerciseId)
        .map((e) => ({
          exerciseId: e.exerciseId!,
          exerciseName: e.name,
          weightKg: e.weightKg != null ? String(e.weightKg) : "",
          reps: parseFirstRep(e.reps),
          rpe: "",
        })),
    [exercises],
  );

  const [rows, setRows] = useState<LoadDraftRow[]>(seeds);
  const [open, setOpen] = useState(false);

  if (!seeds.length) return null;

  function patch(i: number, key: keyof LoadDraftRow, value: string) {
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)),
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <button
        type="button"
        className="text-xs text-primary underline-offset-2 hover:underline"
        onClick={() => {
          setOpen((v) => !v);
          if (!open && rows.length === 0) setRows(seeds);
        }}
      >
        {open ? "收起负荷记录" : "记录今日负荷（重量/次数/RPE）"}
      </button>
      {open ? (
        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-2">
          <p className="text-xs text-muted-foreground">
            填每个动作的顶组即可，供下次渐进超负荷。可不填直接完成。
          </p>
          {rows.map((row, i) => (
            <div key={row.exerciseId} className="space-y-1">
              <p className="text-xs font-medium text-foreground">
                {row.exerciseName}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  placeholder="kg"
                  value={row.weightKg}
                  className="h-8"
                  onChange={(e) => patch(i, "weightKg", e.target.value)}
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="次数"
                  value={row.reps}
                  className="h-8"
                  onChange={(e) => patch(i, "reps", e.target.value)}
                />
                <Input
                  type="number"
                  min={1}
                  max={10}
                  step="0.5"
                  placeholder="RPE"
                  value={row.rpe}
                  className="h-8"
                  onChange={(e) => patch(i, "rpe", e.target.value)}
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            className="w-full"
            onClick={() => onSubmit(rows)}
          >
            保存负荷并完成
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function rowsToSetLogs(rows: LoadDraftRow[]) {
  return rows
    .map((r) => {
      const reps = Number(r.reps);
      if (!Number.isFinite(reps) || reps <= 0) return null;
      const weightKg =
        r.weightKg.trim() === "" ? null : Number(r.weightKg);
      const rpe = r.rpe.trim() === "" ? null : Number(r.rpe);
      return {
        exerciseId: r.exerciseId,
        exerciseName: r.exerciseName,
        setIndex: 1,
        reps: Math.round(reps),
        weightKg:
          weightKg != null && Number.isFinite(weightKg) ? weightKg : null,
        rpe: rpe != null && Number.isFinite(rpe) ? rpe : null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);
}
