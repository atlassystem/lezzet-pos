# Orwion POS — Canlıya Alma Görevi (Deploy CL için)

> Bu dosyayı baştan oku. Karar: **İKİSİ PARALEL** — önce kaydı al, arayüzü canlıya al,
> aynı anda backend'i kur. Mevcut belgeler: `deploy/DEPLOY.md`, `ORWION_POS_DEVIR_BRIFINGI.md`,
> `ORWION_SISTEM_BAGLAM.md`. Önce onları oku, sonra aşağıdaki sırayı uygula.

## DURUM (özet)
- Orwion POS = **Next.js arayüzü** (Faz 3.3). 19 modül: login, rol/yetki, personel, masa/adisyon,
  mutfak, menü, reçeteli (BOM) stok + otomatik düşüm, garson terminali, sıramatik, rapor, ayarlar, şubeler.
- **Backend YOK, veri DEMO/bellek içi** → şu an yenileyince sıfırlanır. Kalıcılık için backend şart.
- Repo: `https://github.com/atlassystem/orwion-pos`. Deploy hedefi: `pos.orwion.com`, port `3100`, systemd `orwion-pos`.

---

## AWS ERİŞİM (tüm erişimler — bu PC'de zaten kurulu, ek kurulum gerekmez)
- **Sunucu:** AWS Lightsail, Frankfurt. **Public IP: 63.186.12.238** (static). Kullanıcı: `ubuntu`.
- **SSH:** alias **`kaptan`** → `C:\Users\crm\.ssh\config`. Anahtar: `C:\Users\crm\.ssh\LightsailDefaultKey.pem`.
  - Bağlan: `ssh kaptan "hostname"` → `ip-172-26-11-159` dönerse tamam.
  - Git Bash'ten: `ssh -F "/c/Users/crm/.ssh/config" kaptan "..."`
  - Kopma olursa: (1) `.ssh\config`'te `kaptan` HostName = 63.186.12.238 mi? (2) Lightsail firewall'da **TCP/22** bu PC'nin güncel IP'sine açık mı? PC IP: `curl.exe -s ifconfig.me` → Lightsail → Networking → IPv4 Firewall → SSH/22 "Restrict to IP" (⚠️ `0.0.0.0/0` yapma).
- **MongoDB:** `mongodb://localhost:27017`, **auth yok**, `bindIp 127.0.0.1` (sadece sunucu içinden). İzolasyon **DB adıyla**.
- **GitHub repo:** `https://github.com/atlassystem/orwion-pos`.
- **Cloudflare:** `orwion.com` bölgesi (subdomain DNS kaydı için).
- **Test — PLAYWRIGHT MCP (gerçek tarayıcı, görsel) + SSH/curl:**
  - **Playwright MCP** kurulu → kullan: `pos.orwion.com`'u (veya localde `127.0.0.1:3100`) tarayıcıda aç, **ekran görüntüsü al**, akışları test et (giriş → masa aç → ürün ekle → öde, stok düşümü, personel), **konsol hatası** var mı bak. Otel sisteminde yaptığımız gibi kanıtlı, görsel test. Sonuçları ekran görüntüsüyle sun.
  - **Sunucu tarafı (ek doğrulama):** `ssh kaptan "curl -s http://127.0.0.1:3100 | head -c 200"`, `ssh kaptan "systemctl status orwion-pos --no-pager"`, `ssh kaptan "journalctl -u orwion-pos -e --no-pager"`.

