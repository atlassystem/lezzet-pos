/* Basit süreç-içi sipariş olay yatağı (SSE için). Tek süreçli standalone
   Next.js kurulumunda yeterli (bkz. self/order rate-limit notu); QR self-sipariş
   geldiğinde açık POS ekranlarına anlık "yeni sipariş" olayı yayınlar.
   Kalıcı değildir — süreç yeniden başlarsa dinleyiciler yeniden bağlanır. */
import { EventEmitter } from "node:events";

export interface OrderEvent {
  branch: string; // hangi şube
  no: string; // masa no
  summary: string; // "2× Ayran, 1× Lahmacun"
  added: number; // eklenen toplam adet
  ts: number; // olay zamanı (ms)
}

// Çok sayıda eşzamanlı SSE dinleyicisinde MaxListeners uyarısı çıkmasın.
const bus = new EventEmitter();
bus.setMaxListeners(0);

const CHANNEL = "order";

export function publishOrder(ev: OrderEvent): void {
  bus.emit(CHANNEL, ev);
}

/** Dinleyici ekler; çağıran, bağlantı kapanınca döndürülen fonksiyonla çıkar. */
export function subscribeOrders(fn: (ev: OrderEvent) => void): () => void {
  bus.on(CHANNEL, fn);
  return () => bus.off(CHANNEL, fn);
}
