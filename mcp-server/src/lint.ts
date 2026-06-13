import { getDb } from "./db.js";
import { getOrphans, PageSummary } from "./pages.js";

export interface LintReport {
  features_without_requirements: PageSummary[];
  orphan_pages: PageSummary[];
  in_progress_without_guide: PageSummary[];
  requirements_without_features: PageSummary[];
}

export function lint(): LintReport {
  const db = getDb();

  const features_without_requirements = db
    .prepare(
      `SELECT p.slug, p.type, p.title, p.status, p.area, p.priority, p.updated_at
       FROM pages p
       WHERE p.type = 'feature'
         AND NOT EXISTS (
           SELECT 1 FROM links l
           JOIN pages r ON l.target_slug = r.slug
           WHERE l.source_slug = p.slug AND r.type = 'requirement'
         )`
    )
    .all() as unknown as PageSummary[];

  const in_progress_without_guide = db
    .prepare(
      `SELECT slug, type, title, status, area, priority, updated_at
       FROM pages
       WHERE type = 'feature' AND status = 'in-progress'
         AND body NOT LIKE '%## Guia de Implementação%'`
    )
    .all() as unknown as PageSummary[];

  const requirements_without_features = db
    .prepare(
      `SELECT p.slug, p.type, p.title, p.status, p.area, p.priority, p.updated_at
       FROM pages p
       WHERE p.type = 'requirement'
         AND NOT EXISTS (
           SELECT 1 FROM links l
           JOIN pages f ON l.source_slug = f.slug
           WHERE l.target_slug = p.slug AND f.type = 'feature'
         )`
    )
    .all() as unknown as PageSummary[];

  return {
    features_without_requirements,
    orphan_pages: getOrphans(),
    in_progress_without_guide,
    requirements_without_features,
  };
}
