import { getDb, nowIso } from "./db.js";
import { chunkBody } from "./chunk.js";
import { embedAll, vectorToBuffer } from "./embeddings.js";

export interface PageInput {
  slug: string;
  type: string;
  title: string;
  status?: string | null;
  area?: string | null;
  priority?: string | null;
  metadata?: Record<string, unknown> | null;
  body: string;
}

export interface Page {
  slug: string;
  type: string;
  title: string;
  status: string | null;
  area: string | null;
  priority: string | null;
  metadata: Record<string, unknown> | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface PageSummary {
  slug: string;
  type: string;
  title: string;
  status: string | null;
  area: string | null;
  priority: string | null;
  updated_at: string;
}

export interface LinkedPage {
  slug: string;
  title: string | null;
  type: string | null;
}

const LINK_RE = /\[\[([a-z0-9_-]+)\]\]/g;

export function extractLinks(body: string): string[] {
  const found = new Set<string>();
  for (const m of body.matchAll(LINK_RE)) {
    found.add(m[1]);
  }
  return [...found];
}

function rowToPage(row: any): Page {
  return {
    slug: row.slug,
    type: row.type,
    title: row.title,
    status: row.status,
    area: row.area,
    priority: row.priority,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    body: row.body,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function getPageRaw(slug: string): Page | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM pages WHERE slug = ?")
    .get(slug) as any;
  return row ? rowToPage(row) : null;
}

export interface PageWithLinks extends Page {
  links: LinkedPage[];
  backlinks: LinkedPage[];
}

export function getPage(slug: string): PageWithLinks | null {
  const page = getPageRaw(slug);
  if (!page) return null;
  return {
    ...page,
    links: getLinks(slug),
    backlinks: getBacklinks(slug),
  };
}

export function listPages(filter: {
  type?: string;
  status?: string;
  area?: string;
} = {}): PageSummary[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: Record<string, string> = {};

  if (filter.type) {
    clauses.push("type = :type");
    params.type = filter.type;
  }
  if (filter.status) {
    clauses.push("status = :status");
    params.status = filter.status;
  }
  if (filter.area) {
    clauses.push("area = :area");
    params.area = filter.area;
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT slug, type, title, status, area, priority, updated_at FROM pages ${where} ORDER BY type, slug`
    )
    .all(params) as any[];

  return rows.map((r) => ({
    slug: r.slug,
    type: r.type,
    title: r.title,
    status: r.status,
    area: r.area,
    priority: r.priority,
    updated_at: r.updated_at,
  }));
}

/** Creates or updates a page, recomputing links, tags and embeddings. */
export async function upsertPage(input: PageInput): Promise<PageWithLinks> {
  const db = getDb();
  const existing = getPageRaw(input.slug);
  const now = nowIso();

  db.prepare(
    `INSERT INTO pages (slug, type, title, status, area, priority, metadata, body, created_at, updated_at)
     VALUES (:slug, :type, :title, :status, :area, :priority, :metadata, :body, :created_at, :updated_at)
     ON CONFLICT(slug) DO UPDATE SET
       type=excluded.type, title=excluded.title, status=excluded.status,
       area=excluded.area, priority=excluded.priority, metadata=excluded.metadata,
       body=excluded.body, updated_at=excluded.updated_at`
  ).run({
    slug: input.slug,
    type: input.type,
    title: input.title,
    status: input.status ?? null,
    area: input.area ?? null,
    priority: input.priority ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    body: input.body,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  });

  // Recompute links from [[slug]] references in body.
  db.prepare("DELETE FROM links WHERE source_slug = ?").run(input.slug);
  const links = extractLinks(input.body);
  if (links.length) {
    const insertLink = db.prepare(
      "INSERT OR IGNORE INTO links (source_slug, target_slug) VALUES (?, ?)"
    );
    for (const target of links) insertLink.run(input.slug, target);
  }

  // Recompute tags from metadata.tags (optional, free-form).
  db.prepare("DELETE FROM tags WHERE slug = ?").run(input.slug);
  const tags = input.metadata?.tags;
  if (Array.isArray(tags)) {
    const insertTag = db.prepare(
      "INSERT OR IGNORE INTO tags (slug, tag) VALUES (?, ?)"
    );
    for (const tag of tags) insertTag.run(input.slug, String(tag));
  }

  await reembedPage(input.slug, input.title, input.body);

  return getPage(input.slug)!;
}

/** Splits the body into chunks and (re)generates embeddings for the page. */
export async function reembedPage(
  slug: string,
  title: string,
  body: string
): Promise<void> {
  const db = getDb();
  db.prepare("DELETE FROM embeddings WHERE slug = ?").run(slug);

  const chunks = chunkBody(title, body);
  if (chunks.length === 0) return;

  const embeddings = await embedAll(chunks);
  const insert = db.prepare(
    `INSERT INTO embeddings (slug, chunk_index, chunk_text, vector, model)
     VALUES (?, ?, ?, ?, ?)`
  );
  for (let i = 0; i < chunks.length; i++) {
    insert.run(slug, i, chunks[i], vectorToBuffer(embeddings[i].vector), embeddings[i].model);
  }
}

export function deletePage(slug: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM pages WHERE slug = ?").run(slug);
  db.prepare("DELETE FROM links WHERE target_slug = ?").run(slug);
  return result.changes > 0;
}

export function getLinks(slug: string): LinkedPage[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT l.target_slug AS slug, p.title, p.type
       FROM links l LEFT JOIN pages p ON l.target_slug = p.slug
       WHERE l.source_slug = ?`
    )
    .all(slug) as any[];
  return rows.map((r) => ({ slug: r.slug, title: r.title, type: r.type }));
}

export function getBacklinks(slug: string): LinkedPage[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT l.source_slug AS slug, p.title, p.type
       FROM links l LEFT JOIN pages p ON l.source_slug = p.slug
       WHERE l.target_slug = ?`
    )
    .all(slug) as any[];
  return rows.map((r) => ({ slug: r.slug, title: r.title, type: r.type }));
}

export interface DepPage extends LinkedPage {
  distance: number;
}

export function getDeps(slug: string, maxDepth = 5): DepPage[] {
  const db = getDb();
  const rows = db
    .prepare(
      `WITH RECURSIVE deps(source, target, depth) AS (
         SELECT source_slug, target_slug, 1 FROM links WHERE source_slug = :slug
         UNION ALL
         SELECT l.source_slug, l.target_slug, d.depth + 1
         FROM links l JOIN deps d ON l.source_slug = d.target
         WHERE d.depth < :maxDepth
       )
       SELECT DISTINCT d.target AS slug, p.title, p.type, MIN(d.depth) AS distance
       FROM deps d LEFT JOIN pages p ON d.target = p.slug
       GROUP BY d.target ORDER BY distance, d.target`
    )
    .all({ slug, maxDepth }) as any[];
  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    type: r.type,
    distance: r.distance,
  }));
}

export function getOrphans(): PageSummary[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT slug, type, title, status, area, priority, updated_at FROM pages
       WHERE slug NOT IN (SELECT DISTINCT target_slug FROM links)
         AND slug NOT IN ('overview')
       ORDER BY type, slug`
    )
    .all() as any[];
  return rows.map((r) => ({
    slug: r.slug,
    type: r.type,
    title: r.title,
    status: r.status,
    area: r.area,
    priority: r.priority,
    updated_at: r.updated_at,
  }));
}
