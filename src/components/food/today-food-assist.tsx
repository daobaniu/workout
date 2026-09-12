"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BoostIdea = {
  id: string;
  label: string;
  logDescription: string;
  calories: number;
  proteinG: number;
  carbsG?: number;
  fatG?: number;
};

type CatalogItem = {
  id: string;
  name: string;
  servingLabel: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  highCal?: boolean;
};

export type FoodLogTodayPayload = {
  goal: number;
  proteinGoal: number;
  carbsGoal?: number;
  fatGoal?: number;
  eaten: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  remainingCalories: number;
  remainingProteinG: number;
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

const SERVING_OPTIONS = [0.5, 1, 1.5, 2] as const;

async function postFood(body: Record<string, unknown>) {
  const res = await fetch("/api/foods", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "记入失败");
  }
  return data as {
    ok: true;
    entry: unknown;
    today?: FoodLogTodayPayload;
  };
}

/**
 * 今日页常驻：蛋白缺口 + 补蛋白点子 + 食物库快速搜索记餐
 *
 * 防闪动约定：
 * - 搜索记入只更新宏量，不重拉「下一顿」推荐（两块互不牵连）
 * - 推荐「记这顿」只本地移除该项，不整表重请求
 * - 搜索保留上一次结果；已有列表不切空态 loading
 */
