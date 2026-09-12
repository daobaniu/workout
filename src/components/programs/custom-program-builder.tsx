"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EQUIPMENT_LABELS,
  MUSCLE_LABELS,
  equipmentOptionsForPlace,
  getExercise,
  listExercises,
  type Equipment,
  type Exercise,
  type MuscleGroup,
} from "@/lib/fitness/exercises";

export type BuilderExercise = {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  howTo?: string;
  cautions?: string[];
  notes?: string;
};

export type BuilderDay = {
  key: string;
  name: string;
  exercises: BuilderExercise[];
};

export type CustomProgramDraft = {
  id?: string;
  name: string;
  days: BuilderDay[];
};

function newKey() {
  return `d-${Math.random().toString(36).slice(2, 9)}`;
}

function fromLibrary(ex: Exercise): BuilderExercise {
  return {
    exerciseId: ex.id,
    name: ex.name,
    sets: ex.defaultSets,
    reps: ex.defaultReps,
    howTo: ex.howTo,
    cautions: ex.cautions,
    notes: ex.notes,
  };
}

function emptyDay(index: number): BuilderDay {
  return {
    key: newKey(),
    name: `第 ${index + 1} 日`,
    exercises: [],
  };
}

const MUSCLE_FILTERS: Array<MuscleGroup | "all"> = [
  "all",
  "cardio",
  "chest",
  "back",
  "shoulders",
  "legs",
  "glutes",
  "core",
  "arms",
  "full",
];

