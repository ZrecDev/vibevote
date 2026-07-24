import 'server-only';
import { NextResponse } from 'next/server';
import { SafeOperationError } from '@vibevote/server';
import { ZodError } from 'zod';

export const MAX_SESSION_REQUEST_BYTES = 16 * 1024;

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export function safeError(code: string, message: string, status: number, retryable = false) {
  return json({ ok: false, error: { code, message, retryable } }, status);
}

export async function readJson(
  request: Request,
): Promise<{ value?: unknown; error?: NextResponse }> {
  const contentType = request.headers.get('content-type');
  const mediaType = contentType?.split(';', 1)[0]?.trim().toLowerCase();
  if (mediaType !== 'application/json') {
    return { error: safeError('INVALID_REQUEST', 'Content-Type must be application/json.', 415) };
  }
  const length = Number(request.headers.get('content-length'));
  if (Number.isFinite(length) && length > MAX_SESSION_REQUEST_BYTES) {
    return { error: safeError('INVALID_REQUEST', 'Request body is too large.', 413) };
  }
  const reader = request.body?.getReader();
  if (!reader)
    return { error: safeError('INVALID_REQUEST', 'Request body must be valid JSON.', 400) };
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > MAX_SESSION_REQUEST_BYTES) {
      await reader.cancel();
      return { error: safeError('INVALID_REQUEST', 'Request body is too large.', 413) };
    }
    chunks.push(value);
  }
  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { value: JSON.parse(new TextDecoder().decode(body)) };
  } catch {
    return { error: safeError('INVALID_REQUEST', 'Request body must be valid JSON.', 400) };
  }
}

export function operationError(error: unknown) {
  if (error instanceof ZodError)
    return safeError('INVALID_REQUEST', 'The request is not valid.', 400);
  if (error instanceof SafeOperationError) {
    const status = error.code === 'INVALID_INVITE' ? 400 : error.code === 'CONFLICT' ? 409 : 500;
    return safeError(error.code, error.message, status, error.retryable);
  }
  return safeError('INTERNAL_ERROR', 'Something went wrong. Try again.', 500, true);
}
