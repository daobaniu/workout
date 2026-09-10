"use client";

import { getToolName, isToolUIPart, type UIMessage } from "ai";
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
        />
      );
    }
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

  if (name === "logFood") {
    const entry = output.entry as { description?: string; calories?: number } | undefined;
    const today = output.today as { remainingCalories?: number } | undefined;
    return (
      <div
        key={callId}
        className="rounded-xl border border-border bg-card px-4 py-3 text-sm"
      >
        <p className="font-medium text-foreground">
          已记录：{entry?.description ?? "一餐"} · {entry?.calories ?? "?"} kcal
        </p>
        {typeof today?.remainingCalories === "number" ? (
          <p className="mt-1 text-xs text-muted-foreground">
            今日剩余约 {today.remainingCalories} kcal
          </p>
        ) : null}
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
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-[family-name:var(--font-display)] text-3xl text-foreground">
          燃脂搭子
        </p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          跟我说「中午吃了鸡胸米饭」「今天 30 分钟在家练」「今天吃什么」或「罗马尼亚硬拉怎么做」。
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-1 pb-4">
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
                return <ToolPartView key={`${message.id}-${part.toolCallId}`} part={part} />;
              }

              return null;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
