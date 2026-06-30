/* /api/rate — TCMB EUR/TRY efektif satış kuru (günlük önbellekli).
   GET: { ok, eurTry, date, source }. Kur alınamazsa 503. */
import { getEurRate } from "@/lib/server/tcmb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const r = await getEurRate();
  if (!r) {
    return Response.json({ ok: false, error: "rate_unavailable" }, { status: 503 });
  }
  return Response.json({ ok: true, eurTry: r.rate, date: r.date, source: r.source });
}
