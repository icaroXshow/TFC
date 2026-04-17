import crypto from "node:crypto";
import { env } from "../../system/env.js";

type TokenPayload = {
  sub: string;
  rol: string;
  iat: number;
  exp: number;
};

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlJson(obj: unknown): string {
  return b64url(JSON.stringify(obj));
}

function sign(input: string): string {
  const h = crypto.createHmac("sha256", env.auth.tokenSecret);
  h.update(input);
  return b64url(h.digest());
}

export function issueToken(payload: Omit<TokenPayload, "iat" | "exp">, ttlSec = 60 * 60) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const full: TokenPayload = { ...payload, iat: now, exp: now + ttlSec };

  const encodedHeader = b64urlJson(header);
  const encodedPayload = b64urlJson(full);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(signingInput);
  return `${signingInput}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  if (sign(signingInput) !== signature) return null;

  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64").toString("utf8")) as TokenPayload;
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) return null;
  return payload;
}

