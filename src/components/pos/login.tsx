"use client";

import { useState } from "react";
import { Eye, EyeOff, User, Lock, UtensilsCrossed, Store, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { BRANCHES, type Staff } from "@/lib/pos-modules";
import { loginApi } from "@/lib/pos-api";

/* ============================================================
   Orwion POS — Giriş ekranı (gerçek auth).
   Şube seçici + Kullanıcı Adı + Şifre → POST /api/auth/login.
   ============================================================ */

const MOSAIC = [
  "1565299624946-b28f40a0ae38", "1551782450-a2132b4ba21d", "1540189549336-e6e99c3679fe",
  "1476224203421-9ac39bcb3327", "1467003909585-2f8a72700288", "1432139555190-58524dae6a55",
  "1504674900247-0877df9cc836", "1565958011703-44f9829ba187", "1473093295043-cdd812d0e601",
  "1455619452474-d2be8b1e70cd", "1512621776951-a57141f2eefd", "1414235077428-338989a2e8c0",
  "1482049016688-2d3e1b311543", "1546069901-ba9599a7e63c", "1567620905732-2d1ec7ab7445",
];
const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=420&q=70`;

export function Login({
  onAuthenticated,
}: {
  onAuthenticated: (user: Staff, branch: string) => void;
}) {
  const [show, setShow] = useState(false);
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [branch, setBranch] = useState(BRANCHES[0].id);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErr("");
    setBusy(true);
    try {
      const r = await loginApi(branch, username.trim(), pass);
      if (r.ok && r.user) {
        onAuthenticated(r.user, r.branch || branch);
      } else if (r.status === 401) {
        setErr("Kullanıcı adı veya şifre hatalı.");
      } else if (r.status === 503) {
        setErr("Sunucu kimlik doğrulaması yapılandırılmamış (POS_AUTH_SECRET).");
      } else {
        setErr("Giriş yapılamadı. Tekrar deneyin.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#e6e6e8] p-4 font-sans text-ink sm:p-8">
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_30px_80px_-40px_rgba(24,25,31,0.4)] lg:grid-cols-2">
        {/* SOL — form */}
        <div className="flex flex-col px-7 py-9 sm:px-12 sm:py-12">
          <div className="flex items-center justify-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand shadow-sm">
              <UtensilsCrossed className="h-5 w-5 text-white" strokeWidth={2.4} />
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              {BRAND.name}
              <span className="ml-1 text-brand">{BRAND.suffix}</span>
            </span>
          </div>

          <div className="mt-10 text-center">
            <h1 className="font-display text-[2rem] font-extrabold tracking-tight">Giriş</h1>
            <p className="mt-1.5 text-sm text-ink2">Devam etmek için şube seçip giriş yapın.</p>
          </div>

          <form className="mx-auto mt-8 w-full max-w-sm space-y-4" onSubmit={submit}>
            {/* Şube seçimi */}
            <div>
              <span className="mb-1.5 block text-[12.5px] font-semibold text-ink2">Şube</span>
              <div className="grid grid-cols-2 gap-2">
                {BRANCHES.map((b) => {
                  const on = branch === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBranch(b.id)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold transition",
                        on
                          ? "border-brand bg-brand text-white shadow-sm shadow-brand/30"
                          : "border-line2 bg-surface2 text-ink2 hover:bg-white hover:text-ink",
                      )}
                    >
                      <Store className="h-4 w-4" strokeWidth={2.2} />
                      {b.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Kullanıcı Adı" icon={User}>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adınız"
                autoComplete="username"
                className="w-full bg-transparent text-sm text-ink placeholder:text-ink3 outline-none"
              />
            </Field>

            <Field label="Şifre" icon={Lock}>
              <input
                type={show ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Şifreniz"
                autoComplete="current-password"
                className="w-full bg-transparent text-sm text-ink placeholder:text-ink3 outline-none"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="text-ink3 transition hover:text-ink2"
                aria-label="Şifreyi göster/gizle"
              >
                {show ? <EyeOff className="h-4.5 w-4.5" strokeWidth={2} /> : <Eye className="h-4.5 w-4.5" strokeWidth={2} />}
              </button>
            </Field>

            {err && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] font-semibold text-rose-600">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !username.trim() || !pass}
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" strokeWidth={2.4} />
              {busy ? "Giriş yapılıyor…" : "Giriş"}
            </button>
          </form>

          <p className="mx-auto mt-8 max-w-sm text-center text-[11px] leading-relaxed text-ink3">
            {BRAND.name} {BRAND.suffix} · Restoran Yönetim Sistemi
          </p>
        </div>

        {/* SAĞ — yemek mozaiği */}
        <div className="relative hidden bg-ink lg:block">
          <div className="grid h-full grid-cols-3 grid-rows-5 gap-1.5 p-1.5">
            {MOSAIC.map((id, i) => (
              <div key={i} className="relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(id)} alt="" loading="lazy" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />
          <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full bg-black/35 px-3.5 py-1.5 text-[12px] font-semibold text-white backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-brand" />
            {BRAND.tagline}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-ink2">{label}</span>
      <div className="flex items-center gap-2.5 rounded-xl border border-line2 bg-surface2 px-3.5 py-3 transition focus-within:border-brand/60 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/12">
        <Icon className="h-4.5 w-4.5 shrink-0 text-ink3" strokeWidth={2} />
        {children}
      </div>
    </label>
  );
}
