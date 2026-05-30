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

WIKI="$(pwd)/wiki"
[ -d "$WIKI" ] || exit 0

{
  echo "=== BRIEFING AUTOMÁTICO DA WIKI ==="
  echo ""

  if [ -f "$WIKI/overview.md" ]; then
    cat "$WIKI/overview.md"
    echo ""
  fi

  if [ -f "$WIKI/index.md" ]; then
    cat "$WIKI/index.md"
    echo ""
  fi

  if [ -f "$WIKI/log.md" ]; then
    echo "### Últimas entradas do log"
    tail -50 "$WIKI/log.md"
    echo ""
  fi

  if [ -f "$WIKI/.session-pending" ]; then
    echo ""
    echo "> ⚠️  Última sessão registrada em: $(cat "$WIKI/.session-pending") ainda não foi consolidada no log."
    echo "> Execute /wiki-consolidate se houver algo relevante a registrar."
    echo ""
  fi

  echo "=== FIM DO BRIEFING ==="
}

exit 0
