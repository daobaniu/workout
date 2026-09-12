// chat 错误处理解析工具
import { ApiErrorResponse } from "@/app/api/type";

export const parseChatError = (
  error: Error,
): { code: string; message: string } => {
  const raw = error.message || "";

  // 1. 尝试解析 SDK Transport 抛出的 JSON 字符串
  try {
    const parsed = JSON.parse(raw) as ApiErrorResponse;
    if (parsed && typeof parsed.message === "string") {
      return {
        code: parsed.code || "API_ERROR",
        message: parsed.message,
      };
    }
  } catch {
    // 非 JSON，继续下面映射
  }

  if (/insufficient balance/i.test(raw) || raw.includes("402")) {
    return {
      code: "INSUFFICIENT_BALANCE",
      message: "AI 服务余额不足，请前往服务商控制台充值后再试。",
    };
  }

  if (raw.includes("Failed to fetch") || raw.includes("NetworkError")) {
    return {
      code: "NETWORK_ERROR",
      message: "网络连接失败，请检查网络状态或代理设置。",
    };
  }

  if (raw === "An error occurred.") {
    return {
      code: "MODEL_REQUEST_FAILED",
      message:
        "模型请求失败。常见原因：余额不足、密钥错误或模型名不正确，请查看服务端终端日志。",
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: raw || "请求失败，请稍后重试",
  };
};
