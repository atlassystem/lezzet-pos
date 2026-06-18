/* ============================================================
   Marka — TEK MERKEZ
   ------------------------------------------------------------
   Ürün, Orwion platformu altında çok-kiracılı (white-label) bir
   restoran POS'udur. Müşteriye özel kurulumda (örn.
   restaurantpos.kaptanhotels.com) yalnızca buradaki değerleri
   değiştirmek yeterlidir; arayüzün tamamı bu sabitleri kullanır.
   ============================================================ */

export const BRAND = {
  /** Kısa marka adı (sidebar logosu yanında). */
  name: "Orwion",
  /** Ürün eki. */
  suffix: "POS",
  /** Tam ürün adı. */
  full: "Orwion POS",
  /** Sidebar alt etiketi / üst başlık. */
  tagline: "Restaurant Suite",
  /** Tarayıcı sekmesi başlığı. */
  title: "Orwion POS — Restoran Yönetim Sistemi",
  /** SEO / meta açıklama. */
  description:
    "Orwion POS — masa planı, adisyon, mutfak ekranı (KDS), menü, stok, personel ve raporlama. Çok şubeli, bulut tabanlı restoran POS sistemi.",
} as const;
