import net from "node:net";
import { env } from "../system/env.js";

type RedisHealth = {
  enabled: boolean;
  ok: boolean;
  host: string;
  port: number;
  last_error: string | null;
};

let lastError: string | null = null;

function encodeResp(parts: Array<string | number>): Buffer {
  const chunks: string[] = [`*${parts.length}\r\n`];
  for (const p of parts) {
    const s = String(p);
    chunks.push(`$${Buffer.byteLength(s)}\r\n${s}\r\n`);
  }
  return Buffer.from(chunks.join(""), "utf8");
}

function readLine(text: string, start: number) {
  const end = text.indexOf("\r\n", start);
  if (end < 0) throw new Error("REDIS_PROTOCOL_ERROR");
  return { line: text.slice(start, end), next: end + 2 };
}

function parseRespOne(text: string, start: number): { value: string | null; next: number } {
  if (start >= text.length) throw new Error("REDIS_PROTOCOL_ERROR");
  const t = text[start];
  if (t === "+" || t === "-" || t === ":") {
    const { line, next } = readLine(text, start + 1);
    if (t === "-") throw new Error(line || "REDIS_ERROR");
    return { value: line ?? "", next };
  }
  if (t === "$") {
    const { line, next } = readLine(text, start + 1);
    const len = Number(line);
    if (!Number.isFinite(len)) throw new Error("REDIS_PROTOCOL_ERROR");
    if (len < 0) return { value: null, next };
    const end = next + len;
    if (end + 2 > text.length) throw new Error("REDIS_PROTOCOL_ERROR");
    const value = text.slice(next, end);
    if (text.slice(end, end + 2) !== "\r\n") throw new Error("REDIS_PROTOCOL_ERROR");
    return { value, next: end + 2 };
  }
  throw new Error("REDIS_PROTOCOL_UNSUPPORTED");
}

function parseRespAll(buf: Buffer): Array<string | null> {
  const text = buf.toString("utf8");
  const out: Array<string | null> = [];
  let i = 0;
  while (i < text.length) {
    const parsed = parseRespOne(text, i);
    out.push(parsed.value);
    i = parsed.next;
  }
  return out;
}

async function rawCommand(parts: Array<string | number>): Promise<string | null> {
  if (!env.redis.enabled) return null;
  const cmd = encodeResp(parts);
  return new Promise((resolve, reject) => {
    const sock = net.createConnection({ host: env.redis.host, port: env.redis.port });
    const chunks: Array<Buffer | string> = [];
    let settled = false;
    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      try {
        sock.end();
      } catch {
        // ignore
      }
      fn();
    };
    const fail = (e: unknown) => {
      const msg = e instanceof Error ? e.message : "REDIS_UNKNOWN_ERROR";
      lastError = msg;
      done(() => reject(new Error(msg)));
    };

    sock.setTimeout(env.redis.timeoutMs);
    sock.on("timeout", () => fail(new Error("REDIS_TIMEOUT")));
    sock.on("error", fail);
    sock.on("data", (c) => chunks.push(c));
    sock.on("end", () => {
      try {
        const all = parseRespAll(
          Buffer.concat(chunks.map((c) => (typeof c === "string" ? Buffer.from(c, "utf8") : c))),
        );
        const out = all.length ? all[all.length - 1] : null;
        lastError = null;
        done(() => resolve(out));
      } catch (e) {
        fail(e);
      }
    });
    sock.on("connect", async () => {
      try {
        if (env.redis.password) {
          const auth = encodeResp(["AUTH", env.redis.password]);
          sock.write(auth);
        }
        if (env.redis.db > 0) {
          const select = encodeResp(["SELECT", env.redis.db]);
          sock.write(select);
        }
        sock.write(cmd);
      } catch (e) {
        fail(e);
      }
    });
  });
}

export async function redisGetJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await rawCommand(["GET", key]);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function redisSetJson(key: string, value: unknown, ttlSec?: number): Promise<void> {
  try {
    const json = JSON.stringify(value);
    if (ttlSec && ttlSec > 0) await rawCommand(["SETEX", key, ttlSec, json]);
    else await rawCommand(["SET", key, json]);
  } catch {
    // fail-open
  }
}

export async function redisDel(key: string): Promise<void> {
  try {
    await rawCommand(["DEL", key]);
  } catch {
    // fail-open
  }
}

export async function redisPingOk(): Promise<boolean> {
  if (!env.redis.enabled) return false;
  try {
    const pong = await rawCommand(["PING"]);
    return pong === "PONG";
  } catch {
    return false;
  }
}

export function getRedisHealthSnapshot(ok: boolean): RedisHealth {
  return {
    enabled: env.redis.enabled,
    ok,
    host: env.redis.host,
    port: env.redis.port,
    last_error: lastError,
  };
}
