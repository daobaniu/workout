"use client";

import { AppShell } from "@/components/layout/app-shell";

export function ClientAppShell({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
