/* ============================================================
   Orwion POS — TCMB döviz kuru (EUR/TRY efektif satış)

   TCMB günlük kur bülteni (today.xml) üzerinden EUR'nun "efektif satış"
   (BanknoteSelling) kurunu çeker ve GÜN BAZINDA bellek içinde önbelleğe alır.
   Aynı gün içinde tekrar TCMB'ye gidilmez; ertesi gün ilk istekte tazelenir.
   TCMB'ye ulaşılamazsa eldeki son değer (varsa) döner.
   (Bu modül yalnızca sunucu tarafında — /api/rate — kullanılır.)
   ============================================================ */

const TCMB_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";

export interface EurRate {
  /** EUR/TRY efektif satış kuru. */
  rate: number;
  /** Önbellek günü (Türkiye saati, YYYY-MM-DD). */
  date: string;
  /** Kaynak — her zaman "TCMB". */
  source: "TCMB";
}

let cache: EurRate | null = null;

/** Türkiye saatine göre bugünün tarihi (YYYY-MM-DD). */
function istanbulToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(new Date());
}

/** TCMB today.xml'den EUR efektif satış (BanknoteSelling) değerini ayıklar. */
function parseEurBanknoteSelling(xml: string): number | null {
  const block = xml.match(
    /<Currency[^>]*CurrencyCode="EUR"[^>]*>([\s\S]*?)<\/Currency>/i,
  );
  if (!block) return null;
  const m = block[1].match(/<BanknoteSelling>([^<]+)<\/BanknoteSelling>/i);
  if (!m) return null;
  // TCMB XML ondalık ayıracı nokta; yine de virgülü tolere et.
  const n = parseFloat(m[1].trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * EUR/TRY efektif satış kuru (günlük önbellekli). Aynı gün ikinci kez
 * çağrılırsa TCMB'ye gitmeden önbellekten döner. Hata olursa elde varsa
 * eski değeri, yoksa null döndürür.
 */
export async function getEurRate(): Promise<EurRate | null> {
  const today = istanbulToday();
  if (cache && cache.date === today) return cache;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(TCMB_URL, {
      cache: "no-store",
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return cache;
    const xml = await res.text();
    const rate = parseEurBanknoteSelling(xml);
    if (rate == null) return cache;
    cache = { rate, date: today, source: "TCMB" };
    return cache;
  } catch {
    // Ağ/parse hatası: elde son değer varsa onu koru (yoksa null).
    return cache;
  }
}
