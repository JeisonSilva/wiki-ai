#!/usr/bin/env python3
"""Sincroniza arquivos wiki/*.md para wiki/wiki.db (SQLite).

Uso:
  python3 scripts/sync_wiki.py            # sync incremental
  python3 scripts/sync_wiki.py --rebuild  # recria o banco do zero
"""

import argparse
import re
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

WIKI_DIR = Path(__file__).parent.parent / "wiki"
DB_PATH = WIKI_DIR / "wiki.db"

# Mapeamento de subdiretório → tipo de página
DIR_TYPE = {
    "features": "feature",
    "requirements": "requirement",
    "entities": "entity",
    "decisions": "adr",
    "architecture": "architecture",
    ".": "project",
}

SKIP_SLUGS = {"_template"}


def connect(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def create_schema(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS pages (
            slug       TEXT PRIMARY KEY,
            type       TEXT NOT NULL,
            title      TEXT NOT NULL,
            status     TEXT,
            area       TEXT,
            priority   TEXT,
            created_at TEXT,
            updated_at TEXT,
            body       TEXT,
            file_path  TEXT,
            mtime      REAL
        );

        CREATE TABLE IF NOT EXISTS links (
            source_slug TEXT NOT NULL REFERENCES pages(slug) ON DELETE CASCADE,
            target_slug TEXT NOT NULL,
            PRIMARY KEY (source_slug, target_slug)
        );

        CREATE TABLE IF NOT EXISTS tags (
            slug TEXT NOT NULL REFERENCES pages(slug) ON DELETE CASCADE,
            tag  TEXT NOT NULL,
            PRIMARY KEY (slug, tag)
        );

        CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(
            slug UNINDEXED,
            title,
            body,
            content='pages',
            content_rowid='rowid'
        );

        CREATE TRIGGER IF NOT EXISTS pages_ai AFTER INSERT ON pages BEGIN
            INSERT INTO pages_fts(rowid, slug, title, body)
            VALUES (new.rowid, new.slug, new.title, new.body);
        END;

        CREATE TRIGGER IF NOT EXISTS pages_au AFTER UPDATE ON pages BEGIN
            INSERT INTO pages_fts(pages_fts, rowid, slug, title, body)
            VALUES ('delete', old.rowid, old.slug, old.title, old.body);
            INSERT INTO pages_fts(rowid, slug, title, body)
            VALUES (new.rowid, new.slug, new.title, new.body);
        END;

        CREATE TRIGGER IF NOT EXISTS pages_ad AFTER DELETE ON pages BEGIN
            INSERT INTO pages_fts(pages_fts, rowid, slug, title, body)
            VALUES ('delete', old.rowid, old.slug, old.title, old.body);
        END;
    """)
    conn.commit()


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Extrai frontmatter YAML e corpo do markdown."""
    import re as _re
    m = _re.match(r"^---\n(.+?)\n---\n?(.*)", text, _re.DOTALL)
    if not m:
        return {}, text

    meta: dict = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, _, v = line.partition(":")
            raw = v.strip().strip('"').strip("'")
            # listas simples: [a, b, c]
            if raw.startswith("[") and raw.endswith("]"):
                raw = [i.strip().strip('"').strip("'") for i in raw[1:-1].split(",") if i.strip()]
            meta[k.strip()] = raw
    return meta, m.group(2).strip()


def infer_type(path: Path) -> str:
    parent = path.parent.name
    return DIR_TYPE.get(parent, "project")


def extract_links(body: str) -> list[str]:
    return re.findall(r"\[\[([a-z0-9_-]+)\]\]", body)


def extract_title(meta: dict, body: str, slug: str) -> str:
    if meta.get("title"):
        return str(meta["title"])
    m = re.search(r"^#\s+(.+)", body, re.MULTILINE)
    return m.group(1).strip() if m else slug


def upsert_page(conn: sqlite3.Connection, path: Path) -> bool:
    mtime = path.stat().st_mtime
    row = conn.execute("SELECT mtime FROM pages WHERE file_path = ?", [str(path)]).fetchone()
    if row and row["mtime"] == mtime:
        return False  # sem mudança

    text = path.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)
    slug = path.stem
    if slug in SKIP_SLUGS:
        return False

    page_type = meta.get("type") or infer_type(path)
    title = extract_title(meta, body, slug)

    conn.execute("""
        INSERT INTO pages (slug, type, title, status, area, priority,
                           created_at, updated_at, body, file_path, mtime)
        VALUES (:slug, :type, :title, :status, :area, :priority,
                :created_at, :updated_at, :body, :file_path, :mtime)
        ON CONFLICT(slug) DO UPDATE SET
            type=excluded.type, title=excluded.title,
            status=excluded.status, area=excluded.area,
            priority=excluded.priority, updated_at=excluded.updated_at,
            body=excluded.body, file_path=excluded.file_path, mtime=excluded.mtime
    """, {
        "slug": slug,
        "type": page_type,
        "title": title,
        "status": meta.get("status"),
        "area": meta.get("area"),
        "priority": meta.get("priority"),
        "created_at": meta.get("created"),
        "updated_at": meta.get("updated") or datetime.now(timezone.utc).date().isoformat(),
        "body": body,
        "file_path": str(path),
        "mtime": mtime,
    })

    conn.execute("DELETE FROM links WHERE source_slug = ?", [slug])
    found = extract_links(body)
    if found:
        conn.executemany(
            "INSERT OR IGNORE INTO links VALUES (?, ?)",
            [(slug, t) for t in found],
        )

    tags = meta.get("requirements", []) or []
    if isinstance(tags, str):
        tags = [tags]
    conn.execute("DELETE FROM tags WHERE slug = ?", [slug])
    if tags:
        conn.executemany("INSERT OR IGNORE INTO tags VALUES (?, ?)", [(slug, t) for t in tags])

    return True


def sync(rebuild: bool = False) -> None:
    if rebuild and DB_PATH.exists():
        DB_PATH.unlink()
        print(f"[sync] banco removido para rebuild")

    conn = connect(DB_PATH)
    create_schema(conn)

    updated = 0
    for md in sorted(WIKI_DIR.rglob("*.md")):
        if md.name.startswith("_"):
            continue
        if upsert_page(conn, md):
            print(f"[sync] {md.relative_to(WIKI_DIR.parent)}")
            updated += 1

    conn.commit()
    conn.close()

    if updated == 0:
        print("[sync] nenhuma mudança detectada")
    else:
        print(f"[sync] {updated} página(s) sincronizada(s) → {DB_PATH}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--rebuild", action="store_true", help="Recria o banco do zero")
    args = parser.parse_args()
    sync(rebuild=args.rebuild)
