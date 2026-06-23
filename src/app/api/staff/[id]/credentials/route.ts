/* POST /api/staff/[id]/credentials { username, password }
   Admin: personele giriş kullanıcı adı + şifre belirler/sıfırlar.
   Şifre bcrypt ile saklanır (düz metin asla). Username benzersiz. */
import bcrypt from "bcryptjs";
import { getDb, byTenant } from "@/lib/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const b = (await req.json().catch(() => ({}))) as {
      username?: string;
      password?: string;
    };
    const username = (b.username ?? "").trim();
    const password = b.password ?? "";
    if (!username) {
      return Response.json({ ok: false, error: "username_required" }, { status: 400 });
    }
    if (password.length < 4) {
      return Response.json({ ok: false, error: "weak_password" }, { status: 400 });
    }

    const db = await getDb();
    const coll = db.collection("personnel");

    const target = await coll.findOne(byTenant({ id }));
    if (!target) {
      return Response.json({ ok: false, error: "staff_not_found" }, { status: 404 });
    }
    // Username benzersiz (başka kullanıcıda olmamalı).
    const clash = await coll.findOne(byTenant({ username, id: { $ne: id } }));
    if (clash) {
      return Response.json({ ok: false, error: "username_taken" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await coll.updateOne(byTenant({ id }), { $set: { username, passwordHash } });

    return Response.json({ ok: true, username });
  } catch (err) {
    console.error("[staff credentials] hata:", err);
    return Response.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
