import { createHash, randomBytes } from 'node:crypto';

declare const rawTokenBrand: unique symbol;
declare const tokenHashBrand: unique symbol;
export type RawToken = string & { readonly [rawTokenBrand]: true };
export type TokenHash = string & { readonly [tokenHashBrand]: true };

export const generateToken = (): RawToken => randomBytes(32).toString('base64url') as RawToken;
export const hashToken = (token: RawToken | string): TokenHash =>
  createHash('sha256').update(token).digest('hex') as TokenHash;
