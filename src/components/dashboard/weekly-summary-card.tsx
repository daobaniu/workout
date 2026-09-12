"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import type { WeeklySummary } from "@/lib/fitness/weekly-summary";

export function WeeklySummaryCard({
  initial,
}: {
  initial?: WeeklySummary | null;
}) {
  const [summary, setSummary] = useState<WeeklySummary | null>(initial ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/weekly-summary");
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(typeof data.error === "string" ? data.error : "生成失败");
        return;
      }
      setSummary(data.summary);
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <section className="rounded-2xl border border-border bg-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">WEEKLY</p>
          <h2 className="text-sm font-medium text-foreground">本周小结</h2>
          {summary ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {summary.rangeLabel}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              规则汇总近 7 天记录，不消耗模型 Token
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => load()}
        >
          {loading ? "生成中…" : summary ? "刷新" : "生成本周小结"}
        </Button>
      </div>

      {error ? (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      ) : null}

      {summary ? (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            <Stat label="记餐天数" value={`${summary.foodLogDays}`} />
            <Stat label="打卡" value={`${summary.checkInDays}`} />
            <Stat
              label="完成训练"
              value={`${summary.completedWorkouts}`}
            />
            <Stat
              label="体重变化"
              value={
                summary.weightDelta == null
                  ? "—"
                  : summary.weightDelta === 0
                    ? "持平"
                    : `${summary.weightDelta > 0 ? "+" : ""}${summary.weightDelta}kg`
              }
            />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {summary.avgCalories != null ? (
              <span>
                日均热量 {summary.avgCalories} / 目标 {summary.calorieGoal} kcal
              </span>
            ) : null}
            {summary.avgProteinG != null ? (
              <span>
                日均蛋白 {summary.avgProteinG} / 目标 {summary.proteinGoal}g
              </span>
            ) : null}
          </div>
          <ul className="space-y-1.5 text-sm text-foreground">
            {summary.tips.map((tip) => (
              <li key={tip} className="leading-relaxed">
                · {tip}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card px-2 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
