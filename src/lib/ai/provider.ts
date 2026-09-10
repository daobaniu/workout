import { createOpenAI } from "@ai-sdk/openai";

function cleanEnv(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getOpenAIProvider() {
  const apiKey = cleanEnv(process.env.OPENAI_API_KEY);
  if (!apiKey) {
    throw new Error("缺少 OPENAI_API_KEY，请在 .env 中填写");
  }

  const baseURL = cleanEnv(process.env.OPENAI_BASE_URL);
  // SDK 会读取环境变量；空字符串会导致 baseURL 校验失败
  if (!baseURL && "OPENAI_BASE_URL" in process.env) {
    delete process.env.OPENAI_BASE_URL;
  }

  return createOpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
}

export function getModelId() {
  return cleanEnv(process.env.OPENAI_MODEL) || "gpt-4o-mini";
}
