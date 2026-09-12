"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ExerciseGuideList,
  type ExerciseGuideItem,
} from "@/components/workout/exercise-guide";
import {
  isBeginner,
  type ExperienceLevel,
} from "@/lib/fitness/experience";
import {
  CustomProgramBuilder,
  type CustomProgramDraft,
} from "@/components/programs/custom-program-builder";

type BuiltinItem = {
  key: string;
  name: string;
  splitType: string;
  place: string;
  notes?: string;
  level?: string;
  suggestedDaysPerWeek?: number[];
  pitch?: string;
  tags?: string[];
  dayCount: number;
  days: Array<{
    name: string;
    estimatedMin: number;
    exerciseCount: number;
    exercises?: ExerciseGuideItem[];
  }>;
};

type UserProgram = {
  id: string;
  name: string;
  source: string;
  splitType: string;
  place: string;
  isActive: boolean;
  notes?: string | null;
  dayCount: number;
  days: Array<{
    id: string;
    name: string;
    estimatedMin: number;
    exercises: ExerciseGuideItem[];
  }>;
};

type TodayPlan = {
  title: string;
  estimatedMin: number;
  isRestDay: boolean;
  exercises: ExerciseGuideItem[];
};

const SPLIT_LABEL: Record<string, string> = {
  ppl: "推拉腿",
  fullbody: "全身",
  upper_lower: "上下肢",
  custom: "自定义",
};

const LEVEL_LABEL: Record<string, string> = {
  beginner: "入门",
  intermediate: "进阶",
};

