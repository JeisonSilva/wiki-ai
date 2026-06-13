import { getDb } from "./db.js";
import { embed, bufferToVector, cosineSimilarity } from "./embeddings.js";

export interface SearchResult {
  slug: string;
  title: string;
  type: string;
  score: number;
  snippet: string;
}

export type SearchMode = "fts" | "semantic" | "hybrid";

function buildFtsQuery(query: string): string | null {
  const tokens = query.match(/[\p{L}\p{N}_-]+/gu) ?? [];
  if (tokens.length === 0) return null;
  return tokens.map((t) => `"${t.replace(/"/g, '""')}"`).join(" OR ");
}

export function searchFts(query: string, limit = 10): SearchResult[] {
  const ftsQuery = buildFtsQuery(query);
  if (!ftsQuery) return [];

  const db = getDb();
  try {
    const rows = db
      .prepare(
        `SELECT f.slug AS slug, p.title AS title, p.type AS type,
                bm25(pages_fts) AS rank,
                snippet(pages_fts, 2, '**', '**', '...', 24) AS snippet
         FROM pages_fts f
         JOIN pages p ON p.slug = f.slug
         WHERE pages_fts MATCH ?
         ORDER BY rank LIMIT ?`
      )
      .all(ftsQuery, limit) as any[];

    return rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      type: r.type,
      // bm25 is negative; smaller (more negative) = better match. Normalize to a positive score.
      score: -r.rank,
      snippet: r.snippet,
    }));
  } catch {
    return [];
  }
}

export async function searchSemantic(
  query: string,
  limit = 10
): Promise<SearchResult[]> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT e.slug AS slug, e.chunk_text AS chunk_text, e.vector AS vector,
              p.title AS title, p.type AS type
       FROM embeddings e JOIN pages p ON p.slug = e.slug`
    )
    .all() as any[];

  if (rows.length === 0) return [];

  const { vector: queryVector } = await embed(query);
  const best = new Map<string, SearchResult>();

  for (const row of rows) {
    const vector = bufferToVector(row.vector as Buffer);
    const score = cosineSimilarity(queryVector, vector);
    const existing = best.get(row.slug);
    if (!existing || score > existing.score) {
      best.set(row.slug, {
        slug: row.slug,
        title: row.title,
        type: row.type,
        score,
        snippet: row.chunk_text.slice(0, 240),
      });
    }
  }

  return [...best.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function search(
  query: string,
  mode: SearchMode = "hybrid",
  limit = 10
): Promise<SearchResult[]> {
  if (mode === "fts") return searchFts(query, limit);
  if (mode === "semantic") return searchSemantic(query, limit);

  // hybrid: merge FTS and semantic results, normalizing each score to [0,1]
  const ftsResults = searchFts(query, limit * 2);
  const semResults = await searchSemantic(query, limit * 2);

  const maxFts = Math.max(1e-9, ...ftsResults.map((r) => r.score));
  const merged = new Map<string, SearchResult & { combined: number }>();

  for (const r of ftsResults) {
    merged.set(r.slug, { ...r, combined: 0.5 * (r.score / maxFts) });
  }
  for (const r of semResults) {
    const existing = merged.get(r.slug);
    if (existing) {
      existing.combined += 0.5 * r.score;
      if (!existing.snippet) existing.snippet = r.snippet;
    } else {
      merged.set(r.slug, { ...r, combined: 0.5 * r.score });
    }
  }

  return [...merged.values()]
    .sort((a, b) => b.combined - a.combined)
    .slice(0, limit)
    .map(({ combined, ...r }) => ({ ...r, score: combined }));
}
