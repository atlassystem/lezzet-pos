"use client";

import { Users, UserPlus, UserCheck, Clock, Star, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { TL } from "@/lib/pos-data";
import { STAFF, SHIFT, type Staff } from "@/lib/pos-modules";
import { PrimaryButton, Stat, TopBar } from "./ui";

export function Personel() {
  const aktif = STAFF.filter((s) => s.state !== "cikis");
  const vardiyada = STAFF.filter((s) => s.state === "vardiyada");
  const toplamSaat = STAFF.reduce((s, u) => s + u.hoursToday, 0);
  const enIyi = [...STAFF].sort((a, b) => b.salesToday - a.salesToday)[0];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Personel & Vardiya"
        icon={Users}
        sub={aktif.length + " aktif personel · " + vardiyada.length + " vardiyada"}
        right={<PrimaryButton icon={UserPlus}>Personel Ekle</PrimaryButton>}
      />

      <div className="mb-4 grid grid-cols-4 gap-4 px-7">
        <Stat icon={UserCheck} label="Vardiyada" value={vardiyada.length + " kişi"} tone="green" />
        <Stat icon={Clock} label="Bugün Toplam Saat" value={toplamSaat + " sa"} tone="sky" />
        <Stat
          icon={Star}
          label="En İyi Satış"
          value={enIyi.initials}
          hint={enIyi.name + " · " + TL(enIyi.salesToday)}
          tone="orange"
        />
        <Stat icon={Users} label="Toplam Kadro" value={STAFF.length + " kişi"} tone="violet" />
      </div>

      <div className="scroll-light overflow-y-auto px-7 pb-7">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {STAFF.map((u) => (
            <StaffCard key={u.id} u={u} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StaffCard({ u }: { u: Staff }) {
  const sh = SHIFT[u.state];
  const off = u.state === "cikis";
  return (
    <div className={cn("pos-card p-4", off && "opacity-70")}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 text-sm font-bold text-white">
            {u.initials}
          </div>
          <span
            className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white"
            style={{ background: sh.dot }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-ink">{u.name}</div>
          <div className="text-[11px] font-semibold text-ink3">{u.role}</div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
            sh.chip,
          )}
        >
          {u.state === "molada" && <Coffee className="h-3 w-3" strokeWidth={2.4} />}
          {sh.label}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
        <div>
          <div className="font-display tnum text-base font-extrabold text-ink">
            {off ? "—" : u.clockIn}
          </div>
          <div className="text-[10px] font-semibold text-ink3">Giriş</div>
        </div>
        <div>
          <div className="font-display tnum text-base font-extrabold text-ink">
            {u.hoursToday > 0 ? u.hoursToday + " sa" : "—"}
          </div>
          <div className="text-[10px] font-semibold text-ink3">Bugün</div>
        </div>
        <div>
          <div className="font-display tnum inline-flex items-center justify-center gap-0.5 text-base font-extrabold text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {u.rating}
          </div>
          <div className="text-[10px] font-semibold text-ink3">Puan</div>
        </div>
      </div>

      {u.salesToday > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-surface2 px-3 py-2">
          <span className="text-[11px] font-semibold text-ink2">Bugünkü ciro</span>
          <span className="font-display tnum text-sm font-extrabold text-ink">
            {TL(u.salesToday)}
          </span>
        </div>
      )}
    </div>
  );
}
