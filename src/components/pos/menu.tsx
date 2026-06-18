"use client";

import { useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { CATS, PRODUCTS, TL } from "@/lib/pos-data";
import { Food } from "./food";
import { catIcon } from "./glyphs";
import { PrimaryButton, Tab, TopBar } from "./ui";

export function Menu() {
  const [cat, setCat] = useState("hepsi");
  const list = PRODUCTS.filter((p) => (cat === "hepsi" ? true : p.cat === cat));
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Menü & Ürünler"
        icon={BookOpen}
        sub={PRODUCTS.length + " ürün · " + CATS.length + " kategori"}
        right={<PrimaryButton icon={Plus}>Yeni Ürün</PrimaryButton>}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2 px-7">
        <Tab on={cat === "hepsi"} onClick={() => setCat("hepsi")}>
          Tümü
        </Tab>
        {CATS.map((c) => {
          const Ic = catIcon(c.id);
          return (
            <Tab key={c.id} on={cat === c.id} onClick={() => setCat(c.id)}>
              <span className="inline-flex items-center gap-1.5">
                <Ic className="h-4 w-4" strokeWidth={2.1} />
                {c.name}
              </span>
            </Tab>
          );
        })}
      </div>
      <div className="scroll-light overflow-y-auto px-7 pb-7">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((p) => (
            <div key={p.id} className="pos-card lift overflow-hidden">
              <Food img={p.img} emoji={p.emoji} grad={p.grad} className="h-28 w-full" />
              <div className="px-3 py-3">
                <div className="line-clamp-1 text-sm leading-tight font-bold text-ink">
                  {p.name}
                </div>
                <div className="mb-2 text-[11px] font-semibold text-ink3">
                  {CATS.find((c) => c.id === p.cat)?.name} ·{" "}
                  {p.route === "bar" ? "Bar" : "Mutfak"}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-display tnum font-extrabold text-brand">
                    {TL(p.price)}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600 ring-1 ring-emerald-200">
                    Aktif
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
