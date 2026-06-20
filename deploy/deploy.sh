#!/usr/bin/env bash
# Orwion POS — sunucuda derle & yeniden başlat (ilk kurulum sonrası güncellemeler için)
# Çalıştırma (sunucuda):  bash /var/www/orwion-pos/deploy/deploy.sh
set -euo pipefail

APP_DIR="/var/www/orwion-pos"
cd "$APP_DIR"

echo "→ Kod çekiliyor..."
git pull origin master

echo "→ Bağımlılıklar..."
npm ci

echo "→ Build..."
npm run build

echo "→ Standalone'a statik + public kopyalanıyor..."
cp -r .next/static .next/standalone/.next/static
if [ -d public ]; then
  cp -r public .next/standalone/public
fi

echo "→ Servis yeniden başlatılıyor..."
sudo systemctl restart orwion-pos
sleep 2
sudo systemctl --no-pager --lines=0 status orwion-pos || true

echo "✅ Deploy tamam → http://127.0.0.1:3100 (nginx: pos.orwion.com)"
