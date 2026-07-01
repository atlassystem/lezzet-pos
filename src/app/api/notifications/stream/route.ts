/* GET /api/notifications/stream?branch=… — Server-Sent Events akışı.
   QR self-sipariş geldiğinde (bkz. /api/self/order) POS arayüzüne anlık
   "yeni sipariş" olayı iter; yalnızca istenen şubenin olayları gönderilir.
   Tek süreçli standalone kurulumda çalışır (bkz. order-events).
   Not: Polling (/api/tables 7 sn) yedek kanaldır; SSE düşerse tarayıcı
   otomatik yeniden bağlanır, polling bu arada bildirim vermeyi sürdürür. */
import { subscribeOrders, type OrderEvent } from "@/lib/server/order-events";
import { DEFAULT_BRANCH } from "@/lib/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const branch = new URL(req.url).searchParams.get("branch") || DEFAULT_BRANCH;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        } catch {
          /* akış kapandıysa yok say */
        }
      };

      // Bağlantı açıldı bilgisi (istemci "hazır" saysın).
      send({ type: "ready", branch });

      // Yalnızca bu şubenin sipariş olaylarını ilet.
      const onOrder = (ev: OrderEvent) => {
        if (ev.branch !== branch) return;
        send({ type: "order", no: ev.no, summary: ev.summary, added: ev.added, ts: ev.ts });
      };
      const unsub = subscribeOrders(onOrder);

      // Proxy/timeout'lara karşı düzenli keep-alive yorumu.
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          /* kapandı */
        }
      }, 25_000);

      // İstemci bağlantıyı kapatınca temizle.
      req.signal.addEventListener("abort", () => {
        clearInterval(ping);
        unsub();
        try {
          controller.close();
        } catch {
          /* zaten kapalı */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // nginx ara belleklemesini kapat
    },
  });
}
