import { NextResponse } from "next/server";

export type AiErrorCode =
  | "LIMIT_REACHED"
  | "RATE_LIMIT"
  | "AI_ERROR"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "SERVICE_UNAVAILABLE"
  | "EDIT_LIMIT";

export function aiSuccess<T>(data: T, creditsUsed: number, creditsRemaining: number) {
  return NextResponse.json({
    success: true,
    data,
    credits_used:      creditsUsed,
    credits_remaining: creditsRemaining,
  });
}

export function aiError(code: AiErrorCode, message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { success: false, error: code, message, ...(extra ?? {}) },
    { status }
  );
}

export const AI_ERROR_STATUS: Record<AiErrorCode, number> = {
  LIMIT_REACHED:       403,
  RATE_LIMIT:          429,
  AI_ERROR:            502,
  VALIDATION_ERROR:    400,
  UNAUTHORIZED:        401,
  SERVICE_UNAVAILABLE: 503,
  EDIT_LIMIT:          403,
};
