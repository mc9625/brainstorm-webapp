#!/bin/bash
# Script per avviare il server Express

# Vai alla directory del progetto
cd /Users/massimo/Developer/brainstorm-website/brainstorm

# Directory dei log
LOGDIR="/Users/massimo/Developer/brainstorm-website/brainstorm/logs"
mkdir -p "$LOGDIR"

# Log di startup
echo "$(date): Script di avvio del server iniziato" >> "$LOGDIR/server-startup.log"

# Configurazione completa di NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Verifica che nvm sia disponibile
if ! command -v nvm &> /dev/null; then
    echo "$(date): NVM non disponibile" >> "$LOGDIR/server-startup.log"
    # Fallback al path diretto
    NODE_PATH="/Users/massimo/.nvm/versions/node/v16.20.2/bin/node"
else
    echo "$(date): NVM disponibile, usando Node.js 16" >> "$LOGDIR/server-startup.log"
    nvm use 16
    NODE_PATH=$(which node)
fi

echo "$(date): Usando Node.js in: $NODE_PATH" >> "$LOGDIR/server-startup.log"

# Impostazione delle variabili d'ambiente
export PORT=5001
export NODE_ENV=production

# Esegui il server
echo "$(date): Avvio del server Express..." >> "$LOGDIR/server-startup.log"
$NODE_PATH server.js
