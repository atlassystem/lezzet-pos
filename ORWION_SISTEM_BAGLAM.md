# Orwion Sistem Bağlamı — Lezzet POS'u kuran Claude Code için

> **Bu dosyayı baştan oku.** Sen Lezzet POS (restoran programı) üzerinde çalışıyorsun. Bu dosya, içinde
> bulunduğun **büyük resmi** anlatır: Orwion ekosistemi, aynı sunucuda ayrı veritabanlarıyla duran
> programlar, ve Lezzet POS'un bu yapıdaki yeri. Başka bir Claude Code instance'ı ayrı bir programla
> (**Bar Stok**) uğraşıyor; sen **sadece Lezzet POS**'a dokun, diğerlerine karışma.

---

## 1. ORWION NEDİR (büyük resim)
- **orwion.com**, çatı şirket/platform. Altında birden çok **ayrı yazılım ürünü** var.
- Tüm ürünler **tek bir AWS sunucusunda** barınıyor ama her biri **kendi veritabanında** (birbirine karışmaz).
- Her ürün kendi **subdomain**'inden yayınlanır (örn. `kaptanhotels.orwion.com`, ileride `lezzet.orwion.com`).

### Ürünler (aynı sunucu, AYRI veritabanları)
| Ürün | Ne işe yarar | Durum |
|------|--------------|-------|
| **Hotspot** | Misafir Wi‑Fi / hotspot yönetimi | ayrı program, ayrı DB |
| **CRM / Otel (kaptanhotels)** | Otel yönetimi, oda/minibar/sarf, muhasebe entegrasyonu | **canlı** (kaptanhotels.orwion.com) |
| **Restoran (LEZZET POS) ← SEN** | Restoran POS: masa/adisyon/mutfak/rapor | **yeni, local geliştirme** |
| **Bar Stok** | Bar/stok yönetimi | ayrı program (başka bir CL çalışıyor) |

> **İki ayrı "ayrım" kavramı var, karıştırma:**
> - **Ürünler arası ayrım:** Hotspot / CRM / Restoran / Bar Stok = **ayrı uygulamalar, ayrı veritabanları**, aynı sunucu.
> - **Restoran ürününün KENDİ içinde çok kiracılık (multi-tenant):** Lezzet POS birden çok restorana
>   satılabilir; her restoran kendi verisinde, her kayıtta **`restaurant_id`** ile ayrılır.

---

## 2. PAYLAŞILAN ALTYAPI (aynı sunucu)
- **Sunucu:** AWS (Lightsail, Ubuntu, Frankfurt). Önünde **nginx + Cloudflare**.
- **Veritabanı motoru:** MongoDB. Her ürün **kendi DB'si** (örn. otel = `kaptan_hotels`; restoran = ileride `lezzet_pos`).
- **Yayın deseni:** Her ürün kendi subdomain'inde, nginx reverse-proxy ile kendi backend portuna gider,
  systemd servisiyle ayağa kalkar. (Örn. otel: systemd `grandkaptan-api`, uvicorn `:8001`.)
- **Referans alınacak çalışan örnek:** **kaptanhotels** (FastAPI + MongoDB backend, React frontend,
  nginx+Cloudflare, systemd). Lezzet POS canlıya alınınca **aynı deseni** izleyecek (kendi DB + kendi subdomain + kendi servis/port).

---

## 3. LEZZET POS — SENİN İŞİN
### Ne
- Ayrı, **tekrar kullanılabilir**, **çok kiracılı** restoran POS programı. Otel/CRM'den **bağımsız**.
- Şu an **local** (localhost) geliştiriliyor; oturunca **kendi DB'si + kendi subdomain'i** ile aynı AWS sunucusuna alınacak.
- 4 modül: **Masa & Adisyon**, **Menü/Ürün**, **Mutfak Ekranı (KDS)**, **Gün Sonu/Rapor**.
- **Asıl hedef:** profesyonel, modern, şık arayüz. (Bu beklenti henüz tam karşılanmadı — öncelik bu.)

