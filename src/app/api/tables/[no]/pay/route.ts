/* POST /api/tables/[no]/pay — ödeme al:
   order + payment kaydı oluştur, reçeteye göre stok düş, masayı sıfırla.
   Döner: { table (sıfırlanmış), stock (güncel liste) }. */
import {
  getDb,
  RID,
  byTenant,
  PUBLIC_PROJ,
  recipeDocsToMap,
  consumeStockInDb,
  DEFAULT_BRANCH,
} from "@/lib/server/repo";
import { KDV_ORAN, type OrderItem } from "@/lib/pos-data";
import type { RecipeLine } from "@/lib/pos-modules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ no: string }> },
) {
  try {
    const { no } = await params;
    const branch_id = new URL(req.url).searchParams.get("branch") || DEFAULT_BRANCH;
    const method = await req
      .json()
      .then((b) => (b?.method as string) || "nakit")
      .catch(() => "nakit");

    const db = await getDb();
    const table = await db.collection("tables").findOne(byTenant({ no, branch_id }));
    if (!table) {
      return Response.json({ ok: false, error: "table_not_found" }, { status: 404 });
    }

    const items = (table.items ?? []) as OrderItem[];

    if (items.length) {
      // Fiyat (ürün), reçete (BOM) ve malzeme maliyeti (stok) tek seferde.
      const [products, recipeDocs, stockDocs] = await Promise.all([
        db
          .collection("products")
          .find(byTenant(), { projection: { _id: 0, id: 1, name: 1, price: 1 } })
          .toArray(),
        db
          .collection("recipes")
          .find(byTenant(), { projection: { _id: 0, restaurant_id: 0 } })
          .toArray(),
        db
          .collection("stock")
          .find(byTenant(), { projection: { _id: 0, id: 1, cost: 1 } })
          .toArray(),
      ]);

      const priceById = new Map(products.map((p) => [p.id, p]));
      const recipes = recipeDocsToMap(
        recipeDocs as unknown as { pid: string; lines: RecipeLine[] }[],
      );
      const costById = new Map<string, number>(
        stockDocs.map((s) => [s.id as string, (s.cost as number) ?? 0]),
      );
      // Bir ürünün reçetesine göre birim malzeme maliyeti (Σ malzeme fiyatı × miktar).
      const unitCost = (pid: string) =>
        (recipes[pid] ?? []).reduce(
          (s, l) => s + (costById.get(l.stockId) ?? 0) * l.qty,
          0,
        );
      const r2 = (n: number) => Math.round(n * 100) / 100;

      const lines = items.map((it) => {
        const p = priceById.get(it.pid);
        const uc = unitCost(it.pid);
        return {
          pid: it.pid,
          name: p?.name ?? it.pid,
          qty: it.qty,
          price: p?.price ?? 0,
          lineTotal: (p?.price ?? 0) * it.qty,
          // Maliyet snapshot'ı (satış anındaki reçete maliyeti).
          cost: r2(uc),
          costTotal: r2(uc * it.qty),
        };
      });
      const total = lines.reduce((s, l) => s + l.lineTotal, 0);
      const costTotal = r2(lines.reduce((s, l) => s + l.costTotal, 0));
      const kdv = Math.round((total - total / (1 + KDV_ORAN)) * 100) / 100;
      const paidAt = new Date();

      const orderDoc = {
        restaurant_id: RID,
        branch_id,
        tableNo: no,
        hall: table.hall,
        waiter: table.waiter ?? null,
        items: lines,
        subtotal: Math.round((total - kdv) * 100) / 100,
        kdv,
        total,
        // Maliyet & kâr snapshot'ı (rapor ekranı bu fazda yok; yalnızca veri yazılır).
        costTotal,
        profit: r2(total - costTotal),
        method,
        paidAt,
      };
      const { insertedId } = await db.collection("orders").insertOne(orderDoc);

      await db.collection("payments").insertOne({
        restaurant_id: RID,
        branch_id,
        orderId: insertedId,
        tableNo: no,
        amount: total,
        method,
        paidAt,
      });

      // Stok düşümü (yukarıda çekilen reçeteye göre).
      await consumeStockInDb(db, items, recipes);
    }

    // Masayı sıfırla.
    const reset = {
      status: "bos",
      items: [],
      startedAt: null,
      waiter: null,
    };
    await db.collection("tables").updateOne(byTenant({ no, branch_id }), { $set: reset });

    const [freshTable, stock] = await Promise.all([
      db.collection("tables").findOne(byTenant({ no, branch_id }), { projection: PUBLIC_PROJ }),
      db.collection("stock").find(byTenant(), { projection: PUBLIC_PROJ }).toArray(),
    ]);

    return Response.json({ ok: true, table: freshTable, stock });
  } catch (err) {
    console.error("[pay POST] hata:", err);
    return Response.json({ ok: false, error: "pay_failed" }, { status: 500 });
  }
}
