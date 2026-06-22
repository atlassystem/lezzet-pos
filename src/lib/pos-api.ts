/* ============================================================
   Orwion POS — istemci API yardımcıları (kalıcı veri)
   Bileşenler bellek state yerine bunlarla okur/yazar.
   ============================================================ */
"use client";

import type { Table, Product, Category } from "./pos-data";
import type { StockItem, RecipeLine, Staff } from "./pos-modules";

export interface Bootstrap {
  tables: Table[];
  products: Product[];
  categories: Category[];
  stock: StockItem[];
  recipes: Record<string, RecipeLine[]>;
  staff: Staff[];
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** Mount'ta tüm POS durumunu DB'den çeker (gerekirse seed eder). */
export async function fetchBootstrap(): Promise<Bootstrap> {
  const res = await fetch("/api/bootstrap", { cache: "no-store" });
  if (!res.ok) throw new Error("bootstrap_failed");
  const d = await res.json();
  return {
    tables: d.tables,
    products: d.products,
    categories: d.categories,
    stock: d.stock,
    recipes: d.recipes,
    staff: d.staff,
  };
}

/* ---------- Ürün CRUD (Menü Yönetimi) ---------- */
type ProductInput = Partial<Omit<Product, "id">> & { name: string; cat: string };

/** Yeni ürün ekler; sunucudan id'li tam ürünü döndürür. */
export async function createProduct(input: ProductInput): Promise<Product | null> {
  const res = await fetch("/api/products", json("POST", input));
  if (!res.ok) return null;
  const d = await res.json();
  return d.product ?? null;
}

/** Ürünü düzenler; güncel ürünü döndürür. */
export async function updateProduct(
  id: string,
  patch: Partial<Product>,
): Promise<Product | null> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}`, json("PUT", patch));
  if (!res.ok) return null;
  const d = await res.json();
  return d.product ?? null;
}

/** Ürünü siler (reçetesi de sunucuda temizlenir). */
export async function deleteProduct(id: string): Promise<boolean> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}`, json("DELETE"));
  return res.ok;
}

/** Bir masanın tüm durumunu kaydeder (ürün ekle/çıkar, hesap iste). */
export async function saveTable(table: Table): Promise<void> {
  await fetch(`/api/tables/${encodeURIComponent(table.no)}`, json("PUT", table));
}

/** Ödeme alır: order+payment kaydı, stok düşümü; sıfırlanmış masa + güncel stok döner. */
export async function payTableApi(
  no: string,
  method = "nakit",
): Promise<{ table: Table | null; stock: StockItem[] | null }> {
  const res = await fetch(`/api/tables/${encodeURIComponent(no)}/pay`, json("POST", { method }));
  if (!res.ok) return { table: null, stock: null };
  const d = await res.json();
  return { table: d.table ?? null, stock: d.stock ?? null };
}

/** Reçete haritasını DB ile eşitler. */
export async function saveRecipes(map: Record<string, RecipeLine[]>): Promise<void> {
  await fetch("/api/recipes", json("PUT", map));
}

/** Personel listesini DB ile eşitler. */
export async function saveStaff(list: Staff[]): Promise<void> {
  await fetch("/api/staff", json("PUT", list));
}

/** Stok kalemini yeni mutlak miktara günceller. */
export async function saveStockQty(id: string, qty: number): Promise<StockItem | null> {
  const res = await fetch(`/api/stock/${encodeURIComponent(id)}`, json("PUT", { qty }));
  if (!res.ok) return null;
  const d = await res.json();
  return d.item ?? null;
}
