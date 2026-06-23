/* POST /api/auth/login { branch, username, password }
   bcrypt.compare ile doğrula; geçerliyse httpOnly imzalı oturum çerezi set et. */
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getDb, byTenant, PUBLIC_PROJ, DEFAULT_BRANCH } from "@/lib/server/repo";
import {
  authConfigured,
  signSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!authConfigured()) {
    return Response.json({ ok: false, error: "auth_not_configured" }, { status: 503 });
  }
  try {
    const b = (await req.json().catch(() => ({}))) as {
      branch?: string;
      username?: string;
      password?: string;
    };
    const username = (b.username ?? "").trim();
    const password = b.password ?? "";
    if (!username || !password) {
      return Response.json({ ok: false, error: "missing_credentials" }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection("personnel").findOne(byTenant({ username }));
    // Kullanıcı yok veya şifresi tanımsız → aynı genel 401 (kullanıcı sızdırma yok).
    const hash = user?.passwordHash as string | undefined;
    const ok = hash ? await bcrypt.compare(password, hash) : false;
    if (!user || !ok) {
      return Response.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
    }

    const branch = b.branch || DEFAULT_BRANCH;
    const token = signSession({ sub: user.id as string, branch });

    (await cookies()).set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    const pub = await db
      .collection("personnel")
      .findOne(byTenant({ id: user.id }), { projection: PUBLIC_PROJ });
    return Response.json({ ok: true, user: pub, branch });
  } catch (err) {
    console.error("[auth login] hata:", err);
    return Response.json({ ok: false, error: "login_failed" }, { status: 500 });
  }
}
