/* GET /api/auth/me — çerezdeki oturumdan aktif kullanıcıyı döndürür.
   Oturum yoksa/geçersizse 401 (uygulama login gösterir). */
import { cookies } from "next/headers";
import { getDb, byTenant, PUBLIC_PROJ } from "@/lib/server/repo";
import { verifySession, SESSION_COOKIE } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Oturum kontrol uç noktası: oturum yoksa 200 + user:null (konsolu kirletme).
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const sess = verifySession(token);
    if (!sess) {
      return Response.json({ ok: true, user: null });
    }
    const db = await getDb();
    const user = await db
      .collection("personnel")
      .findOne(byTenant({ id: sess.sub }), { projection: PUBLIC_PROJ });
    return Response.json({ ok: true, user: user ?? null, branch: sess.branch });
  } catch (err) {
    console.error("[auth me] hata:", err);
    return Response.json({ ok: false, error: "me_failed" }, { status: 500 });
  }
}
