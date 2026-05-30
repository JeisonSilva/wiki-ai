#!/usr/bin/env bash
# Interface de queries para a wiki SQLite.
# Uso: ./scripts/wiki-query.sh <comando> [args...]
#
# Comandos:
#   search <texto>           busca full-text em todas as páginas
#   list [tipo]              lista páginas (feature|requirement|entity|adr|project)
#   status <status>          filtra features por status
#   show <slug>              exibe metadados de uma página
#   links <slug>             páginas que este slug referencia
#   backlinks <slug>         páginas que apontam para este slug
#   deps <slug>              dependências transitivas (CTE recursiva)
#   orphans                  páginas sem backlinks
#   lint                     relatório de saúde da wiki
#   rebuild                  reconstrói o banco do zero

set -euo pipefail

DB="$(dirname "$0")/../wiki/wiki.db"
SYNC="$(dirname "$0")/sync_wiki.py"

# Garante que o banco existe
if [ ! -f "$DB" ]; then
  python3 "$SYNC" --rebuild
fi

CMD="${1:-help}"
shift || true

q() { sqlite3 -column -header "$DB" "$@"; }

case "$CMD" in

  search)
    TERM="${1:?uso: wiki-query.sh search <texto>}"
    q "
      SELECT slug, type, snippet(pages_fts, 1, '**', '**', '...', 20) AS trecho
      FROM pages_fts
      WHERE pages_fts MATCH '$(echo "$TERM" | sed "s/'/''/g")'
      ORDER BY rank
      LIMIT 20
    "
    ;;

  list)
    TYPE="${1:-}"
    if [ -n "$TYPE" ]; then
      q "SELECT slug, title, status, area FROM pages WHERE type='$TYPE' ORDER BY updated_at DESC"
    else
      q "SELECT slug, type, title, status FROM pages ORDER BY type, slug"
    fi
    ;;

  status)
    STATUS="${1:?uso: wiki-query.sh status <status>}"
    q "SELECT slug, title, area, priority FROM pages WHERE status='$STATUS' ORDER BY priority, slug"
    ;;

  show)
    SLUG="${1:?uso: wiki-query.sh show <slug>}"
    q "SELECT slug, type, title, status, area, priority, created_at, updated_at FROM pages WHERE slug='$SLUG'"
    ;;

  links)
    SLUG="${1:?uso: wiki-query.sh links <slug>}"
    q "
      SELECT l.target_slug AS aponta_para, p.title, p.type
      FROM links l
      LEFT JOIN pages p ON l.target_slug = p.slug
      WHERE l.source_slug='$SLUG'
    "
    ;;

  backlinks)
    SLUG="${1:?uso: wiki-query.sh backlinks <slug>}"
    q "
      SELECT l.source_slug AS referenciado_por, p.title, p.type
      FROM links l
      LEFT JOIN pages p ON l.source_slug = p.slug
      WHERE l.target_slug='$SLUG'
    "
    ;;

  deps)
    SLUG="${1:?uso: wiki-query.sh deps <slug>}"
    q "
      WITH RECURSIVE deps(source, target, depth) AS (
        SELECT source_slug, target_slug, 1
        FROM links WHERE source_slug='$SLUG'
        UNION ALL
        SELECT l.source_slug, l.target_slug, d.depth+1
        FROM links l JOIN deps d ON l.source_slug=d.target
        WHERE d.depth < 5
      )
      SELECT DISTINCT target AS slug, p.title, p.type, MIN(depth) AS distancia
      FROM deps d LEFT JOIN pages p ON d.target=p.slug
      GROUP BY target ORDER BY distancia, target
    "
    ;;

  orphans)
    q "
      SELECT slug, type, title
      FROM pages
      WHERE slug NOT IN (SELECT DISTINCT target_slug FROM links)
        AND slug NOT IN ('overview','index','log')
      ORDER BY type, slug
    "
    ;;

  lint)
    echo "=== Features sem requisitos vinculados ==="
    q "
      SELECT p.slug, p.title
      FROM pages p
      WHERE p.type='feature'
        AND NOT EXISTS (
          SELECT 1 FROM links l
          JOIN pages r ON l.target_slug=r.slug
          WHERE l.source_slug=p.slug AND r.type='requirement'
        )
    "

    echo ""
    echo "=== Páginas órfãs (sem backlinks) ==="
    q "
      SELECT slug, type, title FROM pages
      WHERE slug NOT IN (SELECT DISTINCT target_slug FROM links)
        AND slug NOT IN ('overview','index','log')
      ORDER BY type, slug
    "

    echo ""
    echo "=== Features in-progress sem guia de implementação ==="
    q "
      SELECT slug, title FROM pages
      WHERE type='feature' AND status='in-progress'
        AND body NOT LIKE '%## Guia de Implementação%'
    "

    echo ""
    echo "=== Requisitos sem features que os implementam ==="
    q "
      SELECT p.slug, p.title FROM pages p
      WHERE p.type='requirement'
        AND NOT EXISTS (
          SELECT 1 FROM links l
          JOIN pages f ON l.source_slug=f.slug
          WHERE l.target_slug=p.slug AND f.type='feature'
        )
    "
    ;;

  rebuild)
    python3 "$SYNC" --rebuild
    ;;

  help|*)
    cat <<'EOF'
Uso: wiki-query.sh <comando> [args]

  search <texto>      busca full-text em todas as páginas
  list [tipo]         lista páginas (feature|requirement|entity|adr|project)
  status <status>     filtra por status (discovery|backlog|in-progress|done)
  show <slug>         metadados de uma página
  links <slug>        o que este slug referencia
  backlinks <slug>    quem aponta para este slug
  deps <slug>         dependências transitivas
  orphans             páginas sem backlinks
  lint                relatório de saúde da wiki
  rebuild             reconstrói o banco do zero
EOF
    ;;
esac
