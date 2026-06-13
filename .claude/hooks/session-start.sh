#!/usr/bin/env bash
# Injeta contexto da wiki no primeiro prompt de cada sessão.
# Stdout é capturado pelo Claude Code e injetado como contexto da conversa.
set -euo pipefail

INPUT=$(cat)

# Extrai session_id do JSON recebido via stdin
SESSION_ID=""
if command -v python3 &>/dev/null; then
  SESSION_ID=$(printf '%s' "$INPUT" | python3 -c "
import sys, json
try: print(json.load(sys.stdin).get('session_id', ''))
except: print('')
" 2>/dev/null || true)
fi
if [ -z "$SESSION_ID" ] && command -v jq &>/dev/null; then
  SESSION_ID=$(printf '%s' "$INPUT" | jq -r '.session_id // empty' 2>/dev/null || true)
fi

# Fallback: sem session_id, usa flag genérica (injeta uma vez por processo)
[ -z "$SESSION_ID" ] && SESSION_ID="fallback-$$"

FLAG="/tmp/wiki-briefed-${SESSION_ID}"
[ -f "$FLAG" ] && exit 0
touch "$FLAG"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI="$SCRIPT_DIR/../../mcp-server/dist/cli.js"

if [ ! -f "$CLI" ]; then
  echo "=== WIKI MCP SERVER NÃO COMPILADO ==="
  echo "Rode 'cd mcp-server && npm install && npm run build' para habilitar o briefing automático e as tools wiki_*."
  exit 0
fi

{
  echo "=== BRIEFING AUTOMÁTICO DA WIKI ==="
  echo ""
  node --no-warnings "$CLI" briefing 2>/dev/null || echo "(briefing indisponível: erro ao executar $CLI)"
  echo ""
  echo "=== FIM DO BRIEFING ==="
}

exit 0