function ProgramPickCard({
  item,
  badge,
  busy,
  onAdopt,
}: {
  item: BuiltinItem;
  badge?: string;
  busy: string | null;
  onAdopt: (item: BuiltinItem) => void;
}) {
  return (
    <li className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {badge ? (
              <span className="rounded bg-primary/15 px-1.5 py-0.5 text-xs font-medium text-primary">
                {badge}
              </span>
            ) : null}
            <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {item.pitch || item.notes}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {(item.tags?.length
              ? item.tags
              : [
                  item.place === "gym" ? "健身房" : "居家",
                  SPLIT_LABEL[item.splitType] ?? item.splitType,
                  LEVEL_LABEL[item.level ?? ""] ?? "",
                ].filter(Boolean)
            ).map((t) => (
              <span
                key={t}
                className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <Button
          size="sm"
          className="shrink-0"
          disabled={busy !== null}
          onClick={() => onAdopt(item)}
        >
          {busy === item.key ? "启用中…" : "选用"}
        </Button>
      </div>
      <Accordion className="mt-2">
        <AccordionItem value="detail" className="border-0">
          <AccordionTrigger className="py-1.5 text-xs text-muted-foreground hover:no-underline">
            查看课表与动作说明
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-1">
            {item.days.map((d) => (
              <div key={d.name}>
                <p className="mb-1 text-sm font-medium">
                  {d.name}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ~{d.estimatedMin} 分钟 · {d.exerciseCount} 个动作
                  </span>
                </p>
                <ExerciseGuideList
                  idPrefix={`${item.key}-${d.name}`}
                  exercises={d.exercises ?? []}
                />
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </li>
  );
}

export function ProgramsClient({
  place,
  daysPerWeek,
  experienceLevel = "beginner",
  initialData,
}: {
  place: "home" | "gym";
  daysPerWeek: number;
  experienceLevel?: ExperienceLevel;
  initialData?: {
    recommended: BuiltinItem[];
    others: BuiltinItem[];
    programs: UserProgram[];
    todayPlan: TodayPlan | null;
  };
}) {
  const beginner = isBeginner(experienceLevel);
  const [recommended, setRecommended] = useState<BuiltinItem[]>(
    () => initialData?.recommended ?? [],
  );
  const [others, setOthers] = useState<BuiltinItem[]>(
    () => initialData?.others ?? [],
  );
  const [programs, setPrograms] = useState<UserProgram[]>(
    () => initialData?.programs ?? [],
  );
  const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(
    () => initialData?.todayPlan ?? null,
  );
  const [loading, setLoading] = useState(!initialData);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showTodayDetail, setShowTodayDetail] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<CustomProgramDraft | null>(
    null,
  );
  const [pendingDeleteProgram, setPendingDeleteProgram] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const applyPayload = useCallback((data: {
    recommended?: BuiltinItem[];
    others?: BuiltinItem[];
    programs?: UserProgram[];
    todayPlan?: TodayPlan | null;
  }) => {
    setRecommended(data.recommended ?? []);
    setOthers(data.others ?? []);
    setPrograms(data.programs ?? []);
    setTodayPlan(data.todayPlan ?? null);
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/programs`);
      const data = await res.json();
      applyPayload(data);
    } catch {
      setError("加载计划失败");
    } finally {
      setLoading(false);
    }
  }, [applyPayload]);

  useEffect(() => {
    // 已有服务端数据时不再首屏空拉，避免今日课表闪一下空状态
    if (initialData) return;

    const ac = new AbortController();

    async function load() {
      try {
        const res = await fetch(`/api/programs`, { signal: ac.signal });
        const data = await res.json();
        if (ac.signal.aborted) return;
        applyPayload(data);
      } catch {
        if (!ac.signal.aborted) setError("加载计划失败");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => ac.abort();
  }, [applyPayload, initialData]);

  const active = useMemo(() => programs.find((p) => p.isActive), [programs]);

  function openCreateBuilder() {
    setEditingDraft(null);
    setCustomOpen(true);
  }

  function openEditBuilder(p: UserProgram) {
    setEditingDraft({
      id: p.id,
      name: p.name,
      days: p.days.map((d) => ({
        key: d.id,
        name: d.name,
        exercises: d.exercises.map((e) => ({
          exerciseId: e.exerciseId ?? e.name,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          howTo: e.howTo,
          cautions: e.cautions,
          notes: e.notes,
        })),
      })),
    });
    setCustomOpen(true);
  }

  async function runAction(
    action: string,
    body: Record<string, unknown>,
    key: string,
  ) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "操作失败");
        return null;
      }
      await refresh();
      return data;
    } catch {
      setError("网络错误");
      return null;
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-5 px-3 py-4">
      <header>
        <p className="text-xs tracking-[0.2em] text-muted-foreground">PROGRAMS</p>
        <h1 className="font-(family-name:--font-display) text-2xl text-foreground">
          训练计划
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {beginner
            ? "不用纠结选哪套：先按推荐启用，今天跟着练就行。"
            : `只展示与你「${place === "gym" ? "健身房" : "居家"}」匹配的方案；也可自建。`}
        </p>
      </header>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-lg border border-primary/20 bg-accent/50 px-3 py-2 text-sm text-foreground">
          {notice}
        </p>
      ) : null}

      {/* 1. 今日课表 */}
      {loading && !active && !todayPlan ? (
        <section className="rounded-2xl border border-border bg-panel px-4 py-5 text-sm text-muted-foreground">
          加载今日课表…
        </section>
      ) : active && todayPlan ? (
        <section className="rounded-2xl border border-primary/30 bg-accent/30 p-4">
          <p className="text-xs text-muted-foreground">今日课表</p>
          <h2 className="mt-0.5 text-lg font-semibold text-foreground">
            {todayPlan.isRestDay ? "今天休息" : todayPlan.title}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            方案：{active.name}
            {!todayPlan.isRestDay
              ? ` · 约 ${todayPlan.estimatedMin} 分钟 · ${todayPlan.exercises.length} 个动作`
              : null}
          </p>

          {!todayPlan.isRestDay ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                disabled={busy !== null}
                onClick={async () => {
                  const data = await runAction(
                    "start_today",
                    { checkIn: false },
                    "start",
                  );
                  if (data?.ok) {
                    setNotice(
                      "今日训练已开始记录。练完去「打卡」页打卡，或跟我说「训练完成了」。",
                    );
                    setShowTodayDetail(true);
                  }
                }}
              >
                {busy === "start" ? "开练中…" : "开始今日训练"}
              </Button>
              <Button
                variant="outline"
                disabled={busy !== null}
                onClick={() => setShowTodayDetail((v) => !v)}
              >
                {showTodayDetail
                  ? "收起动作"
                  : beginner
                    ? "看看怎么做"
                    : "先看动作"}
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {beginner
                ? "今天休息也完全 OK，恢复好了明天再练。"
                : "休息日。需要的话可手动换日或跟对话说「今天改练某某」。"}
            </p>
          )}

          {showTodayDetail && !todayPlan.isRestDay ? (
            <div className="mt-3">
              <ExerciseGuideList
                idPrefix="today-plan"
                exercises={todayPlan.exercises}
              />
            </div>
          ) : null}
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          {beginner
            ? "还没有计划。点下面「选用」启用推荐方案，再回来点「开始今日训练」。"
            : "还没有激活的计划。可选用推荐，或展开更多方案 / 自建。"}
        </section>
      )}

      {/* 2. 推荐方案 */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            {beginner ? "就选这一套" : "为你推荐"}
          </h2>
          {beginner ? (
            <p className="text-xs text-muted-foreground">
              点「选用」启用后，回到上面「开始今日训练」即可。
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            基于{place === "gym" ? "健身房" : "居家"} · 每周 {daysPerWeek} 练
          </p>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">加载中…</p>
        ) : recommended.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无匹配推荐，看看下方更多方案。</p>
        ) : (
          <ul className="space-y-3">
            {recommended.map((item, i) => (
              <ProgramPickCard
                key={item.key}
                item={item}
                badge={i === 0 ? "最适合你" : "也不错"}
                busy={busy}
                onAdopt={(it) =>
                  runAction(
                    "adopt_builtin",
                    { key: it.key, place: it.place, activate: true },
                    it.key,
                  )
                }
              />
            ))}
          </ul>
        )}
      </section>

      {/* 3. 更多方案：小白默认收起；有基础更愿意浏览 */}
      {!loading && others.length > 0 ? (
        <section className="space-y-2">
          {beginner ? (
            <Accordion className="rounded-xl border border-border bg-card px-2">
              <AccordionItem value="more" className="border-border">
                <AccordionTrigger className="text-sm hover:no-underline">
                  其他方案
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-3 pb-1">
                    {others.map((item) => (
                      <ProgramPickCard
                        key={item.key}
                        item={item}
                        busy={busy}
                        onAdopt={(it) =>
                          runAction(
                            "adopt_builtin",
                            { key: it.key, place: it.place, activate: true },
                            it.key,
                          )
                        }
                      />
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <>
              <h2 className="text-sm font-medium text-foreground">
                全部方案
              </h2>
              <ul className="space-y-3">
                {others.map((item) => (
                  <ProgramPickCard
                    key={item.key}
                    item={item}
                    busy={busy}
                    onAdopt={(it) =>
                      runAction(
                        "adopt_builtin",
                        { key: it.key, place: it.place, activate: true },
                        it.key,
                      )
                    }
                  />
                ))}
              </ul>
            </>
          )}
        </section>
      ) : null}

      {/* 4. 我的计划 */}
      {programs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">我的计划</h2>
          <Accordion className="rounded-xl border border-border bg-card px-2">
            {programs.map((p) => (
              <AccordionItem key={p.id} value={p.id} className="border-border px-2">
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <AccordionTrigger className="w-full py-2.5 hover:no-underline">
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
                        <span className="truncate font-medium">
                          {p.name}
                          {p.isActive ? (
                            <span className="ml-2 text-xs font-normal text-primary">
                              进行中
                            </span>
                          ) : null}
                        </span>
                        <span className="truncate text-xs font-normal text-muted-foreground">
                          {SPLIT_LABEL[p.splitType] ?? p.splitType} · {p.dayCount}{" "}
                          日
                        </span>
                      </span>
                    </AccordionTrigger>
                  </div>
                  <div
                    className="flex shrink-0 items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    {p.source === "custom" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy !== null}
                        onClick={() => openEditBuilder(p)}
                      >
                        编辑
                      </Button>
                    ) : null}
                    {!p.isActive ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy !== null}
                        onClick={() =>
                          runAction("activate", { id: p.id }, `act-${p.id}`)
                        }
                      >
                        激活
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={busy !== null}
                      onClick={() =>
                        setPendingDeleteProgram({ id: p.id, name: p.name })
                      }
                    >
                      删除
                    </Button>
                  </div>
                </div>
                <AccordionContent className="space-y-3 pb-3">
                  {p.days.map((d) => (
                    <div key={d.id}>
                      <p className="mb-1.5 text-sm font-medium">
                        {d.name}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          ~{d.estimatedMin} 分钟
                        </span>
                      </p>
                      <ExerciseGuideList
                        idPrefix={`mine-${p.id}-${d.id}`}
                        exercises={d.exercises}
                      />
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ) : null}

      {/* 5. 自建：接动作库的结构化编辑器 */}
      <section className="rounded-xl border border-border bg-panel px-3 py-2">
        <button
          type="button"
          className="flex w-full items-center justify-between py-1 text-left text-sm font-medium"
          onClick={() => {
            if (customOpen) {
              setCustomOpen(false);
              setEditingDraft(null);
            } else {
              openCreateBuilder();
            }
          }}
        >
          {editingDraft?.id
            ? `编辑：${editingDraft.name}`
            : beginner
              ? "高级：自建课表"
              : "自建 / 自定义课表"}
          <span className="text-xs text-muted-foreground">
            {customOpen ? "收起" : "展开"}
          </span>
        </button>
        <p className="pb-2 text-xs text-muted-foreground">
          {beginner ? (
            <>
              可从动作库点选组课。不确定时去{" "}
              <Link href="/" className="text-primary underline">
                对话
              </Link>{" "}
              让我帮你排。
            </>
          ) : (
            <>
              从本地动作库按肌群挑选，可改组数次数；也可继续用{" "}
              <Link href="/" className="text-primary underline">
                对话
              </Link>{" "}
              改计划。
            </>
          )}
        </p>
        {customOpen ? (
          <CustomProgramBuilder
            key={editingDraft?.id ?? "new"}
            initial={editingDraft}
            place={place}
            busy={busy === "custom"}
            onCancel={() => {
              setCustomOpen(false);
              setEditingDraft(null);
            }}
            onSubmit={async (payload) => {
              const action = payload.id ? "update_custom" : "create_custom";
              const data = await runAction(
                action,
                {
                  id: payload.id,
                  name: payload.name,
                  place: payload.place,
                  splitType: payload.splitType,
                  days: payload.days,
                  activate: payload.activate,
                },
                "custom",
              );
              if (data?.ok) {
                setNotice(
                  payload.id
                    ? "课表已更新。"
                    : "自建课表已保存并激活，可看上方今日课表。",
                );
                setCustomOpen(false);
                setEditingDraft(null);
              }
            }}
          />
        ) : null}
      </section>

      <ConfirmDialog
        open={pendingDeleteProgram != null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteProgram(null);
        }}
        title="删除这份训练计划？"
        description={
          pendingDeleteProgram
            ? `「${pendingDeleteProgram.name}」删除后不可恢复。`
            : "删除后不可恢复。"
        }
        confirmLabel="删除"
        tone="destructive"
        loading={busy === `del-${pendingDeleteProgram?.id}`}
        onConfirm={async () => {
          if (!pendingDeleteProgram) return;
          const data = await runAction(
            "delete",
            { id: pendingDeleteProgram.id },
            `del-${pendingDeleteProgram.id}`,
          );
          if (!data?.ok) throw new Error("delete failed");
          setPendingDeleteProgram(null);
        }}
      />
    </div>
  );
}
