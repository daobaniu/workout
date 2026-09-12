"use client";

import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { FoodConfirmCard } from "@/components/food/food-confirm-card";
import { FoodLogEditor } from "@/components/food/food-log-editor";
import { MealCard } from "@/components/food/meal-card";
import { SearchResultCard } from "@/components/search/search-result-card";
import { WorkoutCard } from "@/components/workout/workout-card";

function ToolPartView({ part }: { part: UIMessage["parts"][number] }) {
  if (!isToolUIPart(part)) return null;

  const name = getToolName(part);
  const callId = part.toolCallId;

  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <div
        key={callId}
        className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground"
      >
        正在调用 {name}…
      </div>
    );
  }

  if (part.state === "output-error") {
    return (
      <div
        key={callId}
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
      >
        {name} 失败：{part.errorText}
      </div>
    );
  }

  if (part.state !== "output-available") return null;

  const output = part.output as Record<string, unknown>;

  if (name === "suggestWorkout") {
    const plan = output.plan as Parameters<typeof WorkoutCard>[0]["plan"] | undefined;
    if (plan) {
      return (
        <WorkoutCard
          key={callId}
          plan={plan}
          workoutId={typeof output.workoutId === "string" ? output.workoutId : undefined}
          source="legacy"
        />
      );
    }
  }

  if (
    name === "getTodayProgramWorkout" ||
    name === "startProgramWorkout" ||
    name === "adoptBuiltinProgram" ||
    name === "createCustomProgram"
  ) {
    const todayPlan = (output.todayPlan ??
      (output.exists ? output.todayPlan : null)) as
      | {
          title: string;
          estimatedMin: number;
          exercises: Array<{ name: string; sets: number; reps: string }>;
          isRestDay?: boolean;
        }
      | null
      | undefined;

    if (todayPlan && !todayPlan.isRestDay) {
      const session = output.session as { id?: string } | undefined;
      return (
        <div key={callId} className="space-y-2">
          <WorkoutCard
            plan={{
              title: todayPlan.title,
              estimatedMinutes: todayPlan.estimatedMin,
              place: "gym",
              exercises: todayPlan.exercises,
            }}
            workoutId={session?.id}
            source="session"
          />
          {typeof output.caloriesBurned === "number" ? (
            <p className="text-xs text-muted-foreground">
              估算消耗约 {output.caloriesBurned} kcal
              {output.checkIn ? " · 已打卡" : ""}
            </p>
          ) : null}
        </div>
      );
    }
  }

  if (name === "checkInToday") {
    return (
      <div
        key={callId}
        className="rounded-xl border border-border bg-card px-4 py-3 text-sm"
      >
        <p className="font-medium text-foreground">今日已打卡</p>
      </div>
    );
  }

  if (name === "listTrainingPrograms") {
    const builtin = output.builtin as Array<{ name: string; key?: string }> | undefined;
    return (
      <div
        key={callId}
        className="rounded-xl border border-border bg-card px-4 py-3 text-sm"
      >
        <p className="font-medium text-foreground">可选计划</p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {(builtin ?? []).map((p) => (
            <li key={p.key ?? p.name} className="space-y-0.5">
              <span className="text-foreground">· {p.name}</span>
              {"days" in p && Array.isArray((p as { days?: unknown }).days) ? (
                <ul className="ml-3 space-y-1">
                  {(
                    p as {
                      days: Array<{ name: string; exercises: string[] }>;
                    }
                  ).days.map((d) => (
                    <li key={d.name}>
                      {d.name}：{d.exercises.join("、")}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (name === "suggestDailyMeals") {
    const meals = output.meals as Parameters<typeof MealCard>[0]["meals"] | undefined;
    if (meals) {
      return (
        <MealCard
          key={callId}
          meals={meals}
          remainingCalories={
            typeof output.remainingCalories === "number"
              ? output.remainingCalories
              : undefined
          }
        />
      );
    }
  }

  if (name === "webSearch") {
    if (output.ok === false) {
      return (
        <SearchResultCard
          key={callId}
          error={typeof output.error === "string" ? output.error : "搜索失败"}
        />
      );
    }
    return (
      <SearchResultCard
        key={callId}
        results={
          Array.isArray(output.results)
            ? (output.results as Array<{ title: string; url: string; snippet: string }>)
            : []
        }
      />
    );
  }

  if (name === "rememberPreferences") {
    if (output.ok === false) {
      return (
        <div
          key={callId}
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-destructive"
        >
          {typeof output.message === "string" ? output.message : "偏好未写入"}
        </div>
      );
    }
    const note =
      typeof output.preferenceNote === "string"
        ? output.preferenceNote
        : null;
    return (
      <div
        key={callId}
        className="rounded-xl border border-border bg-card px-4 py-3 text-sm"
      >
        <p className="text-xs font-medium text-primary">画像已更新</p>
        <p className="mt-1 text-muted-foreground">
          {note ?? "偏好已保存，之后推餐/推练会参考。"}
        </p>
      </div>
    );
  }

  if (name === "logFood" || name === "updateFood") {
    if (name === "logFood" && output.needsConfirm === true && output.draft) {
      const draft = output.draft as {
        description: string;
        calories: number;
        proteinG?: number;
        carbsG?: number;
        fatG?: number;
        source?: string;
      };
      return (
        <FoodConfirmCard
          key={callId}
          draft={draft}
          confidence={
            output.confidence as
              | { score?: number; level?: string; reasons?: string[] }
              | undefined
          }
          warnings={
            Array.isArray(output.warnings)
              ? (output.warnings as string[])
              : undefined
          }
        />
      );
    }

    const entry = output.entry as
      | {
          id?: string;
          description?: string;
          calories?: number;
          proteinG?: number | null;
          carbsG?: number | null;
          fatG?: number | null;
          source?: string | null;
        }
      | undefined;
    const today = output.today as
      | {
          remainingCalories?: number;
          remainingProteinG?: number;
          proteinGoal?: number;
        }
      | undefined;
    const warnings = output.warnings as string[] | undefined;

    if (entry?.id) {
      return (
        <div key={callId} className="space-y-1.5">
          <FoodLogEditor
            entry={{
              id: entry.id,
              description: entry.description ?? "一餐",
              calories: entry.calories ?? 0,
              proteinG: entry.proteinG,
              carbsG: entry.carbsG,
              fatG: entry.fatG,
              source: entry.source,
            }}
            summary={today}
          />
          {warnings && warnings.length > 0 ? (
            <ul className="space-y-0.5 px-1 text-xs text-amber-800/90 dark:text-amber-200/90">
              {warnings.map((w) => (
                <li key={w}>⚠ {w}</li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    }

    return (
      <div
        key={callId}
        className="rounded-xl border border-border bg-card px-4 py-3 text-sm"
      >
        <p className="font-medium text-foreground">
          {name === "updateFood" ? "已修正：" : "已记录："}
          {entry?.description ?? "一餐"} · {entry?.calories ?? "?"} kcal
          {typeof entry?.proteinG === "number"
            ? ` · 蛋白 ${Math.round(entry.proteinG)}g`
            : ""}
        </p>
      </div>
    );
  }

  return (
    <div
      key={callId}
      className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground"
    >
      {name} 完成
    </div>
  );
}

export function MessageList({ messages }: { messages: UIMessage[] }) {
  if (!messages.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-heading text-3xl text-foreground">
          燃脂搭子
        </p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          跟我说「记一餐」「按计划开练」「今天吃什么」，或点下方快捷入口。
          刷新后最近对话会保留；忌口/伤病可在「我的」里填写。
        </p>
      </div>
    );
  }

  return (
      <div className="flex flex-1 flex-col gap-4 px-1 pb-2">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[92%] space-y-2 ${
              message.role === "user"
                ? "rounded-2xl bg-primary px-4 py-3 text-sm text-white"
                : "w-full space-y-2"
            }`}
          >
            {message.parts.map((part, index) => {
              if (part.type === "text") {
                const text = part.text?.trim();
                if (!text) return null;

                if (message.role === "user") {
                  return <p key={`${message.id}-${index}`}>{part.text}</p>;
                }
                return (
                  <div
                    key={`${message.id}-${index}`}
                    className="whitespace-pre-wrap rounded-2xl bg-card px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm"
                  >
                    {part.text}
                  </div>
                );
              }

              if (isToolUIPart(part)) {
                return (
                  <ToolPartView
                    key={`${message.id}-${part.toolCallId}`}
                    part={part}
                  />
                );
              }

              return null;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
