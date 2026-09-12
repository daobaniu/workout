"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
} from "date-fns";
import { MonthSwitcher } from "@/components/calendar/month-switcher";
import { Button } from "@/components/ui/button";
import {
  isSameYearMonth,
  toYearMonth,
  yearMonthKey,
  yearMonthToDate,
  type YearMonth,
} from "@/lib/calendar/year-month";

type CheckInRow = {
  dateKey: string;
  note: string | null;
  workoutSessionId: string | null;
};

type SessionRow = {
  id: string;
  date: string;
  title: string;
  completed: boolean;
  caloriesBurned: number | null;
};

export function CheckInsClient() {
  const [cursor, setCursor] = useState<YearMonth>(() => toYearMonth());
  const [checkIns, setCheckIns] = useState<CheckInRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  /** 当前列表数据对应的年月 key，与 view 不一致时不展示旧数据 */
  const [dataKey, setDataKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { year, month } = cursor;
  const viewKey = yearMonthKey(cursor);
  const dataReady = dataKey === viewKey;
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const cursorDate = useMemo(() => yearMonthToDate(cursor), [cursor]);

  useEffect(() => {
    const ac = new AbortController();

    async function load() {
      try {
        const res = await fetch(`/api/checkins?year=${year}&month=${month}`, {
          signal: ac.signal,
        });
        const data = await res.json();
        if (ac.signal.aborted) return;
        setCheckIns(data.checkIns ?? []);
        setSessions(
          (data.sessions ?? []).map(
            (s: {
              id: string;
              date: string;
              title: string;
              completed: boolean;
              caloriesBurned: number | null;
            }) => ({
              ...s,
              date: typeof s.date === "string" ? s.date : String(s.date),
            }),
          ),
        );
        setDataKey(yearMonthKey({ year, month }));
      } catch {
        // 取消请求或网络错误时忽略
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => ac.abort();
  }, [year, month]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/checkins?year=${year}&month=${month}`);
      const data = await res.json();
      setCheckIns(data.checkIns ?? []);
      setSessions(
        (data.sessions ?? []).map(
          (s: {
            id: string;
            date: string;
            title: string;
            completed: boolean;
            caloriesBurned: number | null;
          }) => ({
            ...s,
            date: typeof s.date === "string" ? s.date : String(s.date),
          }),
        ),
      );
      setDataKey(yearMonthKey({ year, month }));
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  const checked = useMemo(
    () => new Set(checkIns.map((c) => c.dateKey)),
    [checkIns],
  );

  const days = useMemo(() => {
    const start = startOfMonth(cursorDate);
    const end = endOfMonth(cursorDate);
    return eachDayOfInterval({ start, end });
  }, [cursorDate]);

  const leadingBlanks = (getDay(startOfMonth(cursorDate)) + 6) % 7;

  function changeMonth(next: YearMonth) {
    if (isSameYearMonth(next, cursor)) return;
    setLoading(true);
    setCursor(next);
  }

  async function toggleToday() {
    setBusy(true);
    setMessage(null);
    try {
      if (checked.has(todayKey)) {
        const res = await fetch("/api/checkins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "undo", dateKey: todayKey }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessage(data.error ?? "取消失败");
          return;
        }
        setMessage("已取消今日打卡");
      } else {
        const res = await fetch("/api/checkins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "check_in", note: "手动打卡" }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessage(data.error ?? "打卡失败");
          return;
        }
        setMessage("今日已打卡");
      }
      // 打卡后若当前不在本月，顺带跳回本月看结果
      const todayYm = toYearMonth();
      if (!isSameYearMonth(cursor, todayYm)) {
        changeMonth(todayYm);
      } else {
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  const monthBurn = dataReady
    ? sessions.reduce((sum, s) => sum + (s.caloriesBurned ?? 0), 0)
    : null;
  const checkInCount = dataReady ? checkIns.length : null;
  const sessionCount = dataReady ? sessions.length : null;

  return (
    <div className="mx-auto flex w-full flex-col gap-5 px-3 py-4">
      <header>
        <p className="text-xs tracking-[0.2em] text-muted-foreground">CHECK-IN</p>
        <h1 className="font-heading text-2xl text-foreground">
          训练打卡
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          日历记录坚持天数；完成计划训练时会自动打卡。
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <MonthSwitcher value={cursor} onChange={changeMonth} disabled={busy} />
        <div className="flex min-h-8 shrink-0 items-center gap-2 self-start">
          <Button disabled={busy} onClick={() => toggleToday()}>
            {busy
              ? "处理中…"
              : dataReady && checked.has(todayKey)
                ? "取消今日打卡"
                : "今日打卡"}
          </Button>
          <p className="min-w-0 text-sm text-primary">{message ?? "\u00a0"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm">
        <div className="min-w-0">
          <span className="text-muted-foreground">打卡 </span>
          <span className="font-semibold tabular-nums">{checkInCount ?? "—"}</span>
        </div>
        <div className="h-3 w-px shrink-0 bg-border" />
        <div className="min-w-0">
          <span className="text-muted-foreground">训练 </span>
          <span className="font-semibold tabular-nums">{sessionCount ?? "—"}</span>
        </div>
        <div className="h-3 w-px shrink-0 bg-border" />
        <div className="min-w-0">
          <span className="text-muted-foreground">消耗 </span>
          <span className="font-semibold tabular-nums">{monthBurn ?? "—"}</span>
          <span className="text-xs text-muted-foreground"> kcal</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-panel p-4">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <span key={`b-${i}`} />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const isChecked = dataReady && checked.has(key);
            const isToday = key === todayKey;
            return (
              <div
                key={key}
                className={`flex aspect-square flex-col items-center justify-center rounded-lg text-sm ${
                  isChecked
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground"
                } ${isToday ? "ring-2 ring-primary/40" : ""}`}
                title={key}
              >
                <span className="tabular-nums">{format(day, "d")}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 min-h-4 text-center text-xs text-muted-foreground">
          {loading ? "正在更新本月记录…" : "\u00a0"}
        </p>
      </div>
    </div>
  );
}
