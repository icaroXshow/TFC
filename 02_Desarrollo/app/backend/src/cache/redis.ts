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

function parseRespSimple(buf: Buffer): string | null {
  if (!buf.length) return null;
  const t = String.fromCharCode(buf[0]);
  const text = buf.toString("utf8");
  if (t === "+") return text.slice(1).split("\r\n")[0] ?? "";
  if (t === "-") throw new Error(text.slice(1).split("\r\n")[0] || "REDIS_ERROR");
  if (t === ":") return text.slice(1).split("\r\n")[0] ?? "";
  if (t === "$") {
    const firstCrLf = text.indexOf("\r\n");
    const len = Number(text.slice(1, firstCrLf));
    if (len < 0) return null;
    return text.slice(firstCrLf + 2, firstCrLf + 2 + len);
  }
  return null;
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
        const out = parseRespSimple(
          Buffer.concat(chunks.map((c) => (typeof c === "string" ? Buffer.from(c, "utf8") : c))),
        );
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
