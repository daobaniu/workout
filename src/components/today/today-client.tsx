"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { TodayOverviewData } from "@/components/dashboard/today-overview";
import { WeightTrendChart } from "@/components/dashboard/weight-trend-chart";
import { WeeklySummaryCard } from "@/components/dashboard/weekly-summary-card";
import { FoodLogEditor } from "@/components/food/food-log-editor";
import { TodayFoodAssist } from "@/components/food/today-food-assist";
import { MacroDashboard } from "@/components/nutrition/macro-dashboard";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { ExerciseGuideList } from "@/components/workout/exercise-guide";
import {
  rowsToSetLogs,
  WorkoutLoadForm,
} from "@/components/workout/workout-load-form";
import {
  isBeginner,
  type ExperienceLevel,
} from "@/lib/fitness/experience";
import { goalModeLabel, parseGoalMode } from "@/lib/fitness/goal-mode";
import { cn } from "cn";

function normalizeOverview(raw: Record<string, unknown>): TodayOverviewData {
  const profile = raw.profile as TodayOverviewData["profile"] | null | undefined;
  const nutrition = raw.nutrition as TodayOverviewData["nutrition"];
  const workouts = (raw.workouts as TodayOverviewData["workouts"]) ?? [];
  const todayPlan = raw.todayPlan as TodayOverviewData["todayPlan"] | null | undefined;
  const activeProgram =
    (raw.activeProgram as TodayOverviewData["activeProgram"]) ?? null;

  return {
    profile: profile
      ? {
          dailyCalorieGoal: profile.dailyCalorieGoal,
          weightKg: profile.weightKg,
          targetWeightKg: profile.targetWeightKg,
          trainingPlace: profile.trainingPlace,
          goalMode: (profile as { goalMode?: string | null }).goalMode ?? "cut",
        }
      : null,
    nutrition,
    workouts: workouts.map((w) => ({
      id: w.id,
      title: w.title,
      completed: w.completed,
      caloriesBurned: w.caloriesBurned ?? null,
      source: w.source,
    })),
    latestWeight: (raw.latestWeight as number | null) ?? null,
    weightTrend: (raw.weightTrend as string | null) ?? null,
    weightPoints: Array.isArray(raw.weightPoints)
      ? (raw.weightPoints as TodayOverviewData["weightPoints"])
      : [],
    activeProgram,
    todayPlan: todayPlan
      ? {
          title: todayPlan.title,
          estimatedMin: todayPlan.estimatedMin,
          isRestDay: todayPlan.isRestDay,
          overloadTips: Array.isArray(
            (todayPlan as { overloadTips?: string[] }).overloadTips,
          )
            ? (todayPlan as { overloadTips?: string[] }).overloadTips
            : [],
          exercises: (todayPlan.exercises ?? []).map((e) => ({
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            exerciseId: e.exerciseId,
            weightKg: e.weightKg ?? null,
            howTo: e.howTo,
            cautions: e.cautions,
            notes: e.notes,
          })),
        }
      : null,
    checkedIn: Boolean(raw.checkedIn),
  };
}

