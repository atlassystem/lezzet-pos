"use client";

import { LayoutGrid, Wallet, Utensils, Timer, Armchair, UserRound, Clock, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HALLS,
  STATUS,
  TL,
  elapsed,
  itemCount,
  orderTotal,
  type Table,
} from "@/lib/pos-data";
import { Pill, Stat, TopBar } from "./ui";

export function Masalar({
  tables,
  activeHall,
  setActiveHall,
  onOpen,
  clockMin,
  alerts,
}: {
  tables: Table[];
  activeHall: string;
  setActiveHall: (h: string) => void;
  onOpen: (no: string) => void;
  clockMin: number;
  /** Yeni QR siparişi gelen masa no'ları (rozet + vurgu için). */
  alerts?: Set<string>;
}) {
  const all = tables;
  const hallTables = tables.filter((t) => t.hall === activeHall);
  const dolu = all.filter((t) => t.status === "dolu").length;
  const hesap = all.filter((t) => t.status === "hesap").length;
  const bos = all.filter((t) => t.status === "bos").length;
  const acikCiro = all.reduce((s, t) => s + orderTotal(t.items), 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Masa Planı"
        icon={LayoutGrid}
        right={
          <>
            <Pill tone="ok" dot>
              {dolu} Dolu
            </Pill>
            <Pill tone="warn" dot>
              {hesap} Hesap
            </Pill>
            <Pill tone="slate" dot>
              {bos} Boş
            </Pill>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-4 px-7">
        <Stat icon={Wallet} label="Açık Hesap" value={TL(acikCiro)} tone="orange" />
        <Stat
          icon={Utensils}
          label="Dolu Masa"
          value={dolu + " / " + all.length}
          tone="green"
        />
        <Stat icon={Timer} label="Hesap Bekleyen" value={hesap + " masa"} tone="sky" />
        <Stat icon={Armchair} label="Boş Masa" value={bos + " masa"} tone="slate" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 px-7">
        {HALLS.map((h) => {
          const on = activeHall === h.id;
          const c = tables.filter((t) => t.hall === h.id).length;
          return (
            <button
              key={h.id}
              onClick={() => setActiveHall(h.id)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold ring-1 transition",
                on
                  ? "bg-brand text-white ring-brand/0 shadow-sm shadow-brand/30"
                  : "bg-white text-ink2 ring-line2 hover:bg-surface2 hover:text-ink",
              )}
            >
              {h.name}{" "}
              <span className={on ? "text-white/70" : "text-ink3"}>{c}</span>
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-3 text-xs text-ink3">
          {Object.entries(STATUS).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: v.dot }} />
              {v.label}
            </span>
          ))}
        </div>
      </div>

      <div className="scroll-light overflow-y-auto px-7 pb-7">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {hallTables.map((t) => (
            <TableCard
              key={t.no}
              t={t}
              onOpen={onOpen}
              clockMin={clockMin}
              alert={alerts?.has(t.no) ?? false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TableCard({
  t,
  onOpen,
  clockMin,
  alert,
}: {
  t: Table;
  onOpen: (no: string) => void;
  clockMin: number;
  /** Bu masaya yeni QR siparişi geldi mi (rozet + vurgu). */
  alert?: boolean;
}) {
  const s = STATUS[t.status];
  const total = orderTotal(t.items);
  const count = itemCount(t.items);
  return (
    <button
      onClick={() => onOpen(t.no)}
      className={cn(
        "pos-card lift relative overflow-hidden border-2 text-left",
        alert ? "border-rose-500 ring-2 ring-rose-300" : s.ring,
      )}
    >
      {alert && (
        <span className="absolute top-2 right-2 z-10 inline-flex animate-pulse items-center gap-1 rounded-full bg-rose-500 px-2 py-1 text-[11px] font-bold text-white shadow-md shadow-rose-500/40">
          <BellRing className="h-3 w-3" strokeWidth={2.6} />
          Yeni
        </span>
      )}
      <div className={cn("flex items-start justify-between px-4 pt-4 pb-3", s.soft)}>
        <div>
          <div className="text-[11px] font-bold tracking-wide text-ink3 uppercase">
            Masa
          </div>
          <div className="font-display text-3xl leading-none font-extrabold text-ink">
            {t.no}
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-bold",
            s.chip,
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
          {s.label}
        </span>
      </div>
      <div className="border-t border-line px-4 py-3">
        <div className="flex items-center justify-between text-xs text-ink2">
          <span className="inline-flex items-center gap-1">
            <UserRound className="h-3.5 w-3.5 text-ink3" strokeWidth={2.2} />
            {t.seats} kişilik
          </span>
          {t.startedAt != null && (
            <span className="tnum inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-ink3" strokeWidth={2.2} />
              {elapsed(t.startedAt, clockMin)}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <div className="text-[11px] font-semibold text-ink3">
              {count ? count + " ürün" : "—"}
            </div>
            <div className="font-display tnum text-lg font-extrabold text-ink">
              {total ? TL(total) : "Boş"}
            </div>
          </div>
          {t.waiter && (
            <span className="rounded-lg bg-surface2 px-2 py-1 text-[11px] font-semibold text-ink2 ring-1 ring-line">
              {t.waiter}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
