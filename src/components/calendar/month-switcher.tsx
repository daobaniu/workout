"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MONTH_LABELS,
  formatYearMonth,
  isSameYearMonth,
  listYearOptions,
  shiftYearMonth,
  toYearMonth,
  type YearMonth,
} from "@/lib/calendar/year-month";

export type MonthSwitcherProps = {
  value: YearMonth;
  onChange: (next: YearMonth) => void;
  /** 年份下拉：以「今天」为中心前后各 span 年 */
  yearSpan?: number;
  /** 显示「本月」快捷跳转 */
  showTodayJump?: boolean;
  disabled?: boolean;
};

/**
 * 受控月份切换器（DIP：只依赖 YearMonth + onChange，不绑业务接口）。
 * 选月面板用 absolute 浮层，不挤占文档流布局。
 */
export function MonthSwitcher({
  value,
  onChange,
  yearSpan = 5,
  showTodayJump = true,
  disabled = false,
}: MonthSwitcherProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const today = toYearMonth();
  const isCurrent = isSameYearMonth(value, today);

  const yearItems = useMemo(() => {
    const years = listYearOptions(today.year, yearSpan);
    return years.map((y) => ({ label: `${y}年`, value: String(y) }));
  }, [today.year, yearSpan]);

  const monthItems = useMemo(
    () =>
      MONTH_LABELS.map((label, i) => ({
        label,
        value: String(i + 1),
      })),
    [],
  );

  useEffect(() => {
    if (!panelOpen) return;

    function onPointerDown(event: PointerEvent) {
      const el = rootRef.current;
      const target = event.target;
      if (!el || !(target instanceof Node)) return;
      if (el.contains(target)) return;
      // Select 下拉在 Portal 里，点选项时不要关掉月份面板
      if (
        target instanceof Element &&
        target.closest(
          '[data-slot="select-content"], [data-slot="select-item"], [data-slot="select-trigger"]',
        )
      ) {
        return;
      }
      setPanelOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPanelOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [panelOpen]);

  function patch(next: YearMonth, closePanel: boolean) {
    if (disabled) return;
    if (!isSameYearMonth(next, value)) {
      onChange(next);
    }
    if (closePanel) setPanelOpen(false);
  }

  return (
    <div ref={rootRef} className="relative z-20 w-full max-w-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => patch(shiftYearMonth(value, -1), true)}
        >
          上月
        </Button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => setPanelOpen((v) => !v)}
          className="min-w-28 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
          aria-expanded={panelOpen}
          aria-haspopup="dialog"
          title="点击快捷选月"
        >
          {formatYearMonth(value)}
          <span className="ml-1 text-xs text-muted-foreground">
            {panelOpen ? "▴" : "▾"}
          </span>
        </button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => patch(shiftYearMonth(value, 1), true)}
        >
          下月
        </Button>

        {showTodayJump && !isCurrent ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => patch(today, true)}
          >
            本月
          </Button>
        ) : null}
      </div>

      {panelOpen ? (
        <div
          role="dialog"
          aria-label="选择年月"
          className="absolute top-full left-0 z-30 mt-1.5 w-[min(100vw-2rem,20rem)] rounded-xl border border-border bg-card p-3 shadow-lg"
        >
          <div className="mb-3 grid grid-cols-2 gap-2">
            <Select
              value={String(value.year)}
              items={yearItems}
              onValueChange={(v) => {
                if (v == null) return;
                patch({ year: Number(v), month: value.month }, false);
              }}
              disabled={disabled}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {yearItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={String(value.month)}
              items={monthItems}
              onValueChange={(v) => {
                if (v == null) return;
                patch({ year: value.year, month: Number(v) }, true);
              }}
              disabled={disabled}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {monthItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {MONTH_LABELS.map((label, i) => {
              const m = i + 1;
              const active = value.month === m;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={disabled}
                  onClick={() => patch({ year: value.year, month: m }, true)}
                  className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