export function TodayFoodAssist({
  remainingCalories,
  remainingProteinG,
  proteinGoal,
  proteinEaten,
  onLogged,
}: {
  remainingCalories: number;
  remainingProteinG: number;
  proteinGoal: number;
  proteinEaten: number;
  onLogged?: (payload?: { today?: FoodLogTodayPayload }) => void;
}) {
  const [boosts, setBoosts] = useState<BoostIdea[]>([]);
  const [boostsReady, setBoostsReady] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [servings, setServings] = useState<number>(1);
  const [showSearch, setShowSearch] = useState(false);
  const searchSeq = useRef(0);

  const loadBoosts = useCallback(async () => {
    try {
      const res = await fetch("/api/meals/suggest");
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok && Array.isArray(data.proteinBoosts)) {
        setBoosts(data.proteinBoosts);
      }
    } finally {
      setBoostsReady(true);
    }
  }, []);

  // 仅首屏拉取；记入后主动 silent 刷新，不因剩余热量变化反复闪「加载中」
  useEffect(() => {
    void loadBoosts();
  }, [loadBoosts]);

  useEffect(() => {
    if (!showSearch) return;
    const q = query.trim();
    const seq = ++searchSeq.current;
    const t = window.setTimeout(async () => {
      setSearching(true);
      try {
        const url = q
          ? `/api/foods?q=${encodeURIComponent(q)}&limit=10`
          : `/api/foods?protein=1&limit=8`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (seq !== searchSeq.current) return;
        if (res.ok && Array.isArray(data.items)) {
          setResults(data.items);
        }
      } finally {
        if (seq === searchSeq.current) setSearching(false);
      }
    }, 220);
    return () => window.clearTimeout(t);
  }, [query, showSearch]);

  async function afterLogged(data: { today?: FoodLogTodayPayload }, label: string) {
    setNotice(`已记：${label}`);
    // 只用接口 today 更新宏量；不在此处刷新推荐列表，避免无关区域闪动
    onLogged?.({ today: data.today });
  }

  async function logBoost(idea: BoostIdea) {
    setBusyId(idea.id);
    setError(null);
    setNotice(null);
    try {
      const data = await postFood({
        description: idea.logDescription,
        calories: idea.calories,
        proteinG: idea.proteinG,
        carbsG: idea.carbsG,
        fatG: idea.fatG,
        source: `meal_suggest:${idea.id}`,
      });
      await afterLogged(data, idea.label);
      // 仅从当前列表拿掉已记项，不整表重拉
      setBoosts((prev) => prev.filter((b) => b.id !== idea.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "记入失败");
    } finally {
      setBusyId(null);
    }
  }

  async function logSelected() {
    if (!selected) return;
    setBusyId(`cat-${selected.id}`);
    setError(null);
    setNotice(null);
    const factor = servings;
    const name = selected.name;
    try {
      const data = await postFood({
        description:
          factor === 1
            ? name
            : `${name}×${factor}（${selected.servingLabel}）`,
        calories: Math.round(selected.calories * factor),
        proteinG: Math.round(selected.proteinG * factor * 10) / 10,
        carbsG: Math.round(selected.carbsG * factor * 10) / 10,
        fatG: Math.round(selected.fatG * factor * 10) / 10,
        source: `food_db:${selected.id}`,
      });
      setSelected(null);
      await afterLogged(data, name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "记入失败");
    } finally {
      setBusyId(null);
    }
  }

  const gap = Math.max(remainingProteinG, 0);
  const met = gap <= 5;

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-foreground">下一顿吃什么</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {met
              ? `蛋白已接近达标（${Math.round(proteinEaten)}/${proteinGoal}g），可按饥饿感轻补`
              : `还差约 ${Math.round(gap)}g 蛋白 · 剩余 ${remainingCalories} kcal`}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 text-xs text-primary underline-offset-2 hover:underline"
          onClick={() => {
            setShowSearch((v) => !v);
            setSelected(null);
          }}
        >
          {showSearch ? "收起搜索" : "搜索记餐"}
        </button>
      </div>

      {/* 补蛋白点子：首屏前才显示加载文案，之后原地换数据 */}
      {!boostsReady ? (
        <p className="text-xs text-muted-foreground">加载推荐…</p>
      ) : boosts.length > 0 ? (
        <ul className="space-y-2">
          {boosts.map((idea) => (
            <li
              key={idea.id}
              className="flex items-start justify-between gap-2 rounded-lg bg-muted/40 px-2.5 py-2"
            >
              <div className="min-w-0">
                <p className="text-xs text-foreground">{idea.label}</p>
                <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                  约 {idea.calories} kcal · 蛋白 {Math.round(idea.proteinG)}g
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-7 shrink-0 px-2 text-xs"
                disabled={busyId === idea.id}
                onClick={() => logBoost(idea)}
              >
                {busyId === idea.id ? "…" : "记这顿"}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          暂时没有合适点子，用上方搜索或去对话描述。
        </p>
      )}

      {showSearch ? (
        <div className="space-y-2 rounded-lg border border-border bg-card/60 p-2.5">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            placeholder="搜：螺蛳粉、鸡胸、奶茶…"
            className="h-9 text-sm"
          />
          {selected ? (
            <div className="space-y-2 rounded-md bg-muted/50 px-2 py-2">
              <p className="text-xs font-medium text-foreground">
                {selected.name}
                <span className="ml-1 font-normal text-muted-foreground">
                  · {selected.servingLabel}
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SERVING_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setServings(s)}
                    className={
                      servings === s
                        ? "rounded-md bg-primary px-2 py-0.5 text-xs text-white"
                        : "rounded-md border border-border px-2 py-0.5 text-xs text-foreground"
                    }
                  >
                    ×{s}
                  </button>
                ))}
              </div>
              <p className="text-xs tabular-nums text-muted-foreground">
                将记入约 {Math.round(selected.calories * servings)} kcal · 蛋白{" "}
                {Math.round(selected.proteinG * servings)}g
              </p>
              <Button
                type="button"
                size="sm"
                className="h-8 w-full text-xs"
                disabled={busyId === `cat-${selected.id}`}
                onClick={() => logSelected()}
              >
                {busyId === `cat-${selected.id}` ? "记入中…" : "确认记入"}
              </Button>
            </div>
          ) : (
            <div className="relative">
              {searching ? (
                <p className="absolute right-1 top-0 z-10 text-xs text-muted-foreground">
                  搜索中
                </p>
              ) : null}
              <ul
                className={`max-h-40 space-y-1 overflow-y-auto ${searching && results.length === 0 ? "opacity-60" : ""}`}
              >
                {results.length === 0 ? (
                  <li className="px-1 text-xs text-muted-foreground">
                    {searching
                      ? "正在搜索…"
                      : "没找到。换个叫法，或去对话让助手估。"}
                  </li>
                ) : (
                  results.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-left text-xs hover:bg-muted"
                        onClick={() => {
                          setSelected(item);
                          setServings(1);
                        }}
                      >
                        <span className="min-w-0 truncate text-foreground">
                          {item.name}
                          {item.highCal ? (
                            <span className="ml-1 text-xs text-amber-700 dark:text-amber-300">
                              高热量
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {item.calories}kcal · P{Math.round(item.proteinG)}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {notice ? (
        <p className="text-xs text-primary">{notice}</p>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
