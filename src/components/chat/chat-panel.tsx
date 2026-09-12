"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useState } from "react";
import { MessageList } from "./message-list";
import { Button } from "@/components/ui/button";
import { ConfirmDialogButton } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { parseChatError } from "@/lib/utils/chat-error";

function ChatPanelInner({
  initialMessages,
  onActivity,
}: {
  initialMessages: UIMessage[];
  onActivity?: () => void;
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
      }),
    [],
  );

  const { messages, sendMessage, status, error, stop, regenerate, setMessages } =
    useChat({
      transport,
      messages: initialMessages,
      onFinish: ({ messages: next }) => {
        onActivity?.();
        fetch("/api/chat/history", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next }),
        }).catch(() => {
          /* 持久化失败不打断对话 */
        });
      },
      onError: (err) => {
        const { message } = parseChatError(err);
        toast.add({
          type: "error",
          description: message,
          priority: "high",
        });
        console.error("[ChatPanel Error]:", err);
      },
    });

  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  const parsedError = useMemo(() => {
    return error ? parseChatError(error) : null;
  }, [error]);

  const onSubmit = async (formData: FormData) => {
    const text = (formData.get("text") as string)?.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  };

  async function clearHistory() {
    await fetch("/api/chat/history", { method: "DELETE" });
    setMessages([]);
  }

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-panel p-3 md:p-4">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted-foreground">COACH</p>
          <h2 className="font-(family-name:--font-display) text-xl text-gamma md:text-2xl">
            对话
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 ? (
            <ConfirmDialogButton
              buttonLabel="清空"
              buttonVariant="outline"
              buttonSize="sm"
              buttonClassName="text-muted-foreground"
              title="清空对话记录？"
              description="将删除本地保存的最近对话，此操作不可撤销。"
              confirmLabel="确认清空"
              tone="destructive"
              onConfirm={clearHistory}
            />
          ) : null}
          {busy ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-muted-foreground"
              onClick={() => stop()}
            >
              停止
            </Button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <MessageList messages={messages} />
      </div>

      {parsedError ? (
        <div className="mt-2 flex shrink-0 items-center justify-between rounded-xl border border-red-200 bg-red-50/80 p-3 text-xs text-red-700">
          <div className="flex items-center gap-2">
            <span className="rounded bg-red-200/60 px-1.5 py-0.5 font-mono text-xs font-semibold text-red-800">
              {parsedError.code}
            </span>
            <span>{parsedError.message}</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 border-red-200 bg-red-100 text-red-800 hover:bg-red-200"
            onClick={() => regenerate()}
          >
            重试
          </Button>
        </div>
      ) : null}

      {!busy ? (
        <div className="mt-2 flex shrink-0 flex-wrap gap-2">
          {[
            {
              label: "记一餐",
              text: "中午吃了鸡胸和米饭，帮我记一下热量和蛋白",
            },
            { label: "要训练", text: "按我的计划开始今日训练" },
            {
              label: "今天吃什么",
              text: "根据今日剩余热量和蛋白，推荐今天吃什么",
            },
          ].map((chip) => (
            <Button
              key={chip.label}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setInput(chip.text);
              }}
            >
              {chip.label}
            </Button>
          ))}
        </div>
      ) : null}

      <form action={onSubmit} className="mt-2 flex shrink-0 gap-2 pt-1">
        <input
          name="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="记饮食、要训练、问动作…"
          className="min-w-0 flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none ring-primary placeholder:text-muted-foreground focus:ring-2"
        />
        <Button
          type="submit"
          disabled={busy || !input.trim()}
          className="h-auto rounded-xl px-4 py-3"
        >
          发送
        </Button>
      </form>
    </section>
  );
}

export function ChatPanel({ onActivity }: { onActivity?: () => void }) {
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/chat/history");
        const data = await res.json();
        if (cancelled) return;
        setInitialMessages(
          Array.isArray(data.messages) ? (data.messages as UIMessage[]) : [],
        );
      } catch {
        if (!cancelled) setInitialMessages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (initialMessages === null) {
    return (
      <section className="flex h-full min-h-0 flex-col items-center justify-center rounded-2xl border border-border bg-panel p-4 text-sm text-muted-foreground">
        加载对话…
      </section>
    );
  }

  return (
    <ChatPanelInner
      key={initialMessages.length ? "restored" : "fresh"}
      initialMessages={initialMessages}
      onActivity={onActivity}
    />
  );
}
