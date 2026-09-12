import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { getChatModel } from "@/lib/ai/provider";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { fitnessTools } from "@/lib/ai/tools";
import {
  getErrorMessage,
  getErrorName,
  getErrorStatus,
  type ChatApiErrorBody,
} from "./type";

export const maxDuration = 60;

/**
 * @description 聊天接口
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !Array.isArray(body.messages)) {
      const payload: ChatApiErrorBody = {
        code: "INVALID_REQUEST",
        message: "请求体解析失败，必须包含 messages 数组",
      };
      return Response.json(payload, { status: 400 });
    }

    const messages = body.messages as UIMessage[];

    const result = streamText({
      model: getChatModel(),
      instructions: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages, {
        tools: fitnessTools,
        ignoreIncompleteToolCalls: true,
      }),
      tools: fitnessTools,
      stopWhen: isStepCount(6),
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        onError: (err) => {
          const text = err instanceof Error ? err.message : String(err);
          if (/insufficient balance/i.test(text) || text.includes("402")) {
            return "AI 服务余额不足，请前往 DeepSeek / 服务商控制台充值后再试。";
          }
          if (/401|unauthorized/i.test(text)) {
            return "AI 服务密钥无效，请检查 .env 中的 OPENAI_API_KEY。";
          }
          if (/429|rate limit/i.test(text)) {
            return "请求过于频繁或额度受限，请稍后再试。";
          }
          return text || "模型请求失败，请稍后重试。";
        },
      }),
    });
  } catch (error: unknown) {
    console.error("[API/Chat Route Error]:", error);

    let statusCode = 500;
    let errorCode = "INTERNAL_SERVER_ERROR";
    let errorMessage = "系统繁忙，请稍后重试";

    const status = getErrorStatus(error);
    const message = getErrorMessage(error) ?? "";
    const name = getErrorName(error);

    if (status === 401 || message.includes("401") || message.includes("Unauthorized")) {
      statusCode = 401;
      errorCode = "UNAUTHORIZED_API_KEY";
      errorMessage = "AI 服务密钥配置无效或已过期，请检查环境变量配置。";
    } else if (
      status === 402 ||
      /insufficient balance/i.test(message) ||
      message.includes("余额")
    ) {
      statusCode = 402;
      errorCode = "INSUFFICIENT_BALANCE";
      errorMessage = "AI 服务余额不足，请前往服务商控制台充值后再试。";
    } else if (status === 429 || message.includes("429")) {
      statusCode = 429;
      errorCode = "RATE_LIMIT_EXCEEDED";
      errorMessage = "AI 服务请求频率过高或余额不足，请稍后再试。";
    } else if (
      message.includes("ModelMessage") ||
      message.includes("Invalid prompt")
    ) {
      statusCode = 400;
      errorCode = "INVALID_MESSAGE_HISTORY";
      errorMessage =
        "对话历史格式异常（常见于上次工具调用含未序列化数据）。请刷新页面后重新发送。";
    } else if (name === "AbortError" || /timeout/i.test(message)) {
      statusCode = 504;
      errorCode = "REQUEST_TIMEOUT";
      errorMessage = "模型响应超时，请尝试缩短输入文本。";
    } else if (error instanceof Error && error.message) {
      // 开发期可看到具体原因；生产仍返回上面的泛化文案时可再收紧
      errorMessage = error.message;
    }

    const payload: ChatApiErrorBody = {
      code: errorCode,
      message: errorMessage,
      details:
        process.env.NODE_ENV === "development" ? String(error) : undefined,
    };

    return Response.json(payload, { status: statusCode });
  }
}
