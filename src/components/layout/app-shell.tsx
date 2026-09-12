"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "对话", icon: MessageCircle, match: (p: string) => p === "/" },
  {
    href: "/today",
    label: "今日",
    icon: CalendarDays,
    match: (p: string) => p.startsWith("/today"),
  },
  {
    href: "/programs",
    label: "计划",
    icon: Dumbbell,
    match: (p: string) => p.startsWith("/programs"),
  },
  {
    href: "/checkins",
    label: "打卡",
    icon: CheckCircle2,
    match: (p: string) => p.startsWith("/checkins"),
  },
  {
    href: "/me",
    label: "我的",
    icon: UserRound,
    match: (p: string) => p.startsWith("/me") || p.startsWith("/onboarding"),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname() || "/";

  return (
    <nav
      className="shrink-0 border-t border-border/80 bg-card/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="底部导航"
    >
      <ul className="mx-auto flex h-14 max-w-lg items-stretch justify-around px-1">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex min-w-0 flex-1">
              <Link
                href={tab.href}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-0.5 text-xs transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn("size-5", active && "stroke-[2.25px]")}
                  aria-hidden
                />
                <span className={cn(active && "font-medium")}>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const isChat = pathname === "/";

  return (
    <div className="mx-auto flex h-dvh max-h-dvh w-full max-w-lg flex-col overflow-hidden">
      <main
        className={cn(
          "min-h-0 flex-1",
          isChat ? "overflow-hidden" : "overflow-y-auto",
        )}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
