"use client";

import { useState } from "react";
import { Boxes, Plus, AlertTriangle, PackageCheck, Wallet, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { TL } from "@/lib/pos-data";
import {
  STOCK,
  STOCK_CATS,
  isLow,
  stockValue,
  type StockItem,
} from "@/lib/pos-modules";
import { PrimaryButton, Stat, Tab, TopBar } from "./ui";

export function Stok() {
  const [cat, setCat] = useState("hepsi");
  const list = STOCK.filter((s) => (cat === "hepsi" ? true : s.cat === cat));

  const low = STOCK.filter(isLow);
  const toplamDeger = STOCK.reduce((s, i) => s + stockValue(i), 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Stok & Envanter"
        icon={Boxes}
        sub={STOCK.length + " kalem · " + STOCK_CATS.length + " kategori"}
        right={<PrimaryButton icon={Plus}>Stok Girişi</PrimaryButton>}
      />

      <div className="mb-4 grid grid-cols-4 gap-4 px-7">
        <Stat icon={Wallet} label="Envanter Değeri" value={TL(toplamDeger)} tone="orange" />
        <Stat icon={Package} label="Toplam Kalem" value={STOCK.length + ""} tone="sky" />
        <Stat
          icon={AlertTriangle}
          label="Kritik Stok"
          value={low.length + " kalem"}
          tone="rose"
        />
        <Stat
          icon={PackageCheck}
          label="Yeterli Stok"
          value={STOCK.length - low.length + " kalem"}
          tone="green"
        />
      </div>

      {low.length > 0 && (
        <div className="mx-7 mb-4 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2.4} />
          {low.length} kalem kritik seviyede:{" "}
          <span className="text-rose-700">{low.map((l) => l.name).join(", ")}</span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2 px-7">
        <Tab on={cat === "hepsi"} onClick={() => setCat("hepsi")}>
          Tümü
        </Tab>
        {STOCK_CATS.map((c) => (
          <Tab key={c} on={cat === c} onClick={() => setCat(c)}>
            {c}
          </Tab>
        ))}
      </div>

      <div className="scroll-light overflow-y-auto px-7 pb-7">
        <div className="pos-card overflow-hidden">
          {/* Başlık satırı */}
          <div className="grid grid-cols-[2fr_1.2fr_1.4fr_1fr_1.2fr] gap-3 border-b border-line bg-surface2 px-5 py-3 text-[11px] font-bold tracking-wide text-ink3 uppercase">
            <span>Ürün</span>
            <span>Kategori</span>
            <span>Stok Durumu</span>
            <span className="text-right">Birim Maliyet</span>
            <span className="text-right">Toplam Değer</span>
          </div>
          {list.map((s) => (
            <StockRow key={s.id} s={s} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StockRow({ s }: { s: StockItem }) {
  const low = isLow(s);
  const pct = Math.min(100, (s.qty / (s.min * 2)) * 100);
  return (
    <div className="grid grid-cols-[2fr_1.2fr_1.4fr_1fr_1.2fr] items-center gap-3 border-b border-line px-5 py-3 last:border-0 hover:bg-surface2/60">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-bold text-ink">
          {low && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500 blink" />
          )}
          <span className="truncate">{s.name}</span>
        </div>
        <div className="text-[11px] text-ink3">{s.supplier}</div>
      </div>
      <span className="text-xs font-semibold text-ink2">{s.cat}</span>
      <div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className={cn("tnum font-bold", low ? "text-rose-600" : "text-ink")}>
            {s.qty} {s.unit}
          </span>
          <span className="tnum text-[11px] text-ink3">min {s.min}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface2">
          <div
            className={cn(
              "h-full rounded-full",
              low ? "bg-rose-500" : pct > 75 ? "bg-emerald-500" : "bg-amber-500",
            )}
            style={{ width: pct + "%" }}
          />
        </div>
      </div>
      <span className="tnum text-right text-sm font-semibold text-ink2">{TL(s.cost)}</span>
      <span className="font-display tnum text-right text-sm font-extrabold text-ink">
        {TL(stockValue(s))}
      </span>
    </div>
  );
}
