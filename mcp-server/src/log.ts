import { getDb, nowIso, today } from "./db.js";

export interface LogEntry {
  id: number;
  date: string;
  type: string;
  summary: string;
  details: string | null;
  created_at: string;
}

export function appendLog(input: {
  type: string;
  summary: string;
  details?: string | null;
  date?: string;
}): LogEntry {
  const db = getDb();
  const date = input.date ?? today();
  const created_at = nowIso();
  const result = db
    .prepare(
      `INSERT INTO log_entries (date, type, summary, details, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(date, input.type, input.summary, input.details ?? null, created_at);

  return {
    id: Number(result.lastInsertRowid),
    date,
    type: input.type,
    summary: input.summary,
    details: input.details ?? null,
    created_at,
  };
}

export function recentLogs(limit = 20): LogEntry[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, date, type, summary, details, created_at
       FROM log_entries ORDER BY id DESC LIMIT ?`
    )
    .all(limit) as any[];
  return rows.reverse();
}
