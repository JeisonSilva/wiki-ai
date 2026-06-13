#!/usr/bin/env bash
# Marca que houve atividade nesta sessão.
# Roda após cada resposta do agente (Stop hook).
# O estado é lido pelo session-start.sh na próxima sessão via wiki_session_pending_get.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI="$SCRIPT_DIR/../../mcp-server/dist/cli.js"
[ -f "$CLI" ] || exit 0

node --no-warnings "$CLI" mark-pending >/dev/null 2>&1 || true

exit 0
