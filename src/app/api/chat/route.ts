import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { getModelId, getOpenAIProvider } from "@/lib/ai/provider";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { fitnessTools } from "@/lib/ai/tools";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const openai = getOpenAIProvider();

    const result = streamText({
      model: openai(getModelId()),
      instructions: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools: fitnessTools,
      stopWhen: isStepCount(6),
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "聊天接口异常";
    return Response.json({ error: message }, { status: 500 });
  }
}