export function TodayClient({
  initialOverview,
  experienceLevel = "beginner",
}: {
  initialOverview: TodayOverviewData;
  experienceLevel?: ExperienceLevel;
}) {
  const beginner = isBeginner(experienceLevel);
  const [overview, setOverview] = useState(initialOverview);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showExercises, setShowExercises] = useState(beginner);
  const [showFoods, setShowFoods] = useState(!beginner);
  const [pendingDeleteWorkout, setPendingDeleteWorkout] = useState<{
    id: string;
    source?: "session" | "legacy";
  } | null>(null);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const res = await fetch("/api/today");
      if (res.ok) {
        const data = await res.json();
        setOverview(normalizeOverview(data));
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  const deleteWorkout = useCallback(
    async (workout: { id: string; source?: "session" | "legacy" }) => {
      const res = await fetch("/api/workouts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: workout.id,
          source: workout.source ?? "session",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        toast.add({
          type: "error",
          description:
            typeof data.error === "string" ? data.error : "删除失败",
          priority: "high",
        });
        throw new Error("delete failed");
      }
      await refresh();
    },
    [refresh],
  );

  const completeWorkout = useCallback(
    async (
      workout: { id: string; source?: "session" | "legacy" },
      setLogs?: Array<{
        exerciseId: string;
        exerciseName: string;
        setIndex?: number;
        reps: number;
        weightKg?: number | null;
        rpe?: number | null;
      }>,
    ) => {
      setBusy(`complete-${workout.id}`);
      setNotice(null);
      try {
        const res = await fetch("/api/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "complete",
            id: workout.id,
            source: workout.source ?? "session",
            setLogs,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          setNotice(
            typeof data.error === "string" ? data.error : "标记完成失败",
          );
          return;
        }
        setNotice(
          beginner
            ? setLogs?.length
              ? "训练完成，负荷已记下，下次会给你加量建议。"
              : "训练已标记完成。记得打卡哦。"
            : setLogs?.length
              ? "训练完成；负荷已入库，下次推练会参考。"
              : "训练已完成；会话完成时会顺带打卡。",
        );
        await refresh({ silent: true });
      } finally {
        setBusy(null);
      }
    },
    [beginner, refresh],
  );

  async function startToday() {
    setBusy("start");
    setNotice(null);
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_today", checkIn: false }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setNotice(
          typeof data.error === "string" ? data.error : "开练失败，请稍后再试",
        );
        return;
      }
      setNotice(
        beginner
          ? "已开始记录。练完去「打卡」页打一下卡就行。"
          : "今日训练已开始。练完可打卡，或跟对话说「训练完成了」。",
      );
      setShowExercises(true);
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  async function checkInToday() {
    setBusy("checkin");
    setNotice(null);
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_in" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setNotice(
          typeof data.error === "string" ? data.error : "打卡失败，请稍后再试",
        );
        return;
      }
      setNotice("今日已打卡，不错。");
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  const goal =
    overview.nutrition.goal ?? overview.profile?.dailyCalorieGoal ?? 1800;
  const eaten = overview.nutrition.eaten.calories ?? 0;
  const proteinGoal = overview.nutrition.proteinGoal ?? 120;
  const proteinEaten = overview.nutrition.eaten.proteinG ?? 0;
  const carbsGoal = overview.nutrition.carbsGoal ?? 180;
  const fatGoal = overview.nutrition.fatGoal ?? 50;
  const carbsEaten = overview.nutrition.eaten.carbsG ?? 0;
  const fatEaten = overview.nutrition.eaten.fatG ?? 0;
  const hasWorkout = overview.workouts.length > 0;
  const workoutDone = overview.workouts.some((w) => w.completed);
  const burned = overview.workouts.reduce(
    (sum, w) => sum + (w.caloriesBurned ?? 0),
    0,
  );
  const plan = overview.todayPlan;
  const isRest = Boolean(plan?.isRestDay);

  const nextStep = useMemo(() => {
    if (!overview.profile) {
      return {
        kind: "link" as const,
        title: "先完善档案",
        desc: beginner
          ? "填身高体重和训练经验，后面推荐会更准。"
          : "建档后才能算热量预算与推荐计划。",
        href: "/me",
        cta: "去建档",
      };
    }
    if (!overview.activeProgram) {
      return {
        kind: "link" as const,
        title: beginner ? "先选一套计划" : "尚未激活训练计划",
        desc: beginner
          ? "去计划页点「选用」，回来就能开练。"
          : "可从推荐方案启用，或自建课表。",
        href: "/programs",
        cta: beginner ? "去选用" : "管理计划",
      };
    }
    if (isRest) {
      if (!overview.checkedIn) {
        return {
          kind: "checkin" as const,
          title: "今天休息",
          desc: beginner
            ? "休息也完全 OK。想的话打个卡记一下即可。"
            : "休息日。可打卡，或跟对话改练日。",
          cta: "休息日打卡",
        };
      }
      return {
        kind: "done" as const,
        title: "休息日已打卡",
        desc: beginner ? "恢复好了明天再练。" : "需要改课可去计划页或对话。",
      };
    }
    if (!hasWorkout) {
      return {
        kind: "start" as const,
        title: plan?.title?.replace(/^.*·\s*/, "") ?? "今日训练",
        desc: beginner
          ? `约 ${plan?.estimatedMin ?? "—"} 分钟。点下方开始，跟着动作练就行。`
          : `约 ${plan?.estimatedMin ?? "—"} 分钟 · ${plan?.exercises.length ?? 0} 个动作`,
        cta: "开始今日训练",
      };
    }
    if (!workoutDone && !overview.checkedIn) {
      return {
        kind: "checkin" as const,
        title: "练完记得打卡",
        desc: beginner
          ? "训练已在记录中。做完点打卡，别忘了。"
          : "可打卡，或删除未完成的会话后重开。",
        cta: "完成并打卡",
      };
    }
    if (!overview.checkedIn) {
      return {
        kind: "checkin" as const,
        title: "今日尚未打卡",
        desc: beginner ? "练完了就打一下。" : "补个打卡，日历会更完整。",
        cta: "打卡",
      };
    }
    return {
      kind: "done" as const,
      title: "今日搞定",
      desc: beginner
        ? "吃得差不多就行，有问题去对话问我。"
        : "热量与训练都记着了；可继续微调饮食或计划。",
    };
  }, [
    beginner,
    hasWorkout,
    isRest,
    overview.activeProgram,
    overview.checkedIn,
    overview.profile,
    plan?.estimatedMin,
    plan?.exercises.length,
    plan?.title,
    workoutDone,
  ]);

  return (
    <div className="mx-auto flex w-full flex-col gap-5 px-3 py-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted-foreground">TODAY</p>
          <h1 className="font-heading text-2xl text-foreground">
            今日
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {beginner
              ? "看清下一步：热量宏量、体重趋势、练什么。"
              : "热量宏量、体重趋势、计划与周小结。"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refresh()}
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-card"
        >
          {loading ? "刷新中…" : "刷新"}
        </button>
      </header>

      {notice ? (
        <p className="rounded-lg border border-primary/20 bg-accent/50 px-3 py-2 text-sm text-foreground">
          {notice}
        </p>
      ) : null}

      {/* 下一步 */}
      <section className="rounded-2xl border border-primary/30 bg-accent/30 p-4">
        <p className="text-xs text-muted-foreground">下一步</p>
        <h2 className="mt-0.5 text-lg font-semibold text-foreground">
          {nextStep.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{nextStep.desc}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {nextStep.kind === "link" ? (
            <Link
              href={nextStep.href}
              className={cn(buttonVariants())}
            >
              {nextStep.cta}
            </Link>
          ) : null}
          {nextStep.kind === "start" ? (
            <Button disabled={busy !== null} onClick={() => startToday()}>
              {busy === "start" ? "开练中…" : nextStep.cta}
            </Button>
          ) : null}
          {nextStep.kind === "checkin" ? (
            <Button disabled={busy !== null} onClick={() => checkInToday()}>
              {busy === "checkin" ? "打卡中…" : nextStep.cta}
            </Button>
          ) : null}
          {nextStep.kind === "start" ||
          (nextStep.kind === "checkin" && !isRest) ? (
            <Button
              variant="outline"
              disabled={busy !== null}
              onClick={() => setShowExercises((v) => !v)}
            >
              {showExercises
                ? "收起动作"
                : beginner
                  ? "看看怎么做"
                  : "今日动作"}
            </Button>
          ) : null}
          {nextStep.kind === "done" && !beginner ? (
            <Link
              href="/programs"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              调整计划
            </Link>
          ) : null}
        </div>

        {showExercises && plan && !plan.isRestDay ? (
          <div className="mt-3 space-y-2">
            {plan.overloadTips?.length ? (
              <ul className="space-y-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                {plan.overloadTips.map((t) => (
                  <li key={t}>· {t}</li>
                ))}
              </ul>
            ) : null}
            <ExerciseGuideList
              idPrefix="today-page"
              exercises={plan.exercises}
            />
          </div>
        ) : null}
      </section>

      {/* 热量 + 三宏量 */}
      <section className="rounded-2xl border border-border bg-panel p-4">
        <MacroDashboard
          calories={eaten}
          calorieGoal={goal}
          proteinG={proteinEaten}
          proteinGoal={proteinGoal}
          carbsG={carbsEaten}
          carbsGoal={carbsGoal}
          fatG={fatEaten}
          fatGoal={fatGoal}
          goalModeLabel={goalModeLabel(
            parseGoalMode(
              overview.nutrition.goalMode ?? overview.profile?.goalMode,
            ),
          )}
        />

        {beginner ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>体重 {overview.latestWeight ?? "—"}kg</span>
            <span>复杂餐可去对话描述</span>
          </div>
        ) : null}

        <TodayFoodAssist
          remainingCalories={Math.max(goal - eaten, 0)}
          remainingProteinG={Math.max(proteinGoal - proteinEaten, 0)}
          proteinGoal={proteinGoal}
          proteinEaten={proteinEaten}
          onLogged={(payload) => {
            const today = payload?.today;
            if (today) {
              setOverview((prev) => ({
                ...prev,
                nutrition: {
                  ...prev.nutrition,
                  ...today,
                  carbsGoal: today.carbsGoal ?? prev.nutrition.carbsGoal,
                  fatGoal: today.fatGoal ?? prev.nutrition.fatGoal,
                },
              }));
              return;
            }
            void refresh({ silent: true });
          }}
        />

        {overview.nutrition.foods.length > 0 ? (
          <div className="mt-3">
            <button
              type="button"
              className="text-xs text-primary underline-offset-2 hover:underline"
              onClick={() => setShowFoods((v) => !v)}
            >
              {showFoods
                ? "收起饮食明细"
                : `今日已吃 ${overview.nutrition.foods.length} 项`}
            </button>
            {showFoods ? (
              <ul className="mt-2 space-y-2">
                {overview.nutrition.foods.map((f, i) =>
                  f.id ? (
                    <li key={f.id}>
                      <FoodLogEditor
                        compact
                        entry={{
                          id: f.id,
                          description: f.description,
                          calories: f.calories,
                          proteinG: f.proteinG,
                          carbsG: f.carbsG,
                          fatG: f.fatG,
                          source: f.source,
                        }}
                        onSaved={() => refresh({ silent: true })}
                        onDeleted={() => refresh({ silent: true })}
                      />
                    </li>
                  ) : (
                    <li
                      key={`${f.description}-${i}`}
                      className="flex justify-between gap-2 text-xs text-muted-foreground"
                    >
                      <span className="min-w-0 truncate">{f.description}</span>
                      <span className="shrink-0 tabular-nums">
                        {f.calories} kcal
                      </span>
                    </li>
                  ),
                )}
              </ul>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            {beginner
              ? "还没记饮食。用上面的推荐或「搜索记餐」，说不清的再去对话。"
              : "暂无饮食记录。可用推荐/搜索记餐，或对话描述复杂餐。"}
          </p>
        )}
      </section>

      {/* 体重趋势 */}
      <section className="rounded-2xl border border-border bg-panel p-4">
        <WeightTrendChart points={overview.weightPoints ?? []} />
      </section>

      {/* 周小结 */}
      <WeeklySummaryCard />

      {/* 训练记录 */}
      <section className="rounded-2xl border border-border bg-panel p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">今日训练</p>
            <h2 className="text-sm font-medium text-foreground">
              {hasWorkout
                ? `${overview.workouts.length} 条 · ${workoutDone ? "有完成" : "进行中"}`
                : isRest
                  ? "休息日"
                  : "尚未开练"}
            </h2>
          </div>
          {overview.checkedIn ? (
            <span className="text-xs text-primary">已打卡</span>
          ) : (
            <span className="text-xs text-muted-foreground">未打卡</span>
          )}
        </div>

        {!hasWorkout ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {beginner
              ? isRest
                ? "今天不用练，恢复也算进度。"
                : overview.activeProgram
                  ? "点上面「开始今日训练」就会出现记录。"
                  : "先去计划页选用一套方案。"
              : "启用计划后开练，或跟对话临时推一套。"}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {overview.workouts.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="min-w-0 truncate">{w.title}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs">
                  <span
                    className={
                      w.completed ? "text-primary" : "text-muted-foreground"
                    }
                  >
                    {w.completed ? "完成" : "待练"}
                    {w.caloriesBurned ? ` · ${w.caloriesBurned}` : ""}
                  </span>
                  {!w.completed ? (
                    <>
                      <button
                        type="button"
                        className="text-primary hover:underline disabled:opacity-50"
                        disabled={busy !== null}
                        onClick={() =>
                          completeWorkout({
                            id: w.id,
                            source: w.source,
                          })
                        }
                      >
                        {busy === `complete-${w.id}` ? "标记中…" : "勾完成"}
                      </button>
                      <button
                        type="button"
                        className="text-destructive hover:underline disabled:opacity-50"
                        disabled={busy !== null}
                        onClick={() =>
                          setPendingDeleteWorkout({
                            id: w.id,
                            source: w.source,
                          })
                        }
                      >
                        删除
                      </button>
                    </>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}

        {!workoutDone &&
        plan &&
        !plan.isRestDay &&
        overview.workouts.some((w) => !w.completed && w.source !== "legacy") ? (
          <WorkoutLoadForm
            exercises={plan.exercises}
            busy={busy !== null}
            onSubmit={async (rows) => {
              const pending = overview.workouts.find(
                (w) => !w.completed && w.source !== "legacy",
              );
              if (!pending) return;
              await completeWorkout(
                { id: pending.id, source: pending.source },
                rowsToSetLogs(rows),
              );
            }}
          />
        ) : null}

        {burned && !beginner ? (
          <p className="mt-2 text-xs text-muted-foreground">
            估算消耗 {burned} kcal
          </p>
        ) : null}

        {!beginner && overview.activeProgram ? (
          <p className="mt-3 text-xs text-muted-foreground">
            方案：{overview.activeProgram.name}
            {" · "}
            <Link href="/programs" className="text-primary underline">
              管理
            </Link>
            {" · "}
            <Link href="/checkins" className="text-primary underline">
              打卡日历
            </Link>
          </p>
        ) : beginner ? (
          <p className="mt-3 text-xs text-muted-foreground">
            有问题去{" "}
            <Link href="/" className="text-primary underline">
              对话
            </Link>{" "}
            问我就好。
          </p>
        ) : null}
      </section>

      <p className="text-xs leading-relaxed text-muted-foreground">
        建议仅供参考，非医疗指导。
      </p>

      <ConfirmDialog
        open={pendingDeleteWorkout != null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteWorkout(null);
        }}
        title="删除这条训练记录？"
        description="删除后可重新按计划开练。已完成的打卡不会自动撤销。"
        confirmLabel="删除"
        tone="destructive"
        onConfirm={async () => {
          if (!pendingDeleteWorkout) return;
          await deleteWorkout(pendingDeleteWorkout);
          setPendingDeleteWorkout(null);
        }}
      />
    </div>
  );
}
