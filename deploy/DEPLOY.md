# Orwion POS — Canlıya Alma (AWS · pos.orwion.com)

Bu, **kaptanhotels** ile aynı deseni izler: aynı AWS sunucusu, kendi subdomain'i,
nginx reverse-proxy, systemd servisi, önde Cloudflare. Orwion POS şu an **frontend**
(Next.js, demo veri). Kalıcı veri için sonraki faz: **FastAPI + MongoDB** backend.

- **Subdomain:** `pos.orwion.com`
- **Uygulama portu (origin):** `127.0.0.1:3100` (kaptanhotels `:8001`'den ayrı)
- **Servis:** systemd `orwion-pos`
- **Dizin:** `/var/www/orwion-pos`
- **Repo:** https://github.com/atlassystem/orwion-pos

---

## 0) Ön koşullar (sunucuda)
- Node.js 24+ ve npm  → `node -v` (yoksa nvm veya nodesource ile kur)
- nginx kurulu ve çalışıyor
- Bu repoya erişim (public ise sorun yok)

## 1) Kodu çek
```bash
sudo mkdir -p /var/www/orwion-pos
sudo chown -R "$USER" /var/www/orwion-pos
git clone https://github.com/atlassystem/orwion-pos.git /var/www/orwion-pos
cd /var/www/orwion-pos
```

## 2) Derle (standalone)
```bash
npm ci
npm run build
# standalone, statik dosyaları kendi içine ister:
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true
```

## 3) systemd servisi
```bash
sudo cp deploy/orwion-pos.service /etc/systemd/system/orwion-pos.service
# ExecStart'taki node yolunu doğrula: `which node` (gerekirse dosyayı düzelt)
sudo systemctl daemon-reload
sudo systemctl enable --now orwion-pos
sudo systemctl status orwion-pos          # active (running) olmalı
curl -s http://127.0.0.1:3100 | head -c 200   # HTML dönmeli
```

## 4) nginx
```bash
sudo cp deploy/nginx-pos.orwion.com.conf /etc/nginx/sites-available/pos.orwion.com
sudo ln -s /etc/nginx/sites-available/pos.orwion.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 5) Cloudflare DNS (orwion.com bölgesi)
- **A kaydı:** `pos` → sunucunun public IP'si → **Proxied (turuncu bulut)**
- SSL/TLS modu: **Full** (origin'de TLS varsa) veya **Flexible** (origin 80'de düz HTTP).
  kaptanhotels ile aynı modu kullan.

## 6) Doğrula
```bash
curl -s https://pos.orwion.com | grep -o "Orwion"   # "Orwion" görmeli
```
Tarayıcı: https://pos.orwion.com → giriş ekranı.

---

## Güncellemeler (sonraki sürümler)
```bash
bash /var/www/orwion-pos/deploy/deploy.sh
```

## Sorun giderme
- Servis loglar: `journalctl -u orwion-pos -e --no-pager`
- Port çakışması: `PORT`'u `orwion-pos.service` içinde değiştir, `daemon-reload` + `restart`.
- 502: origin çalışmıyor → `systemctl status orwion-pos`.

## Sınırlar (ORWION_SISTEM_BAGLAM.md)
- Yalnızca `pos.orwion.com` / bu repo. Diğer ürünlere (kaptanhotels, hotspot, bar stok) dokunma.
- Sırlar repoya girmez → `.env` + `.gitignore`.
