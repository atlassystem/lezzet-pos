"use client";

import { BarChart3, Wallet, Receipt, TrendingUp, CircleDollarSign, FileText } from "lucide-react";
import {
  CATS,
  TL,
  orderTotal,
  prodById,
  type Table,
} from "@/lib/pos-data";
import { Food } from "./food";
import { AreaChart, DonutChart } from "./charts";
import { Card, GhostButton, PrimaryButton, Stat, TopBar } from "./ui";

const ODEME = [
  { k: "Nakit", v: 9850, c: "#10b981" },
  { k: "Kredi Kartı", v: 12600, c: "#f59e0b" },
  { k: "Yemek Çeki", v: 2400, c: "#8b5cf6" },
];

const SAATLIK: [string, number][] = [
  ["11", 1200], ["12", 3400], ["13", 5200], ["14", 3100],
  ["15", 1600], ["16", 1400], ["17", 2200], ["18", 3900],
  ["19", 6100], ["20", 7400], ["21", 5800], ["22", 3200],
];

const BASE_TOP: [string, number][] = [
  ["i1", 38], ["z1", 31], ["c1", 29], ["i2", 24], ["t1", 22],
];

export function Rapor({ tables }: { tables: Table[] }) {
  const acik = tables.filter((t) => t.items.length);
  const acikCiro = acik.reduce((s, t) => s + orderTotal(t.items), 0);
  const kapanmisCiro = 24850;
  const ciro = kapanmisCiro + acikCiro;
  const adisyon = 42;
  const ortalama = ciro / adisyon;

  const odToplam = ODEME.reduce((s, o) => s + o.v, 0);

  const sayac: Record<string, number> = {};
  tables.forEach((t) =>
    t.items.forEach((it) => {
      sayac[it.pid] = (sayac[it.pid] || 0) + it.qty;
    }),
  );
  const top = BASE_TOP.map(([pid, n]) => ({
    p: prodById[pid],
    n: n + (sayac[pid] || 0),
  })).sort((a, b) => b.n - a.n);
  const maxTop = Math.max(...top.map((t) => t.n));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Gün Sonu — Z Raporu"
        icon={BarChart3}
        right={
          <>
            <GhostButton icon={FileText}>PDF</GhostButton>
            <PrimaryButton>Gün Sonu Al</PrimaryButton>
          </>
        }
      />

      <div className="scroll-light space-y-4 overflow-y-auto px-7 pb-7">
        <div className="grid grid-cols-4 gap-4">
          <Stat icon={Wallet} label="Toplam Ciro" value={TL(ciro)} tone="orange" />
          <Stat icon={Receipt} label="Adisyon Sayısı" value={adisyon + ""} tone="green" />
          <Stat icon={TrendingUp} label="Ortalama Adisyon" value={TL(ortalama)} tone="sky" />
          <Stat icon={CircleDollarSign} label="Açık Hesap" value={TL(acikCiro)} tone="violet" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card
            title="Saatlik Ciro"
            className="col-span-2"
            right={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.4} />
                En yoğun 20:00
              </span>
            }
          >
            <AreaChart
              data={SAATLIK.map(([h, v]) => ({ label: h, value: v }))}
              height={200}
              fmt={(n) => TL(n)}
              peakLabel
            />
          </Card>

          <Card title="Ödeme Dağılımı">
            <div className="flex flex-col items-center">
              <DonutChart
                segments={ODEME.map((o) => ({ label: o.k, value: o.v, color: o.c }))}
                centerBottom="Tahsilat"
                centerTop={TL(odToplam)}
              />
              <div className="mt-5 w-full space-y-2.5">
                {ODEME.map((o) => (
                  <div key={o.k} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-semibold text-ink2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: o.c }} />
                      {o.k}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="tnum text-[11px] text-ink3">
                        %{Math.round((o.v / odToplam) * 100)}
                      </span>
                      <span className="tnum font-bold text-ink">{TL(o.v)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <Card title="En Çok Satan Ürünler">
          <div className="space-y-3">
            {top.map((t, i) => (
              <div key={t.p.id} className="flex items-center gap-3">
                <span className="font-display w-6 text-center text-lg font-extrabold text-ink3">
                  {i + 1}
                </span>
                <Food
                  img={t.p.img}
                  emoji={t.p.emoji}
                  grad={t.p.grad}
                  className="h-10 w-10 shrink-0 rounded-lg"
                />
                <div className="w-44 shrink-0">
                  <div className="text-sm leading-tight font-bold text-ink">{t.p.name}</div>
                  <div className="text-[11px] text-ink3">
                    {CATS.find((c) => c.id === t.p.cat)?.name}
                  </div>
                </div>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-orange-400"
                    style={{ width: (t.n / maxTop) * 100 + "%" }}
                  />
                </div>
                <span className="tnum w-16 text-right text-sm font-bold text-ink">
                  {t.n} adet
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