export function CustomProgramBuilder({
  initial,
  place,
  onCancel,
  onSubmit,
  busy,
}: {
  initial?: CustomProgramDraft | null;
  place: "home" | "gym";
  onCancel?: () => void;
  onSubmit: (payload: {
    id?: string;
    name: string;
    place: "home" | "gym";
    splitType: "custom";
    days: Array<{
      dayIndex: number;
      name: string;
      focus: string;
      estimatedMin: number;
      exercises: BuilderExercise[];
    }>;
    activate: boolean;
  }) => void | Promise<void>;
  busy?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "我的训练计划");
  const [days, setDays] = useState<BuilderDay[]>(
    () =>
      initial?.days?.length
        ? initial.days.map((d) => ({
            ...d,
            key: d.key || newKey(),
            exercises: d.exercises.map((e) => ({ ...e })),
          }))
        : [emptyDay(0), emptyDay(1), emptyDay(2)],
  );
  const [activeDay, setActiveDay] = useState(0);
  const [muscle, setMuscle] = useState<MuscleGroup | "all">("all");
  const [equipment, setEquipment] = useState<Equipment | "all">("all");
  const [query, setQuery] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [customName, setCustomName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const equipmentFilters = useMemo(
    () => equipmentOptionsForPlace(place),
    [place],
  );

  const effectiveEquipment = equipmentFilters.includes(equipment)
    ? equipment
    : "all";

  const catalog = useMemo(
    () =>
      listExercises({
        muscle,
        equipment: effectiveEquipment,
        query,
        place,
      }),
    [muscle, effectiveEquipment, query, place],
  );

  const current = days[activeDay] ?? days[0];

  function updateDay(index: number, patch: Partial<BuilderDay>) {
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    );
  }

  function addExercise(ex: BuilderExercise) {
    if (!current) return;
    setDays((prev) =>
      prev.map((d, i) =>
        i === activeDay
          ? {
              ...d,
              exercises: [...d.exercises, ex],
            }
          : d,
      ),
    );
  }

  function patchExercise(
    dayIndex: number,
    exIndex: number,
    patch: Partial<BuilderExercise>,
  ) {
    setDays((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d;
        return {
          ...d,
          exercises: d.exercises.map((e, j) =>
            j === exIndex ? { ...e, ...patch } : e,
          ),
        };
      }),
    );
  }

  function removeExercise(dayIndex: number, exIndex: number) {
    setDays((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d;
        return {
          ...d,
          exercises: d.exercises.filter((_, j) => j !== exIndex),
        };
      }),
    );
  }

  function addDay() {
    setDays((prev) => [...prev, emptyDay(prev.length)]);
    setActiveDay(days.length);
  }

  function removeDay(index: number) {
    if (days.length <= 1) {
      setError("至少保留一天");
      return;
    }
    setDays((prev) => prev.filter((_, i) => i !== index));
    setActiveDay((i) => Math.max(0, Math.min(i, days.length - 2)));
  }

  function buildPayload(activate: boolean) {
    const cleaned = days
      .map((d, dayIndex) => ({
        dayIndex,
        name: d.name.trim() || `第 ${dayIndex + 1} 日`,
        focus: "custom",
        estimatedMin: Math.max(20, d.exercises.length * 8),
        exercises: d.exercises
          .filter((e) => e.name.trim())
          .map((e) => {
            const meta = e.exerciseId ? getExercise(e.exerciseId) : undefined;
            return {
              exerciseId: e.exerciseId || e.name.trim(),
              name: e.name.trim(),
              sets: Number(e.sets) > 0 ? Number(e.sets) : 3,
              reps: e.reps.trim() || "8-12",
              howTo: e.howTo ?? meta?.howTo,
              cautions: e.cautions ?? meta?.cautions,
              notes: e.notes ?? meta?.notes,
            };
          }),
      }))
      .filter((d) => d.exercises.length > 0);

    return {
      id: initial?.id,
      name: name.trim() || "我的训练计划",
      place,
      splitType: "custom" as const,
      days: cleaned,
      activate,
    };
  }

  async function submit(activate: boolean) {
    setError(null);
    const payload = buildPayload(activate);
    if (!payload.days.length) {
      setError("请至少安排一天，并加入动作");
      return;
    }
    await onSubmit(payload);
  }

  return (
    <div className="space-y-4 border-t border-border pt-3">
      <div className="space-y-2">
        <Label htmlFor="builder-name">计划名称</Label>
        <Input
          id="builder-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：居家三分化"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {days.map((d, i) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setActiveDay(i)}
            className={`rounded-lg border px-2.5 py-1 text-xs ${
              i === activeDay
                ? "border-primary bg-accent text-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {d.name || `第 ${i + 1} 日`}
            <span className="ml-1 tabular-nums opacity-70">
              ({d.exercises.length})
            </span>
          </button>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={addDay}>
          + 加一天
        </Button>
      </div>

      {current ? (
        <div className="space-y-3 rounded-xl border border-border bg-card p-3">
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <Label htmlFor="day-name">当日名称</Label>
              <Input
                id="day-name"
                value={current.name}
                onChange={(e) =>
                  updateDay(activeDay, { name: e.target.value })
                }
                placeholder="推日 / 拉日 / 腿日…"
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => removeDay(activeDay)}
            >
              删日
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">已选动作</p>
            {current.exercises.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                从下方动作库点选，或添加自定义动作。
              </p>
            ) : (
              <ul className="space-y-2">
                {current.exercises.map((ex, exIndex) => (
                  <li
                    key={`${ex.exerciseId}-${exIndex}`}
                    className="grid grid-cols-[1fr_4rem_5rem_auto] items-center gap-1.5"
                  >
                    <Input
                      value={ex.name}
                      onChange={(e) =>
                        patchExercise(activeDay, exIndex, {
                          name: e.target.value,
                        })
                      }
                      className="h-8"
                    />
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={ex.sets}
                      onChange={(e) =>
                        patchExercise(activeDay, exIndex, {
                          sets: Number(e.target.value) || 1,
                        })
                      }
                      className="h-8"
                      aria-label="组数"
                    />
                    <Input
                      value={ex.reps}
                      onChange={(e) =>
                        patchExercise(activeDay, exIndex, {
                          reps: e.target.value,
                        })
                      }
                      className="h-8"
                      aria-label="次数"
                      placeholder="8-12"
                    />
                    <button
                      type="button"
                      className="px-1 text-xs text-destructive"
                      onClick={() => removeExercise(activeDay, exIndex)}
                    >
                      删
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-medium text-foreground">动作库</p>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索动作名"
              className="h-8"
            />
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">目标肌群</p>
              <div className="flex flex-wrap gap-1">
                {MUSCLE_FILTERS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMuscle(m)}
                    className={`rounded-md px-2 py-0.5 text-xs ${
                      muscle === m
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {m === "all" ? "全部" : MUSCLE_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                器械
                {place === "home" ? "（居家）" : "（健身房）"}
              </p>
              <div className="flex flex-wrap gap-1">
                {equipmentFilters.map((eq) => (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => setEquipment(eq)}
                    className={`rounded-md px-2 py-0.5 text-xs ${
                      effectiveEquipment === eq
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {eq === "all" ? "全部" : EQUIPMENT_LABELS[eq]}
                  </button>
                ))}
              </div>
            </div>
            <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border/70 p-1.5">
              {catalog.map((ex) => (
                <li key={ex.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                    onClick={() => addExercise(fromLibrary(ex))}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-foreground">
                        {ex.name}
                      </span>
                      <span className="text-muted-foreground">
                        {ex.equipment
                          .map((eq) => EQUIPMENT_LABELS[eq])
                          .join("·")}
                      </span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {ex.defaultSets}×{ex.defaultReps}
                    </span>
                  </button>
                </li>
              ))}
              {catalog.length === 0 ? (
                <li className="px-2 py-2 text-xs text-muted-foreground">
                  没有匹配动作，可换筛选项或下方自定义添加。
                </li>
              ) : null}
            </ul>
            <div className="flex gap-2">
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="自定义动作名"
                className="h-8"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const n = customName.trim();
                  if (!n) return;
                  addExercise({
                    exerciseId: `custom_${n}`,
                    name: n,
                    sets: 3,
                    reps: "8-12",
                  });
                  setCustomName("");
                }}
              >
                添加
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-dashed border-border px-3 py-2">
        <button
          type="button"
          className="text-xs text-primary underline-offset-2 hover:underline"
          onClick={() => setShowPreview((v) => !v)}
        >
          {showPreview ? "收起预览" : "预览整份课表"}
        </button>
        {showPreview ? (
          <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
            {days.map((d, i) => (
              <li key={d.key}>
                <p className="font-medium text-foreground">
                  {d.name || `第 ${i + 1} 日`}
                </p>
                <p>
                  {d.exercises.length
                    ? d.exercises
                        .map((e) => `${e.name} ${e.sets}×${e.reps}`)
                        .join(" · ")
                    : "（空）"}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={busy}
          onClick={() => submit(true)}
        >
          {busy
            ? "保存中…"
            : initial?.id
              ? "保存修改并激活"
              : "保存并激活"}
        </Button>
        {initial?.id ? (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => submit(false)}
          >
            仅保存不切换激活
          </Button>
        ) : null}
        {onCancel ? (
          <Button variant="ghost" disabled={busy} onClick={onCancel}>
            取消
          </Button>
        ) : null}
      </div>
    </div>
  );
}
