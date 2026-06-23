/* GET /api/bootstrap — seed (idempotent) + tüm POS anlık durumu (hydrate için). */
import {
  getDb,
  byTenant,
  PUBLIC_PROJ,
  seedIfEmpty,
  recipeDocsToMap,
  DEFAULT_BRANCH,
} from "@/lib/server/repo";
import type { RecipeLine } from "@/lib/pos-modules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const db = await getDb();
    await seedIfEmpty(db);

    // Aktif şube — yalnızca operasyonel veriyi (masalar) filtreler.
    // Katalog (ürün/kategori/reçete/stok) şubeden bağımsız ortaktır.
    const branch = new URL(req.url).searchParams.get("branch") || DEFAULT_BRANCH;

    const find = (name: string) =>
      db.collection(name).find(byTenant(), { projection: PUBLIC_PROJ }).toArray();

    const [tables, products, categories, halls, stock, recipeDocs, staff, branches] =
      await Promise.all([
        db
          .collection("tables")
          .find(byTenant({ branch_id: branch }), { projection: PUBLIC_PROJ })
          .toArray(),
        find("products"),
        find("categories"),
        find("halls"),
        find("stock"),
        db
          .collection("recipes")
          .find(byTenant(), { projection: { _id: 0, restaurant_id: 0 } })
          .toArray(),
        find("personnel"),
        find("branches"),
      ]);

    const recipes = recipeDocsToMap(
      recipeDocs as unknown as { pid: string; lines: RecipeLine[] }[],
    );

    return Response.json({
      ok: true,
      tables,
      products,
      categories,
      halls,
      stock,
      recipes,
      staff,
      branches,
    });
  } catch (err) {
    console.error("[bootstrap] hata:", err);
    return Response.json({ ok: false, error: "bootstrap_failed" }, { status: 500 });
  }
}
