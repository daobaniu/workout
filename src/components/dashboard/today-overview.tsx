"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MacroDashboard } from "@/components/nutrition/macro-dashboard";
import { toast } from "@/components/ui/toast";
import { goalModeLabel, parseGoalMode } from "@/lib/fitness/goal-mode";

export type TodayOverviewData = {
  profile: {
    dailyCalorieGoal: number;
    weightKg: number | null;
    targetWeightKg: number | null;
    trainingPlace: string;
    goalMode?: string | null;
  } | null;
  nutrition: {
    goal: number;
    goalMode?: string;
    proteinGoal?: number;
    carbsGoal?: number;
    fatGoal?: number;
    eaten: {
      calories: number;
      proteinG: number;
      carbsG?: number;
      fatG?: number;
    };
    remainingCalories: number;
    remainingProteinG?: number;
    remainingCarbsG?: number;
    remainingFatG?: number;
    foods: Array<{
      id?: string;
      description: string;
      calories: number;
      proteinG?: number | null;
      carbsG?: number | null;
      fatG?: number | null;
      source?: string | null;
    }>;
  };
  workouts: Array<{
    id: string;
    title: string;
    completed: boolean;
    caloriesBurned?: number | null;
    source?: "session" | "legacy";
  }>;
  latestWeight: number | null;
  weightTrend: string | null;
  weightPoints?: Array<{ date: string; weightKg: number }>;
  activeProgram?: {
    id: string;
    name: string;
    splitType: string;
    place: string;
    dayCount: number;
  } | null;
  todayPlan?: {
    title: string;
    estimatedMin: number;
    isRestDay: boolean;
    overloadTips?: string[];
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      exerciseId?: string;
      weightKg?: number | null;
      howTo?: string;
      cautions?: string[];
      notes?: string;
    }>;
  } | null;
  checkedIn?: boolean;
};

