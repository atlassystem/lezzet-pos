"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Wallet,
  Receipt,
  TrendingUp,
  Coins,
  Percent,
  Store,
  CalendarDays,
  Package,
  CreditCard,
  CalendarRange,
  FileDown,
} from "lucide-react";
import { TL } from "@/lib/pos-data";
import { fetchSalesReport, type SalesReport } from "@/lib/pos-api";
import { Stat, TopBar, Card, Tab, GhostButton } from "./ui";

/**
 * Raporlar — Günlük / Dönemsel satış raporu (GERÇEK satışlardan).
 * Kapsam: aktif şube (FAZ3) + seçili gün ya da tarih aralığı. Tüm rakamlar
 * kapanmış order'lardan gelir. Özet + günlük dağılım + en çok satanlar + ödeme türü.
 */

/** Yerel "bugün" (YYYY-MM-DD). Yalnızca istemcide çağrılır (hydration uyumu). */
const todayLocal = () => new Date().toLocaleDateString("en-CA");
/** d güne ekle/çıkar; YYYY-MM-DD döner. */
function shiftDay(iso: string, days: number): string {
  const dt = new Date(`${iso}T00:00:00`);
  dt.setDate(dt.getDate() + days);
  return dt.toLocaleDateString("en-CA");
}

const METHOD_LABEL: Record<string, string> = {
  nakit: "Nakit",
  kredi: "Kredi Kartı",
  kart: "Kredi Kartı",
  online: "Online",
};
const methodLabel = (m: string) => METHOD_LABEL[m] ?? m;

const EMPTY: SalesReport = {
  summary: { revenue: 0, cost: 0, profit: 0, margin: 0, orderCount: 0 },
  byDay: [],
  byProduct: [],
  byMethod: [],
  vat: [],
  fiscal: [],
};

/** Mali fiş durumu etiketleri (ÖKC). */
const FISCAL_LABEL: Record<string, string> = {
  beklemede: "Beklemede",
  iletildi: "İletildi",
  hata: "Hata",
};
const fiscalLabel = (s: string) => FISCAL_LABEL[s] ?? s;

type Mode = "gun" | "donem";

/* ============================================================
   PDF çıktısı — tarayıcının "Yazdır → PDF olarak kaydet" akışı.
   Ek kütüphane yok: raporu temiz bir HTML'e dökeriz, gizli bir
   iframe içinde yazdırma penceresini açarız. Kullanıcı hedef
   olarak "PDF olarak kaydet"i seçerek dosyayı indirir.
   ============================================================ */

/** HTML enjeksiyonuna karşı metin kaçışı (ürün adları vb.). */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Seçili raporu yazdırılabilir tam HTML belgesine dönüştürür. */
function buildReportHtml(
  d: SalesReport,
  opts: { mode: Mode; branchName: string; scope: string },
): string {
  const s = d.summary;
  const multiDay = d.byDay.length > 1;
  const baslik = opts.mode === "gun" ? "Günlük Satış Raporu" : "Dönemsel Satış Raporu";

  const ozetRows = [
    ["Toplam Ciro", TL(s.revenue)],
    ["Toplam Maliyet", TL(s.cost)],
    ["Kâr", TL(s.profit)],
    ["Kâr Marjı", "%" + s.margin],
    ["Adisyon Sayısı", String(s.orderCount)],
  ]
    .map(
      ([k, v]) =>
        `<tr><td>${esc(k)}</td><td class="num">${esc(v)}</td></tr>`,
    )
    .join("");

  const gunlukTablo =
    multiDay && s.orderCount > 0
      ? `<h2>Günlük Dağılım</h2>
         <table class="grid">
           <thead><tr><th>Tarih</th><th class="num">Ciro</th><th class="num">Maliyet</th><th class="num">Kâr</th><th class="num">Adisyon</th></tr></thead>
           <tbody>${d.byDay
             .map(
               (r) =>
                 `<tr><td>${esc(r.date)}</td><td class="num">${esc(TL(r.revenue))}</td><td class="num">${esc(TL(r.cost))}</td><td class="num">${esc(TL(r.profit))}</td><td class="num">${r.orderCount}</td></tr>`,
             )
             .join(