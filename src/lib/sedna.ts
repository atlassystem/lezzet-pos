/* ============================================================
   Orwion POS — Sedna maliyet kataloğu tipleri (ORTAK, şubeden bağımsız)
   Otel ağındaki yerel ajan (sedna_maliyet_sync.py) her ürün için
   {code, name, category, vat, unit_cost, last_buy_date} push eder.
   POS bunları orwion_pos.sedna_products koleksiyonunda tutar ve
   reçete malzemesi + canlı maliyet için kullanır.
   ============================================================ */

export interface SednaProduct {
  /** Sedna ürün/stok kodu — benzersiz anahtar. */
  code: string;
  name: string;
  category?: string;
  /** KDV oranı (%); bilgi amaçlı. */
  vat?: number;
  /** Son alımın net birim maliyeti (₺). Reçete maliyeti bundan hesaplanır. */
  unit_cost: number;
  /** Son alım tarihi (ISO/serbest metin). */
  last_buy_date?: string;
}

/** code → güncel birim maliyet (canlı reçete maliyeti için). */
export type SednaCostMap = Record<string, number>;
