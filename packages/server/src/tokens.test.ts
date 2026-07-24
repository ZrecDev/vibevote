import { describe, expect, it } from 'vitest';
import { generateToken, hashToken } from './tokens';

describe('server tokens', () => {
  it('generates distinct URL-safe tokens with 256 bits of entropy', () => {
    const first = generateToken();
    const second = generateToken();
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second).not.toBe(first);
  });
  it('hashes deterministically without returning raw token material', () => {
    const token = generateToken();
    expect(hashToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('separates hashes for distinct tokens', () => {
    expect(hashToken(generateToken())).not.toBe(hashToken(generateToken()));
  });
});
