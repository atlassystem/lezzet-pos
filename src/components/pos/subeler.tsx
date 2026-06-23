"use client";

import { Building2, Plus, MapPin, Wallet, Store, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { TL } from "@/lib/pos-data";
import { BRANCHES, type Branch } from "@/lib/pos-modules";
import { PrimaryButton, Stat, TopBar } from "./ui";

export function Subeler() {
  const aktif = BRANCHES.filter((b) => b.active);
  const toplamCiro = BRANCHES.reduce((s, b) => s + b.todaySales, 0);
  const toplamMasa = BRANCHES.reduce((s, b) => s + b.tables, 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Şubeler — Merkezi Yönetim"
        icon={Building2}
        sub={aktif.length + " / " + BRANCHES.length + " şube aktif"}
        right={<PrimaryButton icon={Plus}>Şube Ekle</PrimaryButton>}
      />

      <div className="mb-4 grid grid-cols-3 gap-4 px-7">
        <Stat icon={Wallet} label="Bugün Toplam Ciro" value={TL(toplamCiro)} tone="orange" />
        <Stat icon={Store} label="Aktif Şube" value={aktif.length + " şube"} tone="green" />
        <Stat icon={LayoutGrid} label="Toplam Masa" value={toplamMasa + " masa"} tone="sky" />
      </div>

      <div className="scroll-light overflow-y-auto px-7 pb-7">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {BRANCHES.map((b) => (
            <BranchCard key={b.id} b={b} max={Math.max(1, ...BRANCHES.map((x) => x.todaySales))} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BranchCard({ b, max }: { b: Branch; max: number }) {
  return (
    <div className={cn("pos-card p-5", !b.active && "opacity-65")}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand2 text-white">
            <Store className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div>
            <div className="font-display text-base font-extrabold text-ink">{b.name}</div>
            <div className="flex items-center gap-1 text-[11px] text-ink3">
              <MapPin className="h-3 w-3" strokeWidth={2.2} />
              {b.city}
            </div>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
            b.active
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500",
          )}
        >
          <span
            className={cn("h-1.5 w-1.5 rounded-full", b.active ? "bg-emerald-500" : "bg-slate-400")}
          />
          {b.active ? "Açık" : "Kapalı"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface2 px-3 py-2.5">
          <div className="text-[10px] font-bold tracking-wide text-ink3 uppercase">
            Bugün Ciro
          </div>
          <div className="font-display tnum text-lg font-extrabold text-ink">
            {b.active ? TL(b.todaySales) : "—"}
          </div>
        </div>
        <div className="rounded-xl bg-surface2 px-3 py-2.5">
          <div className="text-[10px] font-bold tracking-wide text-ink3 uppercase">Masa</div>
          <div className="font-display tnum text-lg font-extrabold text-ink">{b.tables}</div>
        </div>
      </div>

      {b.active && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] text-ink3">
            <span>Ciro payı</span>
            <span className="tnum">{Math.round((b.todaySales / max) * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-orange-400"
              style={{ width: (b.todaySales / max) * 100 + "%" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