### Teknoloji
- **Frontend:** Next.js 16 + React 19 + shadcn/ui + Tailwind v4. (Bu repo cloner template'inden türedi.)
- **Backend:** FastAPI + MongoDB (**henüz kurulmadı**; kuracaksın). Otel sistemindeki desenle uyumlu.
- **Çok kiracılık:** her kayıtta `restaurant_id`. Tek DB + `restaurant_id` ayrımı başlangıçta yeterli;
  ileride istenirse müşteri başına ayrı DB.

### Şu ana kadar yapılanlar (bu repoda)
- **Faz -1:** `demo.vercel.store` storefront klonu (görsel temel).
- **Faz 0:** POS paleti + 4 ekran Next.js bileşeni olarak, demo veriyle.
  - `src/app/page.tsx` → `<PosApp/>`; `src/components/pos/*`; `src/lib/pos-data.ts`.
  - Palet: espresso `#17120F`, amber `#E7843C`, gold `#E5B25A`; font **Sora + Plus Jakarta Sans**; KDV **%10**;
    3 salon ~17 masa, 6 kategori ~26 ürün.

### Tasarım & spesifikasyon referansları (oku)
- `C:\Users\crm\Desktop\sedna entegre\restoran-pos\index.html` — onaylanmış tek dosya POS prototipi (görsel dil).
- `C:\Users\crm\Desktop\sedna entegre\restoran-pos\CLAUDE_CODE_BRIEF.md` — tam brief (palet, ekranlar, fazlar).
- `C:\Users\crm\Desktop\sedna entegre\RESTORAN_PROGRAMI_ANA_PLAN.md` — mimari, veri modeli, yol haritası.

### Sıradaki işler
1. **Görüntüleme sorununu kapat:** dev server durdur → `.next` sil → `next.config`'te `turbopack.root`'u
   bu projeye sabitle (başıboş `C:\Users\crm\package-lock.json` yanlış kök seçtiriyor) → temiz `npm run dev`
   → **gizli pencerede** localhost:3000. (Tarayıcı eski "DEMO STORE" sayfasını önbellekten gösteriyordu.)
2. **Tasarımı belirgin şekilde yükselt** (modern/premium). Gerekirse önce tek dosya HTML ile onay al.
3. **Backend kur:** FastAPI + MongoDB, `restaurant_id` çok kiracılık, kalıcı veri (CRUD + adisyon + ödeme).
4. Fazlar: Menü CRUD → Masa & Adisyon → KDS → Gün Sonu/Rapor.
5. **Canlıya alma (ileride):** kendi DB (`lezzet_pos`) + kendi subdomain (`lezzet.orwion.com`) + kendi systemd servisi/port,
   nginx+Cloudflare; otel sistemindeki desenle. Bu adımı kullanıcı onayı olmadan yapma.

---

## 4. SINIRLAR (çok önemli)
- **Sadece bu repoya / `lezzet-pos` klasörüne dokun.** Otel (kaptanhotels), Hotspot, **Bar Stok** kod ve
  veritabanlarına **karışma** — onlar ayrı programlar, ayrı CL'ler/sorumlular.
- Sunucuya (AWS) **kullanıcı onayı olmadan** deploy etme; canlı veriye dokunma.
- Sırlar (DB şifresi, token, `.pem`) **repoya girmesin** → `.env` + `.gitignore`.
- Sık **commit + push** (repo: `https://github.com/atlassystem/lezzet-pos`). PC bir kez yeniden başladı,
  iş neredeyse kaybolacaktı.

## 5. ORTAM NOTLARI (Windows/PC)
- Node.js 24 kurulu. PowerShell script kısıtı → `npm` yerine **`npm.cmd`**. `git`, `curl.exe`, `Remove-Item` çalışır.
- Chrome organizasyon politikası: cloner'ın ekran görüntülü recon'u ve eklenti `file://` erişimi engelli.
  Test için `npm run dev` + ekran görüntüsü yeterli; org güvenliğini gevşetme.
- Doğrulama komutu (sunucu gerçekte ne veriyor):
  `curl.exe -s http://localhost:3000 | Select-String "Lezzet","DEMO STORE","Masalar"`

---

### İlk adımın
> "`ORWION_SISTEM_BAGLAM.md`, `..\restoran-pos\CLAUDE_CODE_BRIEF.md` ve `..\restoran-pos\index.html` dosyalarını oku.
>  Önce görüntüleme sorununu kapat (.next temizle + turbopack.root + gizli pencere), POS'un localhost:3000'de
>  doğru render olduğunu doğrula, ekran görüntüsü/rapor ver ve DUR — sonra tasarımı yükseltmeye geçeriz."
