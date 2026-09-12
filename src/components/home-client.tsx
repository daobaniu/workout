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
    <div className="flex h-full min-h-0 flex-col gap-2 px-3 pt-3 pb-2">
      <header className="flex shrink-0 items-center justify-between gap-2">
        <h1 className="font-heading text-xl text-foreground">
          燃脂搭子
        </h1>
        {!hasProfile ? (
          <Link href="/me" className="text-xs text-primary underline">
            去建档
          </Link>
        ) : null}
      </header>

      <Link href="/today" className="shrink-0 block">
        <TodayOverview
          data={overview}
          loading={loading}
          onRefresh={refresh}
          compact
        />
      </Link>

      <div className="min-h-0 flex-1">
        <ChatPanel onActivity={refresh} />
      </div>
    </div>
  );
}
