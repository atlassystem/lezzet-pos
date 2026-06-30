/* ============================================================
   Orwion POS — ÖKC (Yeni Nesil Ödeme Kaydedici Cihaz) köprüsü — HAZIRLIK

   Bu modül, ödeme kapanışında mali fişi yerel ÖKC köprüsüne iletmek için
   bir KANCA iskeleti sağlar. Köprü HENÜZ bağlı değildir.

   OKC_AKTIF bayrağı KAPALIYKEN sendToOkc() hiçbir şey yapmaz (no-op) ve
   mevcut ödeme akışı HİÇ değişmez. Bayrak yalnızca ortam değişkeni
   NEXT_PUBLIC_OKC_AKTIF=1 iken açılır.
   ============================================================ */
"use client";

import { orderTotal, kdvRate, prodById, type Table } from "./pos-data";

/** ÖKC köprüsü etkin mi. Aksi halde ödeme kapanışındaki kanca no-op'tur. */
export const OKC_AKTIF = process.env.NEXT_PUBLIC_OKC_AKTIF === "1";

export interface OkcFisSatir {
  pid: string;
  name: string;
  qty: number;
  lineTotal: number;
  /** Satır KDV oranı (yüzde). */
  kdvRate: number;
}

export interface OkcVatRow {
  rate: number;
  base: number;
  kdv: number;
  total: number;
}

export interface OkcFis {
  tableNo: string;
  branch: string;
  method: string;
  total: number;
  lines: OkcFisSatir[];
  /** KDV kırılımı (orana göre matrah/KDV/tutar). */
  vat: OkcVatRow[];
}

export interface OkcSonuc {
  ok: boolean;
  /** Bayrak kapalı olduğu için atlandı. */
  skipped?: boolean;
  error?: string;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Ödenen masadan mali fiş yükü üretir (istemci tarafı). Fiyatlar KDV dahildir. */
export function buildOkcFis(table: Table, method: string, branch: string): OkcFis {
  const lines: OkcFisSatir[] = table.items.map((it) => {
    const p = prodById[it.pid];
    return {
      pid: it.pid,
      name: p?.name ?? it.pid,
      qty: it.qty,
      lineTotal: (p?.price ?? 0) * it.qty,
      kdvRate: kdvRate(p),
    };
  });

  const vatMap = new Map<number, OkcVatRow>();
  for (const l of lines) {
    const row = vatMap.get(l.kdvRate) ?? { rate: l.kdvRate, base: 0, kdv: 0, total: 0 };
    const kdv = l.lineTotal - l.lineTotal / (1 + l.kdvRate / 100);
    row.total += l.lineTotal;
    row.kdv += kdv;
    row.base += l.lineTotal - kdv;
    vatMap.set(l.kdvRate, row);
  }
  const vat = [...vatMap.values()]
    .map((v) => ({ rate: v.rate, base: r2(v.base), kdv: r2(v.kdv), total: r2(v.total) }))
    .sort((a, b) => a.rate - b.rate);

  return {
    tableNo: table.no,
    branch,
    method,
    total: orderTotal(table.items),
    lines,
    vat,
  };
}

/**
 * Ödeme kapanışında çağrılır. Bayrak KAPALIYSA hiçbir şey yapmaz (no-op).
 * Bayrak açıkken mali fişi yerel ÖKC köprüsüne iletecektir (cihaz üreticisinin
 * yerel servisi, ör. http://127.0.0.1:<port>). Köprü HENÜZ bağlı değildir;
 * bu fonksiyon yalnızca entegrasyon noktası iskeletidir. Hata atmaz.
 */
export async function sendToOkc(fis: OkcFis): Promise<OkcSonuc> {
  if (!OKC_AKTIF) return { ok: false, skipped: true };
  try {
    // TODO: gerçek köprü — cihaz üreticisinin yerel servisine fiş POST'la.
    // Şimdilik yalnızca kanca: yük hazır, köprü bağlanınca burada gönderilecek.
    console.info("[OKC] mali fiş köprüsü (hazırlık):", fis.tableNo, fis.total);
    return { ok: true };
  } catch (e) {
    console.warn("[OKC] köprü hatası:", e);
    return { ok: false, error: "okc_bridge_failed" };
  }
}
