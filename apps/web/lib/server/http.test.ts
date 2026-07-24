import { describe, expect, it } from 'vitest';
import { MAX_SESSION_REQUEST_BYTES, readJson } from './http';

const request = (body: BodyInit | null, contentType = 'application/json') =>
  new Request('https://app.example.test/api/v1/sessions', {
    method: 'POST',
    headers: contentType ? { 'content-type': contentType } : {},
    body,
  });

describe('readJson', () => {
  it.each(['application/json', 'application/json; charset=utf-8'])(
    'accepts %s',
    async (contentType) => {
      await expect(readJson(request('{"ok":true}', contentType))).resolves.toMatchObject({
        value: { ok: true },
      });
    },
  );

  it.each(['', 'text/plain', 'application/jsonp'])(
    'rejects unsupported content types',
    async (contentType) => {
      const result = await readJson(request('{}', contentType));
      expect(result.error?.status).toBe(415);
    },
  );

  it('maps malformed and empty bodies to a safe JSON response', async () => {
    for (const body of ['{', '']) {
      const result = await readJson(request(body));
      expect(result.error?.status).toBe(400);
      expect(result.error?.headers.get('content-type')).toContain('application/json');
      expect(await result.error?.text()).not.toContain('SyntaxError');
    }
  });

  it('enforces the byte limit including UTF-8 bytes', async () => {
    const atLimit = JSON.stringify({ value: 'a'.repeat(MAX_SESSION_REQUEST_BYTES - 12) });
    expect(new TextEncoder().encode(atLimit).byteLength).toBeLessThanOrEqual(
      MAX_SESSION_REQUEST_BYTES,
    );
    expect((await readJson(request(atLimit))).error).toBeUndefined();
    const overLimit = 'x'.repeat(MAX_SESSION_REQUEST_BYTES + 1);
    expect((await readJson(request(overLimit))).error?.status).toBe(413);
    const multibyte = JSON.stringify({ value: '€'.repeat(6000) });
    expect(new TextEncoder().encode(multibyte).byteLength).toBeGreaterThan(
      MAX_SESSION_REQUEST_BYTES,
    );
    expect((await readJson(request(multibyte))).error?.status).toBe(413);
  });
});
