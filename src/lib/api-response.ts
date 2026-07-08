import { NextResponse } from "next/server";

export const noStoreHeaders = {
  "Cache-Control": "private, max-age=0, s-maxage=0",
};

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function jsonResponse<T>(
  body: T,
  init: { status?: number; headers?: Record<string, string> } = {},
) {
  return NextResponse.json(body, {
    status: init.status,
    headers: {
      ...noStoreHeaders,
      ...init.headers,
    },
  });
}

export function jsonError(
  error: unknown,
  fallback: string,
  init: { status?: number; extra?: Record<string, unknown> } = {},
) {
  return jsonResponse(
    {
      ...init.extra,
      error: getErrorMessage(error, fallback),
    },
    { status: init.status ?? 500 },
  );
}
