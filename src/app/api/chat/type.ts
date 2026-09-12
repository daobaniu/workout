import type { ApiErrorResponse } from "@/app/api/type";

/** 带 HTTP 状态的第三方 / SDK 错误 */
export interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * @description 是否为 HTTP 错误
 * @param error - 错误对象
 * @returns 是否为 HTTP 错误
 */
export function isHttpError(error: unknown): error is HttpError {
  if (!(error instanceof Error)) return false;
  const candidate = error as HttpError;
  return (
    typeof candidate.status === "number" ||
    typeof candidate.statusCode === "number"
  );
}

/**
 * @description 获取错误状态
 * @param error - 错误对象
 * @returns - 错误状态
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (!isHttpError(error)) return undefined;
  return error.status ?? error.statusCode;
}

/**
 * @description 获取错误消息
 * @param error - 错误对象
 * @returns - 错误消息
 */
export function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return undefined;
}

/**
 * @description 获取错误名称
 * @param error - 错误对象
 * @returns - 错误名称
 */
export function getErrorName(error: unknown): string | undefined {
  if (error instanceof Error) return error.name;
  return undefined;
}

export type ChatApiErrorBody = ApiErrorResponse;
