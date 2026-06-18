"use client";

import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { ChefHat, Sparkles, Flame, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HALLS,
  minutesSince,
  prodById,
  type OrderItem,
  type Table,
} from "@/lib/pos-data";

interface Ticket {
  no: string;
  hall: string;
  startedAt: number | null;
  waiter: string | null;
  items: OrderItem[];
}

type ColKey = "yeni" | "hazirlaniyor" | "hazir";

const COLS: {
  k: ColKey;
  label: string;
  ic: ComponentType<LucideProps>;
  bar: string;
  tint: string;
}[] = [
  { k: "yeni", label: "Yeni Sipariş", ic: Sparkles, bar: "bg-rose-500", tint: "text-rose-600" },
  { k: "hazirlaniyor", label: "Hazırlanıyor", ic: Flame, bar: "bg-amber-500", tint: "text-amber-600" },
  { k: "hazir", label: "Hazır", ic: CheckCircle2, bar: "bg-emerald-500", tint: "text-emerald-600" },
];

export function Mutfak({
  tables,
  clockMin,
}: {
  tables: Table[];
  clockMin: number;
}) {
  const tickets: Ticket[] = [];
  tables
    .filter((t) => t.status === "dolu" || t.status === "hesap")
    .forEach((t) => {
      const mut = t.items.filter((it) => prodById[it.pid]?.route === "mutfak");
      if (mut.length)
        tickets.push({
          no: t.no,
          hall: t.hall,
          startedAt: t.startedAt,
          waiter: t.waiter,
          items: mut,
        });
    });
  tickets.sort((a, b) => (a.startedAt ?? 0) - (b.startedAt ?? 0));

  const colOf = (tk: Ticket): ColKey => {
    const m = minutesSince(tk.startedAt, clockMin);
    if (m > 40) return "hazir";
    if (m > 15) return "hazirlaniyor";
    return "yeni";
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-7 pt-6 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft">
            <ChefHat className="h-5 w-5 text-brand" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink">
              Mutfak Ekranı{" "}
              <span className="text-base font-semibold text-ink3">KDS</span>
            </h1>
            <p className="text-sm text-ink3">{tickets.length} aktif sipariş · canlı</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-200">
          <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.4} />
          15 dk üstü uyarı
        </span>
      </div>
      <div className="grid flex-1 grid-cols-3 gap-4 overflow-hidden px-7 pb-7">
        {COLS.map((col) => {
          const cards = tickets.filter((tk) => colOf(tk) === col.k);
          const Ic = col.ic;
          return (
            <div
              key={col.k}
              className="flex min-h-0 flex-col rounded-2xl border border-line bg-surface2"
            >
              <div className="flex items-center justify-between px-4 py-3">
                <span className={cn("flex items-center gap-2 text-sm font-bold", col.tint)}>
                  <Ic className="h-4 w-4" strokeWidth={2.4} />
                  {col.label}
                </span>
                <span className="grid h-6 min-w-6 place-items-center rounded-lg bg-white px-1.5 text-xs font-bold text-ink ring-1 ring-line">
                  {cards.length}
                </span>
              </div>
              <div className="space-y-3 overflow-y-auto px-3 pb-3">
                {cards.map((tk) => {
                  const m = minutesSince(tk.startedAt, clockMin);
                  const gec = m > 15;
                  return (
                    <div
                      key={tk.no}
                      className="overflow-hidden rounded-xl border border-line bg-white shadow-sm"
                    >
                      <div className={cn("h-1", col.bar)} />
                      <div className="px-3 py-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-display text-lg font-extrabold text-ink">
                            Masa {tk.no}
                          </span>
                          <span
                            className={cn(
                              "tnum inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                              gec
                                ? "bg-rose-100 text-rose-600"
                                : "bg-surface2 text-ink2",
                            )}
                          >
                            <Clock className="h-3 w-3" strokeWidth={2.4} />
                            {m} dk
                          </span>
                        </div>
                        <div className="mb-2 text-[11px] text-ink3">
                          {HALLS.find((h) => h.id === tk.hall)?.name} · {tk.waiter}
                        </div>
                        <div className="space-y-1">
                          {tk.items.map((it) => (
                            <div key={it.pid} className="flex items-center gap-2 text-sm">
                              <span className="grid h-5 w-5 place-items-center rounded bg-brand text-xs font-extrabold text-white">
                                {it.qty}
                              </span>
                              <span className="text-ink2">
                                {prodById[it.pid]?.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {cards.length === 0 && (
                  <div className="py-8 text-center text-sm text-ink3">—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
