/* ============================================================
   Orwion POS — oturum imzalama (HS256 JWT, bağımlılıksız node:crypto).
   Sır: env POS_AUTH_SECRET (gitignore). Çerez httpOnly + imzalı.
   ============================================================ */
import crypto from "crypto";

export const SESSION_COOKIE = "orwion_sess";
const SESSION_DAYS = 7;

function secret(): string {
  return process.env.POS_AUTH_SECRET || "";
}
export function authConfigured(): boolean {
  return secret().length > 0;
}

const b64url = (buf: Buffer | string) =>
  Buffer.from(buf).toString("base64url");

function sign(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

export interface SessionPayload {
  sub: string; // kullanıcı id
  branch: string; // aktif şube
}

/** İmzalı oturum jetonu üretir (exp dahil). */
export function signSession(payload: SessionPayload): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(
    JSON.stringify({ ...payload, iat: now, exp: now + SESSION_DAYS * 86400 }),
  );
  const sig = sign(`${header}.${body}`);
  return `${header}.${body}.${sig}`;
}

/** Jetonu doğrular; geçerliyse payload, değilse null döner. */
export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = sign(`${header}.${body}`);
  // Sabit-zamanlı imza karşılaştırması.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as
      SessionPayload & { exp?: number };
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    if (!data.sub) return null;
    return { sub: data.sub, branch: data.branch };
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_DAYS * 86400;
