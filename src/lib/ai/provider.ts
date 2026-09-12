import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";

/**
 * @description 清理环境变量值
 */
const cleanEnv = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/**
 * OpenAI 兼容网关的 baseURL 应是「根路径」，例如：
 * - https://api.deepseek.com
 * - https://open.bigmodel.cn/api/paas/v4
 *
 * 不要写成 .../chat/completions，SDK 会再拼接 /chat/completions 或 /responses。
 */
function normalizeBaseURL(raw: string): string {
  return raw
    .replace(/\/+$/, "")
    .replace(/\/chat\/completions$/i, "")
    .replace(/\/responses$/i, "");
}

/**
 * @description 获取 OpenAI 兼容提供者
 */
export const getOpenAIProvider = (): OpenAIProvider => {
  const apiKey = cleanEnv(process.env.OPENAI_API_KEY);
  if (!apiKey) {
    throw new Error("缺少 OPENAI_API_KEY，请在 .env 中填写");
  }

  const rawBaseURL = cleanEnv(process.env.OPENAI_BASE_URL);
  if (!rawBaseURL && "OPENAI_BASE_URL" in process.env) {
    delete process.env.OPENAI_BASE_URL;
  }

  const baseURL = rawBaseURL ? normalizeBaseURL(rawBaseURL) : undefined;

  return createOpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
};

/**
 * @description 获取模型 ID
 */
export const getModelId = () => {
  return cleanEnv(process.env.OPENAI_MODEL) || "gpt-4o-mini";
};

/**
 * @description 获取对话模型
 * 默认使用 Chat Completions（/chat/completions），兼容 DeepSeek / 智谱等国内网关。
 * AI SDK 里 openai(modelId) 默认走 Responses API（/responses），多数国产接口不支持。
 */
export const getChatModel = () => {
  const openai = getOpenAIProvider();
  return openai.chat(getModelId());
};
