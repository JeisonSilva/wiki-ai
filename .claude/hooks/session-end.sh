#!/usr/bin/env bash
# Marca que houve atividade nesta sessão.
# Roda após cada resposta do agente (Stop hook).
# O arquivo .session-pending é lido pelo session-start.sh na próxima sessão.

WIKI="$(pwd)/wiki"
[ -d "$WIKI" ] || exit 0

date +"%Y-%m-%d %H:%M" > "$WIKI/.session-pending"

exit 0
