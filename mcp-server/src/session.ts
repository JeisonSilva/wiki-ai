import { getDb, nowIso } from "./db.js";

const PENDING_KEY = "session_pending_since";

export function markSessionPending(): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO session_state (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(PENDING_KEY, nowIso());
}

export function getSessionPending(): string | null {
  const db = getDb();
  const row = db
    .prepare("SELECT value FROM session_state WHERE key = ?")
    .get(PENDING_KEY) as any;
  return row ? row.value : null;
}

export function clearSessionPending(): void {
  const db = getDb();
  db.prepare("DELETE FROM session_state WHERE key = ?").run(PENDING_KEY);
}
