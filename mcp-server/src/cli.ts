#!/usr/bin/env node
import { getPage, listPages } from "./pages.js";
import { recentLogs } from "./log.js";
import {
  getSessionPending,
  markSessionPending,
  clearSessionPending,
} from "./session.js";

function printBriefing(): void {
  const lines: string[] = [];
  lines.push("=== BRIEFING AUTOMÁTICO DA WIKI ===");
  lines.push("");

  const overview = getPage("overview");
  if (overview && overview.body.trim()) {
    lines.push("## Visão Geral do Projeto");
    lines.push(overview.body.trim());
    lines.push("");
  }

  const pages = listPages();
  if (pages.length > 0) {
    lines.push("## Catálogo da Wiki");
    const byType = new Map<string, typeof pages>();
    for (const p of pages) {
      if (!byType.has(p.type)) byType.set(p.type, []);
      byType.get(p.type)!.push(p);
    }
    for (const [type, items] of byType) {
      lines.push(`### ${type} (${items.length})`);
      for (const p of items) {
        const status = p.status ? ` [${p.status}]` : "";
        lines.push(`- [[${p.slug}]] ${p.title}${status}`);
      }
    }
    lines.push("");
  } else {
    lines.push("## Catálogo da Wiki");
    lines.push("_Nenhuma página registrada ainda._");
    lines.push("");
  }

  const logs = recentLogs(15);
  if (logs.length > 0) {
    lines.push("## Últimas entradas do log");
    for (const entry of logs) {
      lines.push(`- [${entry.date}] ${entry.type} | ${entry.summary}`);
    }
    lines.push("");
  }

  const pending = getSessionPending();
  if (pending) {
    lines.push(
      `> ⚠️  Última sessão registrada em: ${pending} ainda não foi consolidada no log.`
    );
    lines.push("> Execute /wiki-consolidate se houver algo relevante a registrar.");
    lines.push("");
  }

  lines.push("=== FIM DO BRIEFING ===");
  console.log(lines.join("\n"));
}

const command = process.argv[2] ?? "briefing";

switch (command) {
  case "briefing":
    printBriefing();
    break;
  case "mark-pending":
    markSessionPending();
    break;
  case "clear-pending":
    clearSessionPending();
    break;
  case "get-pending":
    console.log(getSessionPending() ?? "");
    break;
  default:
    console.error(`Comando desconhecido: ${command}`);
    console.error("Uso: cli.js <briefing|mark-pending|clear-pending|get-pending>");
    process.exit(1);
}
