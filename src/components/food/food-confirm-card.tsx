"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Draft = {
  description: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  source?: string;
};

type Confidence = {
  score?: number;
  level?: string;
  reasons?: string[];
};

/**
 * P2-2：低置信记餐确认卡片（确认后再写入）
 */
export function FoodConfirmCard({
  draft: initial,
  confidence,
  warnings,
  onConfirmed,
}: {
  draft: Draft;
  confidence?: Confidence | null;
  warnings?: string[];
  onConfirmed?: () => void;
}) {
  const [draft, setDraft] = useState({
    description: initial.description,
    calories: String(initial.calories),
    proteinG: initial.proteinG != null ? String(initial.proteinG) : "",
    carbsG: initial.carbsG != null ? String(initial.carbsG) : "",
    fatG: initial.fatG != null ? String(initial.fatG) : "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    const calories = Number(draft.calories);
    if (!draft.description.trim() || !Number.isFinite(calories) || calories < 0) {
      setError("请填写有效描述与热量");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: draft.description.trim(),
          calories,
          proteinG: draft.proteinG === "" ? undefined : Number(draft.proteinG),
          carbsG: draft.carbsG === "" ? undefined : Number(draft.carbsG),
          fatG: draft.fatG === "" ? undefined : Number(draft.fatG),
          source: `${initial.source ?? "chat"}|confirmed`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(typeof data.error === "string" ? data.error : "写入失败");
        return;
      }
      setDone(true);
      onConfirmed?.();
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-primary">
        已确认并记入：{draft.description} · {draft.calories} kcal
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
      <div>
        <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
          置信度偏低，请确认后再记入
          {typeof confidence?.score === "number"
            ? `（${Math.round(confidence.score * 100)}%）`
            : ""}
        </p>
        {confidence?.reasons?.length ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {confidence.reasons.join("；")}
          </p>
        ) : null}
      </div>
      <Input
        value={draft.description}
        onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
        className="h-8"
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          min={0}
          value={draft.calories}
          onChange={(e) => setDraft((d) => ({ ...d, calories: e.target.value }))}
          placeholder="热量"
          className="h-8"
        />
        <Input
          type="number"
          min={0}
          step="0.1"
          value={draft.proteinG}
          onChange={(e) => setDraft((d) => ({ ...d, proteinG: e.target.value }))}
          placeholder="蛋白 g"
          className="h-8"
        />
        <Input
          type="number"
          min={0}
          step="0.1"
          value={draft.carbsG}
          onChange={(e) => setDraft((d) => ({ ...d, carbsG: e.target.value }))}
          placeholder="碳水 g"
          className="h-8"
        />
        <Input
          type="number"
          min={0}
          step="0.1"
          value={draft.fatG}
          onChange={(e) => setDraft((d) => ({ ...d, fatG: e.target.value }))}
          placeholder="脂肪 g"
          className="h-8"
        />
      </div>
      {warnings?.length ? (
        <ul className="space-y-0.5 text-xs text-amber-800/90 dark:text-amber-200/90">
          {warnings.map((w) => (
            <li key={w}>· {w}</li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button size="sm" disabled={busy} onClick={() => confirm()}>
        {busy ? "写入中…" : "确认记入"}
      </Button>
    </div>
  );
}
