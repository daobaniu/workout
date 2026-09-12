import {
  clearChatMessages,
  loadChatMessages,
  saveChatMessages,
} from "@/lib/db/chat";
import type { UIMessage } from "ai";

export async function GET() {
  const messages = await loadChatMessages();
  return Response.json({ ok: true, messages });
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages as UIMessage[] | undefined;
    if (!Array.isArray(messages)) {
      return Response.json(
        { ok: false, error: "messages 必须是数组" },
        { status: 400 },
      );
    }
    const result = await saveChatMessages(messages);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE() {
  await clearChatMessages();
  return Response.json({ ok: true });
}
