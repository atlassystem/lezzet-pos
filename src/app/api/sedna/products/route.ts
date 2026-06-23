/* /api/sedna/products — Sedna maliyet kataloğu (ORTAK, şubeden bağımsız).
   POST: otel ajanından alım (X-API-Key korumalı, idempotent upsert by code).
   GET ?q=: reçete malzeme araması (code/ad içinde, ilk ~30). */
import { timingSafeEqual } from "crypto";
import { getDb, RID, byTenant, seedIfEmpty } from "@/lib/server/repo";
import type { SednaProduct } from "@/lib/sedna";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sabit-zamanlı anahtar karşılaştırma. */
function keyMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  // Anahtar tanımsız → 503; yanlış → 401.
  const expected = process.env.POS_SEDNA_KEY;
  if (!expected) {
    return Response.json({ ok: false, error: "key_not_configured" }, { status: 503 });
  }
  if (!keyMatches(req.headers.get("x-api-key"), expected)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      hotel_id?: string;
      synced_at?: string;
      source?: string;
      count?: number;
      products?: SednaProduct[];
    };
    const products = Array.isArray(body.products) ? body.products : [];
    if (!products.length) {
      return Response.json({ ok: false, error: "empty_products" }, { status: 400 });
    }

    const db = await getDb();
    const updatedAt = new Date();

    const ops = products
      .filter((p) => p && p.code != null && String(p.code).length)
      .map((p) => {
        const code = String(p.code);
        return {
          updateOne: {
            filter: byTenant({ code }),
            update: {
              $set: {
                restaurant_id: RID,
                code,
                name: p.name ?? code,
                category: p.category ?? "",
                vat: typeof p.vat === "number" ? p.vat : null,
                unit_cost: Number(p.unit_cost) || 0,
                last_buy_date: p.last_buy_date ?? null,
                updated_at: updatedAt,
              },
            },
            upsert: true,
          },
        };
      });

    if (!ops.length) {
      return Response.json({ ok: false, error: "no_valid_products" }, { status: 400 });
    }

    const res = await db.collection("sedna_products").bulkWrite(ops, { ordered: false });
    return Response.json({
      ok: true,
      received: products.length,
      upserted: res.upsertedCount,
      modified: res.modifiedCount,
      matched: res.matchedCount,
    });
  } catch (err) {
    console.error("[sedna POST] hata:", err);
    return Response.json({ ok: false, error: "sync_failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const db = await getDb();
    await seedIfEmpty(db); // index'ler kurulsun
    const q = (new URL(req.url).searchParams.get("q") || "").trim();

    const filter = q
      ? byTenant({
          $or: [
            { code: { $regex: escapeRegex(q), $options: "i" } },
            { name: { $regex: escapeRegex(q), $options: "i" } },
          ],
        })
      : byTenant();

    const products = await db
      .collection("sedna_products")
      .find(filter, {
        projection: { _id: 0, restaurant_id: 0, updated_at: 0 },
      })
      .limit(30)
      .toArray();

    return Response.json({ ok: true, products });
  } catch (err) {
    console.error("[sedna GET] hata:", err);
    return Response.json({ ok: false, error: "load_failed" }, { status: 500 });
  }
}

/** Kullanıcı girdisini regex'te güvenli kullan. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
