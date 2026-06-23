/* PUT /api/tables/[no] — masanın tüm durumunu kaydet (ürün ekle/çıkar, hesap iste).
   Masalar şubeye göre ayrı: branch_id ile filtrelenir/yazılır. */
import { getDb, byTenant, DEFAULT_BRANCH } from "@/lib/server/repo";
import type { Table } from "@/lib/pos-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ no: string }> },
) {
  try {
    const { no } = await params;
    const body = (await req.json()) as Partial<Table>;
    const branch_id =
      body.branch_id ||
      new URL(req.url).searchParams.get("branch") ||
      DEFAULT_BRANCH;
    const db = await getDb();

    // Sadece bilinen alanları yaz — restaurant_id/_id istemciden gelse de yok say.
    const set = {
      no,
      branch_id,
      hall: body.hall,
      seats: body.seats,
      status: body.status,
      items: Array.isArray(body.items) ? body.items : [],
      startedAt: body.startedAt ?? null,
      waiter: body.waiter ?? null,
      restaurant_id: byTenant().restaurant_id,
    };

    await db
      .collection("tables")
      .updateOne(byTenant({ no, branch_id }), { $set: set }, { upsert: true });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[tables PUT] hata:", err);
    return Response.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