## İZOLASYON MATRİSİ (aynı sunucu, her şey AYRI — EN ÖNEMLİ KURAL)
| Sistem | Veritabanı | Servis | Port | Klasör | Subdomain |
|---|---|---|---|---|---|
| Otel/CRM | `kaptan_hotels` 🚫 DOKUNMA | grandkaptan-api | 8001 | /home/ubuntu/app | kaptanhotels.orwion.com |
| Bar Stok | (kendi DB'si) 🚫 DOKUNMA | (kendi servisi) | (kendi portu) | (kendi klasörü) | (kendi) |
| **Orwion POS (SEN)** | **`orwion_pos`** | **orwion-pos** | **3100** | **/var/www/orwion-pos** | **pos.orwion.com** |

**Kural:** yalnızca kendi satırına dokun. Orwion POS **sadece `orwion_pos`** DB'sine yazar/okur; otelin `kaptan_hotels`'ine ve bar stok'un DB'sine ASLA dokunmaz. Mongo'ya **auth ekleme** (üç sistemi de etkiler).

> Not (port/subdomain çelişkisi): Eski DEVIR brifingi `8002 / pos.grandkaptanhotel.com` diyordu; **GÜNCEL GERÇEK = Next.js standalone `3100` / `pos.orwion.com`** (deploy dosyaları buna göre). Bunu esas al.

---

## ADIM 0 — ÖNCE KAYDI AL (kayıp olmasın)
Yerelde `lezzet-pos` klasöründe **14 commit edilmemiş değişiklik** var.
```bash
cd "C:\Users\crm\Desktop\sedna entegre\lezzet-pos"
git add -A
git commit -m "Faz 3.4: canliya alma oncesi kayit"
git push
```
Push bitince repo güncel; sunucu bu repodan çekecek.

---

## A) ARAYÜZÜ CANLIYA AL (pos.orwion.com) — `deploy/DEPLOY.md`'yi uygula
Adımlar zaten `deploy/DEPLOY.md` içinde net. Özet:
1. Sunucuda `/var/www/orwion-pos`'a repoyu clone et, `npm ci && npm run build` (standalone), static/public kopyala.
2. `deploy/orwion-pos.service` → systemd, **port 3100**, `systemctl enable --now orwion-pos`. `curl 127.0.0.1:3100` HTML dönmeli.
3. `deploy/nginx-pos.orwion.com.conf` → nginx site, `nginx -t && reload`.
4. **Cloudflare (orwion.com):** `pos` için A kaydı → **63.186.12.238** (Proxied). SSL kaptanhotels ile aynı mod.
5. `certbot --nginx -d pos.orwion.com` (SSL). Doğrula: `https://pos.orwion.com` → giriş ekranı.
> Bu aşama bitince: POS canlı ve görünür (ama hâlâ demo veri — kalıcı değil). Ekran görüntüsü al, raporla, DUR.

---

## B) BACKEND KUR (paralel — gerçek kalıcı veri)
Amaç: demo/bellek verisini **MongoDB**'ye taşı, kalıcı olsun.

**Mimari (önerilen — en sade):** Ayrı servis kurma; **Next.js API route'ları** kullan (`src/app/api/...`) +
**MongoDB driver**. Tek uygulama, tek servis (zaten 3100'de çalışan `orwion-pos`), ekstra port yok.
(Alternatif: otel deseniyle ayrı **FastAPI :8002** — ama Next API daha sade, onu seç.)

**Veritabanı — İZOLASYON KURALI (en önemli):**
- DB adı **KESİN `orwion_pos`** (`mongodb://localhost:27017`, auth yok, bindIp 127.0.0.1).
- 🚫 `kaptan_hotels`'a (otel) ASLA dokunma; otel servisleri/portu/klasörü (`grandkaptan-api`, `:8001`, `/home/ubuntu/app`) değiştirilmez.

**Yapılacaklar:**
1. `.env` (gitignore'da): `MONGO_URL=mongodb://localhost:27017`, `DB_NAME=orwion_pos`.
2. `src/lib/pos-data.ts`'teki modellere göre koleksiyonlar (her kayıtta `restaurant_id` — çok kiracılık):
   `categories, products, tables, orders, payments, stock, recipes(BOM), personnel, roles, branches`.
3. API route'ları: her modül için CRUD + akış (adisyon aç/ürün ekle/öde, stok düş, personel, rapor).
4. Frontend bileşenlerini bellek state yerine **API'den oku/yaz** (önce menü/ürün + masa/adisyon, sonra stok/personel).
5. Seed: ilk kurulumda demo veriyi `orwion_pos`'a bir kez yükle (idempotent).
6. Build + `systemctl restart orwion-pos`. Doğrula: sipariş/stok gir → **sayfayı yenile → veri DURUYOR mu** (kalıcılık testi).

---

## C) POS YEDEĞİ (backend gelince)
Otel yedeği yalnız `--db kaptan_hotels` alır. POS kendi yedeğini almalı:
- `mongodump --db orwion_pos` → her gece + offsite kopya (otel yedek otomasyonuyla aynı desen, ayrı dosya/cron satırı).

---

## SINIRLAR (değişmez)
- Sadece `pos.orwion.com` / `orwion-pos` reposu / `orwion_pos` DB. Diğer ürünlere (kaptanhotels, hotspot, bar stok) dokunma.
- Sırlar repoya girmez (`.env` + `.gitignore`). Mongo'ya auth ekleme (iki sistemi de etkiler).
- Her yeni servis/port/DB'yi ilgili belgeye işle.

## DOĞRULAMA & RAPOR (her aşamada)
- A bitince: `https://pos.orwion.com` açılıyor mu, giriş ekranı geliyor mu (ekran görüntüsü).
- B bitince: veri **kalıcı** mı (yenileyince duruyor mu), konsol/derleme hatası yok mu.
- Bittikçe kısa rapor + DUR, onay bekle.

### İlk mesajın (kullanıcıdan)
> "`CANLIYA_ALMA_GOREV.md` ve `deploy/DEPLOY.md`'yi oku. ADIM 0 (commit/push) → A (pos.orwion.com canlı) yap,
>  ekran görüntüsü/rapor ver, DUR. Onaydan sonra B (backend + orwion_pos) kuralım."
