/* POST /api/auth/logout — oturum çerezini temizle. */
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return Response.json({ ok: true });
}