export function TodayOverview({
  data,
  loading,
  onRefresh,
  compact = false,
  onDeleteWorkout,
}: {
  data: TodayOverviewData | null;
  loading?: boolean;
  onRefresh?: () => void;
  /** 横条摘要模式（移动端顶部） */
  compact?: boolean;
  onDeleteWorkout?: (workout: {
    id: string;
    source?: "session" | "legacy";
  }) => void | Promise<void>;
}) {
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    source?: "session" | "legacy";
  } | null>(null);

  const goal = data?.nutrition.goal ?? data?.profile?.dailyCalorieGoal ?? 1800;
  const eaten = data?.nutrition.eaten.calories ?? 0;
  const remaining = data?.nutrition.remainingCalories ?? goal;
  const proteinGoal = data?.nutrition.proteinGoal ?? 120;
  const proteinEaten = data?.nutrition.eaten.proteinG ?? 0;
  const proteinRemaining =
    data?.nutrition.remainingProteinG ??
    Math.max(proteinGoal - proteinEaten, 0);
  const carbsGoal = data?.nutrition.carbsGoal ?? 180;
  const fatGoal = data?.nutrition.fatGoal ?? 50;
  const carbsEaten = data?.nutrition.eaten.carbsG ?? 0;
  const fatEaten = data?.nutrition.eaten.fatG ?? 0;
  const workoutDone = data?.workouts.some((w) => w.completed);
  const hasWorkout = (data?.workouts.length ?? 0) > 0;
  const burned = data?.workouts.reduce(
    (sum, w) => sum + (w.caloriesBurned ?? 0),
    0,
  );
  const todayLabel = data?.todayPlan
    ? data.todayPlan.isRestDay
      ? "休息日"
      : data.todayPlan.title.replace(/^.*·\s*/, "")
    : data?.activeProgram
      ? data.activeProgram.name
      : "未选计划";
  const modeLabel = goalModeLabel(
    parseGoalMode(data?.nutrition.goalMode ?? data?.profile?.goalMode),
  );

  if (compact) {
    return (
      <div className="rounded-2xl border border-border bg-panel px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">今日 · 剩余热量 / 蛋白</p>
            <p className="truncate text-lg font-semibold tabular-nums">
              {remaining}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                kcal
              </span>
              <span className="mx-1.5 text-muted-foreground">·</span>
              {Math.round(proteinRemaining)}
              <span className="text-sm font-normal text-muted-foreground">
                g 蛋白
              </span>
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
            <span className={data?.checkedIn ? "text-primary" : "text-muted-foreground"}>
              {data?.checkedIn ? "已打卡" : "未打卡"}
            </span>
            <span className="max-w-36 truncate text-muted-foreground">
              {todayLabel}
            </span>
          </div>
        </div>
        <div className="mt-2">
          <MacroDashboard
            compact
            calories={eaten}
            calorieGoal={goal}
            proteinG={proteinEaten}
            proteinGoal={proteinGoal}
            carbsG={carbsEaten}
            carbsGoal={carbsGoal}
            fatG={fatEaten}
            fatGoal={fatGoal}
            goalModeLabel={modeLabel}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>体重 {data?.latestWeight ?? "—"}kg</span>
          {data?.weightTrend ? <span>{data.weightTrend}</span> : null}
          {burned ? <span>消耗 ~{burned}kcal</span> : null}
          <button
            type="button"
            onClick={onRefresh}
            className="text-primary underline-offset-2 hover:underline"
          >
            {loading ? "刷新中…" : "刷新"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className="flex max-h-full flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-panel p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted-foreground">TODAY</p>
          <h2 className="font-heading text-xl text-foreground">
            今日概览
          </h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-card"
        >
          {loading ? "刷新中…" : "刷新"}
        </button>
      </div>

      <MacroDashboard
        calories={eaten}
        calorieGoal={goal}
        proteinG={proteinEaten}
        proteinGoal={proteinGoal}
        carbsG={carbsEaten}
        carbsGoal={carbsGoal}
        fatG={fatEaten}
        fatGoal={fatGoal}
        goalModeLabel={modeLabel}
      />

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-card px-2 py-2">
          <p className="text-xs text-muted-foreground">体重</p>
          <p className="text-sm font-semibold tabular-nums">
            {data?.latestWeight ?? "—"}
          </p>
        </div>
        <div className="rounded-lg bg-card px-2 py-2">
          <p className="text-xs text-muted-foreground">打卡</p>
          <p
            className={`text-sm font-semibold ${
              data?.checkedIn ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {data?.checkedIn ? "已打" : "未打"}
          </p>
        </div>
      </div>

      <Accordion className="rounded-xl border border-border bg-card px-2">
        <AccordionItem value="plan" className="border-border">
          <AccordionTrigger className="py-2 text-sm hover:no-underline">
            <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
              <span className="font-medium">训练计划</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {todayLabel}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-3 text-sm">
            {data?.activeProgram ? (
              <>
                <p className="font-medium">{data.activeProgram.name}</p>
                {data.todayPlan ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    今日：
                    {data.todayPlan.isRestDay ? "休息日" : data.todayPlan.title}
                    {!data.todayPlan.isRestDay
                      ? ` · ~${data.todayPlan.estimatedMin} 分钟`
                      : ""}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                尚未激活计划，可去{" "}
                <Link href="/programs" className="underline">
                  选用方案
                </Link>
              </p>
            )}
            <div className="mt-2 flex gap-3 text-xs">
              <Link href="/programs" className="text-primary underline">
                管理计划
              </Link>
              <Link href="/checkins" className="text-primary underline">
                打卡日历
              </Link>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="workouts" className="border-border">
          <AccordionTrigger className="py-2 text-sm hover:no-underline">
            <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
              <span className="font-medium">今日训练</span>
              <span className="text-xs font-normal text-muted-foreground">
                {hasWorkout
                  ? `${data!.workouts.length} 条 · ${workoutDone ? "有完成" : "待练"}`
                  : "尚未安排"}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-3 text-sm">
            {!hasWorkout ? (
              <p className="text-xs text-muted-foreground">
                跟我说「推一套训练」或启用计划后开练
              </p>
            ) : (
              <ul className="space-y-1.5">
                {data!.workouts.map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="min-w-0 truncate">{w.title}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span
                        className={
                          w.completed ? "text-primary" : "text-muted-foreground"
                        }
                      >
                        {w.completed ? "完成" : "待练"}
                        {w.caloriesBurned ? ` · ${w.caloriesBurned}` : ""}
                      </span>
                      {!w.completed && onDeleteWorkout ? (
                        <button
                          type="button"
                          className="text-destructive hover:underline"
                          onClick={() =>
                            setPendingDelete({
                              id: w.id,
                              source: w.source,
                            })
                          }
                        >
                          删除
                        </button>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {burned ? (
              <p className="mt-2 text-xs text-muted-foreground">
                估算消耗 {burned} kcal
              </p>
            ) : null}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <p className="text-xs leading-relaxed text-muted-foreground">
        建议仅供参考，非医疗指导。
      </p>

      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="删除这条训练记录？"
        description="删除后可重新开练。"
        confirmLabel="删除"
        tone="destructive"
        onConfirm={async () => {
          if (!pendingDelete || !onDeleteWorkout) return;
          try {
            await onDeleteWorkout(pendingDelete);
            setPendingDelete(null);
          } catch {
            toast.add({
              type: "error",
              description: "删除失败",
              priority: "high",
            });
            throw new Error("delete failed");
          }
        }}
      />
    </aside>
  );
}
