/* GET /api/tables?branch=… — bir şubenin masalarını döndürür (hafif yoklama).
   Canlı yenileme + QR sipariş bildirimi bunu saniyede bir çağırır; bootstrap'in
   tamamını (ürün/kategori/stok…) çekmeden yalnız masaları getirir. */
import { getDb, byTenant, PUBLIC_PROJ, DEFAULT_BRANCH } from "@/lib/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const branch =
      new URL(req.url).searchParams.get("branch") || DEFAULT_BRANCH;
    const db = await getDb();
    const tables = await db
      .collection("tables")
      .find(byTenant({ branch_id: branch }), { projection: PUBLIC_PROJ })
      .toArray();
    return Response.json({ ok: true, tables });
  } catch (err) {
    console.error("[tables GET] hata:", err);
    return Response.json({ ok: false, error: "load_failed" }, { status: 500 });
  }
}
