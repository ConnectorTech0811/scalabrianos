#!/bin/bash
set -e

# ─── Configuração ────────────────────────────────────────────────────────────
SSH_USER="jfwsysrt"
SSH_HOST="155.204.218.46"
SSH_PORT=22
REMOTE_ROOT="/home/jfwsysrt/public_html/scalabrinianos.dev.connectortech.com.br"
# ─────────────────────────────────────────────────────────────────────────────

if [ -z "$SSH_HOST" ]; then
  echo "❌ Erro: defina SSH_HOST no script antes de executar."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "▶ Build do frontend..."
cd "$SCRIPT_DIR/frontend"
npm run build

echo "▶ Enviando frontend para o servidor..."
rsync -az \
  --exclude="api/" \
  --exclude="uploads/" \
  --exclude=".well-known/" \
  --exclude="cgi-bin/" \
  --exclude=".htaccess*" \
  "$SCRIPT_DIR/frontend/dist/" \
  "$SSH_USER@$SSH_HOST:$REMOTE_ROOT/"

echo "▶ Enviando backend para o servidor (api/)..."
rsync -az --delete \
  --exclude="node_modules/" \
  --exclude=".env" \
  --exclude="uploads/" \
  --exclude="*.sqlite" \
  --exclude="debug.log" \
  "$SCRIPT_DIR/backend/" \
  "$SSH_USER@$SSH_HOST:$REMOTE_ROOT/api/"

echo "▶ Instalando dependências e reiniciando servidor..."
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" \
  "cd $REMOTE_ROOT/api && npm install --ignore-scripts && pm2 restart api-scalab"

echo "✅ Deploy concluído!"
