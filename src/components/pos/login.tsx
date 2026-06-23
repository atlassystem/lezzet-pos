"use client";

import { useState } from "react";
import { Eye, EyeOff, User, Mail, Lock, UtensilsCrossed, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { BRANCHES } from "@/lib/pos-modules";

/* ============================================================
   Orwion POS — Giriş / Kayıt ekranı (D.CC referansı)
   Solda beyaz form, sağda yemek fotoğrafı mozaiği.
   ============================================================ */

// Sağ mozaik — Unsplash yemek görselleri (sonra kendi görsellerinle değiştirilebilir)
const MOSAIC = [
  "1565299624946-b28f40a0ae38", // pizza
  "1551782450-a2132b4ba21d", // burger
  "1540189549336-e6e99c3679fe", // salata
  "1476224203421-9ac39bcb3327", // köri
  "1467003909585-2f8a72700288", // somon
  "1432139555190-58524dae6a55", // tatlı
  "1504674900247-0877df9cc836", // sofra
  "1565958011703-44f9829ba187", // salata kase
  "1473093295043-cdd812d0e601", // makarna
  "1455619452474-d2be8b1e70cd", // ızgara
  "1512621776951-a57141f2eefd", // sebze kase
  "1414235077428-338989a2e8c0", // restoran tabağı
  "1482049016688-2d3e1b311543", // kahvaltı kase
  "1546069901-ba9599a7e63c", // sağlıklı kase
  "1567620905732-2d1ec7ab7445", // pankek
];

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=420&q=70`;

export function Login({ onLogin }: { onLogin: (branchId: string) => void }) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  // Giriş yapılacak şube (Snack Bar / Plaj Bar). Seçilen şube aktif şube olur.
  const [branch, setBranch] = useState(BRANCHES[0].id);
  const login = () => onLogin(branch);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#e6e6e8] p-4 font-sans text-ink sm:p-8">
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_30px_80px_-40px_rgba(24,25,31,0.4)] lg:grid-cols-2">
        {/* ============ SOL — form ============ */}
        <div className="flex flex-col px-7 py-9 sm:px-12 sm:py-12">
          {/* Marka */}
          <div className="flex items-center justify-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand shadow-sm">
              <UtensilsCrossed className="h-5 w-5 text-white" strokeWidth={2.4} />
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              {BRAND.name}
              <span className="ml-1 text-brand">{BRAND.suffix}</span>
            </span>
          </div>

          {/* Başlık */}
          <div className="mt-10 text-center">
            <h1 className="font-display text-[2rem] font-extrabold tracking-tight">
              Günaydın!
            </h1>
            <p className="mt-1.5 text-sm text-ink2">
              Zaten hesabınız var mı?{" "}
              <button
                type="button"
                onClick={login}
                className="font-bold text-brand hover:underline"
              >
                Giriş yapın
              </button>
            </p>
          </div>

          {/* Form */}
          <form
            className="mx-auto mt-8 w-full max-w-sm space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              login();
            }}
          >
            {/* Şube seçimi — giriş yapılan şube aktif şube olur */}
            <div>
              <span className="mb-1.5 block text-[12.5px] font-semibold text-ink2">
                Şube
              </span>
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

            <Field label="Ad Soyad" icon={User}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adınızı ve soyadınızı girin"
                className="w-full bg-transparent text-sm text-ink placeholder:text-ink3 outline-none"
              />
            </Field>

            <Field label="E-posta" icon={Mail}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresinizi girin"
                className="w-full bg-transparent text-sm text-ink placeholder:text-ink3 outline-none"
              />
            </Field>

            <div>
              <Field label="Şifre" icon={Lock}>
                <input
                  type={show ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="Şifrenizi girin"
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
              {/* Şifre gücü göstergesi */}
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {[0, 1, 2, 3].map((i) => {
                  const strong = pass.length > i * 2;
                  return (
                    <span
                      key={i}
                      className={cn(
                        "h-1 rounded-full transition",
                        strong ? "bg-brand" : "bg-line2",
                      )}
                    />
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="mt-1 w-full rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand2 active:scale-[0.99]"
            >
              Hesap Oluştur
            </button>
          </form>

          {/* Ayraç */}
          <div className="mx-auto my-6 flex w-full max-w-sm items-center gap-3 text-[12px] font-semibold text-ink3">
            <span className="h-px flex-1 bg-line2" />
            veya
            <span className="h-px flex-1 bg-line2" />
          </div>

          {/* Sosyal giriş */}
          <div className="mx-auto w-full max-w-sm space-y-3">
            <SocialButton onClick={login} logo={<GoogleMark />}>
              Google ile devam et
            </SocialButton>
            <SocialButton onClick={login} logo={<AppleMark />}>
              Apple ile devam et
            </SocialButton>
          </div>

          <p className="mx-auto mt-8 max-w-sm text-center text-[11px] leading-relaxed text-ink3">
            Hesap oluşturarak {BRAND.name}{" "}
            <span className="font-semibold text-ink2">Kullanım Koşulları</span>
            &rsquo;nı kabul etmiş olursunuz.
          </p>
        </div>

        {/* ============ SAĞ — yemek mozaiği ============ */}
        <div className="relative hidden bg-ink lg:block">
          <div className="grid h-full grid-cols-3 grid-rows-5 gap-1.5 p-1.5">
            {MOSAIC.map((id, i) => (
              <div key={i} className="relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img(id)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          {/* alt degrade + marka rozeti */}
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

/* ---------- yardımcı parçalar ---------- */

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
      <span className="mb-1.5 block text-[12.5px] font-semibold text-ink2">
        {label}
      </span>
      <div className="flex items-center gap-2.5 rounded-xl border border-line2 bg-surface2 px-3.5 py-3 transition focus-within:border-brand/60 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/12">
        <Icon className="h-4.5 w-4.5 shrink-0 text-ink3" strokeWidth={2} />
        {children}
      </div>
    </label>
  );
}

function SocialButton({
  children,
  logo,
  onClick,
}: {
  children: React.ReactNode;
  logo: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-line2 bg-white py-3 text-sm font-bold text-ink transition hover:bg-surface2 active:scale-[0.99]"
    >
      {logo}
      {children}
    </button>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-ink">
      <path d="M16.37 12.86c.03 3.18 2.79 4.24 2.82 4.25-.02.07-.44 1.51-1.45 3-.88 1.28-1.79 2.56-3.22 2.58-1.41.03-1.86-.83-3.47-.83s-2.11.81-3.44.86c-1.39.05-2.45-1.38-3.33-2.66-1.81-2.62-3.19-7.4-1.33-10.63.92-1.6 2.57-2.62 4.36-2.65 1.36-.02 2.64.92 3.47.92.83 0 2.39-1.13 4.03-.97.69.03 2.62.28 3.86 2.1-.1.06-2.3 1.35-2.28 4.02M13.8 4.07c.73-.89 1.22-2.12 1.09-3.35-1.05.04-2.32.7-3.08 1.58-.68.78-1.27 2.04-1.11 3.24 1.17.09 2.37-.59 3.1-1.47" />
    </svg>
  );
}
