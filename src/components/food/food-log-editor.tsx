"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";

export type FoodLogEditable = {
  id: string;
  description: string;
  calories: number;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  /** food_db:... 表示来自本地食物库 */
  source?: string | null;
};

type NutritionSummary = {
  remainingCalories?: number;
  remainingProteinG?: number;
  proteinGoal?: number;
};

export function FoodLogEditor({
  entry,
  summary,
  compact = false,
  onSaved,
  onDeleted,
}: {
  entry: FoodLogEditable;
  summary?: NutritionSummary | null;
  compact?: boolean;
  onSaved?: (entry: FoodLogEditable, today?: NutritionSummary) => void;
  onDeleted?: (id: string, today?: NutritionSummary) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [local, setLocal] = useState(entry);
  const [localSummary, setLocalSummary] = useState(summary ?? null);
  const [draft, setDraft] = useState({
    description: entry.description,
    calories: String(entry.calories),
    proteinG: entry.proteinG != null ? String(entry.proteinG) : "",
    carbsG: entry.carbsG != null ? String(entry.carbsG) : "",
    fatG: entry.fatG != null ? String(entry.fatG) : "",
  });

  async function save() {
    const calories = Number(draft.calories);
    if (!draft.description.trim()) {
      setError("描述不能为空");
      return;
    }
    if (!Number.isFinite(calories) || calories < 0) {
      setError("热量无效");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/foods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: local.id,
          description: draft.description.trim(),
          calories,
          proteinG: draft.proteinG === "" ? null : Number(draft.proteinG),
          carbsG: draft.carbsG === "" ? null : Number(draft.carbsG),
          fatG: draft.fatG === "" ? null : Number(draft.fatG),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(typeof data.error === "string" ? data.error : "保存失败");
        return;
      }
      const next: FoodLogEditable = {
        id: data.entry.id,
        description: data.entry.description,
        calories: data.entry.calories,
        proteinG: data.entry.proteinG,
        carbsG: data.entry.carbsG,
        fatG: data.entry.fatG,
        source: data.entry.source ?? local.source,
      };
      setLocal(next);
      setLocalSummary(data.today ?? localSummary);
      setEditing(false);
      onSaved?.(next, data.today);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/foods", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: local.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(typeof data.error === "string" ? data.error : "删除失败");
        throw new Error("delete failed");
      }
      onDeleted?.(local.id, data.today);
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div
        className={
          compact
            ? "space-y-2 rounded-lg border border-border bg-card/60 p-2"
            : "space-y-2 rounded-xl border border-border bg-card px-3 py-3"
        }
      >
        <Input
          value={draft.description}
          onChange={(e) =>
            setDraft((d) => ({ ...d, description: e.target.value }))
          }
          placeholder="食物描述"
          className="h-8"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={0}
            value={draft.calories}
            onChange={(e) =>
              setDraft((d) => ({ ...d, calories: e.target.value }))
            }
            placeholder="热量 kcal"
            className="h-8"
          />
          <Input
            type="number"
            min={0}
            step="0.1"
            value={draft.proteinG}
            onChange={(e) =>
              setDraft((d) => ({ ...d, proteinG: e.target.value }))
            }
            placeholder="蛋白 g"
            className="h-8"
          />
          <Input
            type="number"
            min={0}
            step="0.1"
            value={draft.carbsG}
            onChange={(e) =>
              setDraft((d) => ({ ...d, carbsG: e.target.value }))
            }
            placeholder="碳水 g"
            className="h-8"
          />
          <Input
            type="number"
            min={0}
            step="0.1"
            value={draft.fatG}
            onChange={(e) =>
              setDraft((d) => ({ ...d, fatG: e.target.value }))
            }
            placeholder="脂肪 g"
            className="h-8"
          />
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={() => save()}>
            {busy ? "保存中…" : "保存修正"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setEditing(false);
              setError(null);
              setDraft({
                description: local.description,
                calories: String(local.calories),
                proteinG: local.proteinG != null ? String(local.proteinG) : "",
                carbsG: local.carbsG != null ? String(local.carbsG) : "",
                fatG: local.fatG != null ? String(local.fatG) : "",
              });
            }}
          >
            取消
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "flex items-start justify-between gap-2 text-xs"
          : "rounded-xl border border-border bg-card px-4 py-3 text-sm"
      }
    >
      <div className="min-w-0">
        <p
          className={
            compact ? "text-muted-foreground" : "font-medium text-foreground"
          }
        >
          {compact ? null : "已记录："}
          <span className={compact ? "text-foreground" : undefined}>
            {local.description}
          </span>
          {" · "}
          <span className="tabular-nums">{local.calories} kcal</span>
          {local.proteinG != null
            ? ` · 蛋白 ${Math.round(local.proteinG)}g`
            : ""}
          {local.source?.startsWith("food_db") ? (
            <span className="ml-1 text-xs text-muted-foreground">
              · 食物库
            </span>
          ) : null}
        </p>
        {!compact &&
        localSummary &&
        typeof localSummary.remainingCalories === "number" ? (
          <p className="mt-1 text-xs text-muted-foreground">
            今日剩余约 {localSummary.remainingCalories} kcal
            {typeof localSummary.remainingProteinG === "number"
              ? ` · 蛋白还差 ${Math.round(localSummary.remainingProteinG)}g`
              : ""}
            {typeof localSummary.proteinGoal === "number"
              ? `（目标 ${localSummary.proteinGoal}g）`
              : ""}
          </p>
        ) : null}
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="text-primary underline-offset-2 hover:underline"
          disabled={busy}
          onClick={() => setEditing(true)}
        >
          改
        </button>
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="删除这条饮食记录？"
          description="删除后今日热量与宏量会同步更新，此操作不可撤销。"
          confirmLabel="删除"
          tone="destructive"
          loading={busy}
          onConfirm={remove}
          trigger={
            <button
              type="button"
              className="text-destructive underline-offset-2 hover:underline disabled:opacity-50"
              disabled={busy}
            />
          }
        >
          删
        </ConfirmDialog>
      </div>
    </div>
  );
}
