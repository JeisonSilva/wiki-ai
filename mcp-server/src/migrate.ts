#!/usr/bin/env node
/**
 * Migração one-shot: recria wiki/wiki.db com o novo schema (pages + metadata +
 * log_entries + embeddings + session_state) e importa o conteúdo de
 * wiki/overview.md e wiki/log.md. Depois de rodar, os arquivos .md em wiki/
 * podem ser removidos — wiki/wiki.db passa a ser a única fonte de verdade.
 */
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { DB_PATH, WIKI_DIR, getDb } from "./db.js";
import { upsertPage } from "./pages.js";
import { appendLog } from "./log.js";

function removeIfExists(path: string): void {
  if (existsSync(path)) unlinkSync(path);
}

function parseLogEntries(text: string): Array<{
  date: string;
  type: string;
  summary: string;
  details: string;
}> {
  const entries: Array<{ date: string; type: string; summary: string; details: string }> = [];
  const headerRe = /^## \[(\d{4}-\d{2}-\d{2})\] (\S+) \| (.+)$/;
  const lines = text.split("\n");

  let current: { date: string; type: string; summary: string; details: string[] } | null = null;

  for (const line of lines) {
    const m = line.match(headerRe);
    if (m) {
      if (current) {
        entries.push({ ...current, details: current.details.join("\n").trim() });
      }
      current = { date: m[1], type: m[2], summary: m[3], details: [] };
    } else if (current) {
      current.details.push(line);
    }
  }
  if (current) {
    entries.push({ ...current, details: current.details.join("\n").trim() });
  }

  return entries;
}

async function main() {
  // Recria o banco do zero com o novo schema.
  removeIfExists(DB_PATH);
  removeIfExists(`${DB_PATH}-shm`);
  removeIfExists(`${DB_PATH}-wal`);
  getDb();

  // Migra wiki/overview.md -> página 'overview'.
  const overviewPath = join(WIKI_DIR, "overview.md");
  if (existsSync(overviewPath)) {
    const body = readFileSync(overviewPath, "utf-8").trim();
    await upsertPage({
      slug: "overview",
      type: "project",
      title: "Visão Geral do Projeto",
      body,
    });
    console.log("[migrate] overview.md -> pages.overview");
  }

  // Migra wiki/log.md -> log_entries (entradas em ordem cronológica).
  const logPath = join(WIKI_DIR, "log.md");
  if (existsSync(logPath)) {
    const text = readFileSync(logPath, "utf-8");
    const entries = parseLogEntries(text).reverse(); // arquivo está em ordem reversa (mais recente primeiro)
    for (const entry of entries) {
      appendLog(entry);
      console.log(`[migrate] log entry: [${entry.date}] ${entry.type} | ${entry.summary}`);
    }
  }

  console.log(`[migrate] concluído -> ${DB_PATH}`);
}

main().catch((err) => {
  console.error("[migrate] erro:", err);
  process.exit(1);
});
