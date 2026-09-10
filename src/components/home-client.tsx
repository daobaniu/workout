"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ChatPanel } from "@/components/chat/chat-panel";
import {
  TodayOverview,
  type TodayOverviewData,
} from "@/components/dashboard/today-overview";

export function HomeClient({
  initialOverview,
  hasProfile,
}: {
  initialOverview: TodayOverviewData;
  hasProfile: boolean;
}) {
  const [overview, setOverview] = useState(initialOverview);
  const [loading, setLoading] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/today");
      if (res.ok) {
        const data = (await res.json()) as TodayOverviewData;
        setOverview(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-4 px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.25em] text-muted-foreground">
            FAT LOSS AGENT
          </p>
          <h1 className="font-(family-name:--font-display) text-4xl text-foreground md:text-5xl">
            燃脂搭子
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            记饮食 · 推力量训练 · 推每日饮食 · 必要时联网查证
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2 text-xs md:hidden"
            onClick={() => setOverviewOpen((v) => !v)}
          >
            {overviewOpen ? "收起概览" : "今日概览"}
          </button>
          <Link
            href="/onboarding"
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground"
          >
            {hasProfile ? "修改档案" : "先建档"}
          </Link>
        </div>
      </header>

      {!hasProfile ? (
        <div className="rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          还没有个人档案。建议先{" "}
          <Link href="/onboarding" className="font-medium underline">
            完成建档
          </Link>
          ，热量预算和训练推荐会更准。
        </div>
      ) : null}

      <div className="grid flex-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className={`${overviewOpen ? "block" : "hidden"} md:block`}>
          <TodayOverview data={overview} loading={loading} onRefresh={refresh} />
        </div>
        <ChatPanel onActivity={refresh} />
      </div>
    </div>
  );
}
