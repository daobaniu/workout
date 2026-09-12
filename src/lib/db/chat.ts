import type { UIMessage } from "ai";
import { prisma } from "@/lib/db/prisma";

/** 落库并回传给模型窗口的最近消息条数 */
export const CHAT_HISTORY_LIMIT = 40;

export async function ensureChatSession() {
  return prisma.chatSession.upsert({
    where: { id: "local" },
    create: { id: "local" },
    update: {},
  });
}

export async function loadChatMessages(
  limit = CHAT_HISTORY_LIMIT,
): Promise<UIMessage[]> {
  await ensureChatSession();
  const rows = await prisma.chatMessage.findMany({
    where: { sessionId: "local" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const messages: UIMessage[] = [];
  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.content) as UIMessage;
      if (parsed && typeof parsed === "object" && parsed.id && parsed.role) {
        messages.push(parsed);
      }
    } catch {
      // 兼容旧纯文本
      messages.push({
        id: row.id,
        role: row.role as UIMessage["role"],
        parts: [{ type: "text", text: row.content }],
      });
    }
  }
  return messages;
}

export async function saveChatMessages(messages: UIMessage[]) {
  await ensureChatSession();
  const trimmed = messages.slice(-CHAT_HISTORY_LIMIT);

  await prisma.$transaction([
    prisma.chatMessage.deleteMany({ where: { sessionId: "local" } }),
    prisma.chatMessage.createMany({
      data: trimmed.map((m, index) => ({
        sessionId: "local",
        role: m.role,
        content: JSON.stringify(m),
        // 用顺序保证 createdAt 可区分（SQLite now 可能同秒）
        createdAt: new Date(Date.now() + index),
      })),
    }),
  ]);

  return { ok: true as const, count: trimmed.length };
}

export async function clearChatMessages() {
  await prisma.chatMessage.deleteMany({ where: { sessionId: "local" } });
  return { ok: true as const };
}
