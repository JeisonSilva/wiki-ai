import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// mcp-server/src -> mcp-server -> repo root -> wiki/wiki.db
export const REPO_ROOT = join(__dirname, "..", "..");
export const WIKI_DIR = join(REPO_ROOT, "wiki");
export const DB_PATH = join(WIKI_DIR, "wiki.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS pages (
  slug       TEXT PRIMARY KEY,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  status     TEXT,
  area       TEXT,
  priority   TEXT,
  metadata   TEXT,
  body       TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
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

CREATE TABLE IF NOT EXISTS log_entries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT NOT NULL,
  type       TEXT NOT NULL,
  summary    TEXT NOT NULL,
  details    TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS embeddings (
  slug        TEXT NOT NULL REFERENCES pages(slug) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text  TEXT NOT NULL,
  vector      BLOB NOT NULL,
  model       TEXT NOT NULL,
  PRIMARY KEY (slug, chunk_index)
);

CREATE TABLE IF NOT EXISTS session_state (
  key   TEXT PRIMARY KEY,
  value TEXT
);
`;

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;
  if (!existsSync(WIKI_DIR)) mkdirSync(WIKI_DIR, { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode=WAL");
  db.exec("PRAGMA foreign_keys=ON");
  db.exec(SCHEMA);
  return db;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
