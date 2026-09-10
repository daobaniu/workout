"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";
import { MessageList } from "./message-list";

export function ChatPanel({ onActivity }: { onActivity?: () => void }) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
      }),
    [],
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    transport,
    onFinish: () => {
      onActivity?.();
    },
  });

  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    void sendMessage({ text });
  };

  return (
    <section className="flex h-full min-h-[28rem] flex-col rounded-2xl border border-border bg-[var(--panel)] p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted-foreground">COACH</p>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-foreground">
            对话
          </h2>
        </div>
        {busy ? (
          <button
            type="button"
            onClick={() => stop()}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground"
          >
            停止
          </button>
        ) : null}
      </div>

      <MessageList messages={messages} />

      {error ? (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error.message || "请求失败，请检查 .env 里的 OPENAI_API_KEY"}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-auto flex gap-2 pt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="记饮食、要训练、问动作…"
          className="min-w-0 flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none ring-primary placeholder:text-muted-foreground focus:ring-2"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          发送
        </button>
      </form>
    </section>
  );
}
