#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  upsertPage,
  getPage,
  listPages,
  deletePage,
  getLinks,
  getBacklinks,
  getDeps,
  getOrphans,
} from "./pages.js";
import { lint } from "./lint.js";
import { appendLog, recentLogs } from "./log.js";
import { search } from "./search.js";
import { getSessionPending, clearSessionPending } from "./session.js";

const server = new McpServer({
  name: "wiki",
  version: "1.0.0",
});

function json(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

server.registerTool(
  "wiki_get_page",
  {
    title: "Get wiki page",
    description:
      "Retorna uma página completa da wiki (frontmatter, body, links e backlinks) pelo slug.",
    inputSchema: {
      slug: z.string().describe("Slug da página (kebab-case)"),
    },
  },
  async ({ slug }) => {
    const page = getPage(slug);
    if (!page) return json({ error: `Página '${slug}' não encontrada` });
    return json(page);
  }
);

server.registerTool(
  "wiki_list_pages",
  {
    title: "List wiki pages",
    description:
      "Lista páginas da wiki (catálogo), opcionalmente filtrando por type (feature|requirement|entity|adr|architecture|project), status ou area.",
    inputSchema: {
      type: z.string().optional(),
      status: z.string().optional(),
      area: z.string().optional(),
    },
  },
  async ({ type, status, area }) => {
    return json(listPages({ type, status, area }));
  }
);

server.registerTool(
  "wiki_upsert_page",
  {
    title: "Create or update wiki page",
    description:
      "Cria ou atualiza uma página da wiki. Recalcula automaticamente links ([[slug]] no body), tags e embeddings para busca semântica. Use os templates de cada tipo (feature, requirement, entity, adr, architecture, project) definidos no schema para estruturar o `body`.",
    inputSchema: {
      slug: z.string().describe("Slug em kebab-case"),
      type: z
        .enum(["feature", "requirement", "entity", "adr", "architecture", "project"])
        .describe("Tipo de página"),
      title: z.string(),
      status: z.string().optional().describe("Ex: discovery|backlog|in-progress|done|deprecated (feature); active|deprecated|superseded (requirement); proposed|accepted|deprecated|superseded (adr)"),
      area: z.string().optional(),
      priority: z.string().optional().describe("high|medium|low"),
      metadata: z
        .record(z.string(), z.unknown())
        .optional()
        .describe(
          "Campos específicos do tipo, ex: requirements/decisions/features (arrays de slugs), source, supersedes, req-type (functional|non-functional), date, tags"
        ),
      body: z
        .string()
        .describe(
          "Conteúdo markdown da página seguindo as seções do template do tipo correspondente"
        ),
    },
  },
  async ({ slug, type, title, status, area, priority, metadata, body }) => {
    const page = await upsertPage({
      slug,
      type,
      title,
      status,
      area,
      priority,
      metadata,
      body,
    });
    return json(page);
  }
);

server.registerTool(
  "wiki_delete_page",
  {
    title: "Delete wiki page",
    description: "Remove permanentemente uma página da wiki pelo slug.",
    inputSchema: {
      slug: z.string(),
    },
  },
  async ({ slug }) => {
    const deleted = deletePage(slug);
    return json({ deleted });
  }
);

server.registerTool(
  "wiki_search",
  {
    title: "Search wiki",
    description:
      "Busca páginas da wiki. mode='fts' (full-text/bm25), 'semantic' (embeddings, busca por significado) ou 'hybrid' (padrão, combina os dois).",
    inputSchema: {
      query: z.string(),
      mode: z.enum(["fts", "semantic", "hybrid"]).optional().default("hybrid"),
      limit: z.number().int().min(1).max(50).optional().default(10),
    },
  },
  async ({ query, mode, limit }) => {
    const results = await search(query, mode, limit);
    return json(results);
  }
);

server.registerTool(
  "wiki_links",
  {
    title: "Get outgoing links",
    description: "Lista as páginas que `slug` referencia via [[link]].",
    inputSchema: { slug: z.string() },
  },
  async ({ slug }) => json(getLinks(slug))
);

server.registerTool(
  "wiki_backlinks",
  {
    title: "Get backlinks",
    description: "Lista as páginas que referenciam `slug` via [[link]].",
    inputSchema: { slug: z.string() },
  },
  async ({ slug }) => json(getBacklinks(slug))
);

server.registerTool(
  "wiki_deps",
  {
    title: "Get transitive dependencies",
    description: "Lista dependências transitivas (links) de `slug`, até profundidade 5.",
    inputSchema: { slug: z.string() },
  },
  async ({ slug }) => json(getDeps(slug))
);

server.registerTool(
  "wiki_orphans",
  {
    title: "Get orphan pages",
    description: "Lista páginas sem nenhum backlink apontando para elas (exceto 'overview').",
    inputSchema: {},
  },
  async () => json(getOrphans())
);

server.registerTool(
  "wiki_lint",
  {
    title: "Wiki health report",
    description:
      "Relatório de saúde da wiki: features sem requisitos vinculados, páginas órfãs, features in-progress sem guia de implementação e requisitos sem features que os implementam.",
    inputSchema: {},
  },
  async () => json(lint())
);

server.registerTool(
  "wiki_log_append",
  {
    title: "Append log entry",
    description:
      "Adiciona uma entrada ao log cronológico da wiki (substitui wiki/log.md). type: ingest|feature|query|lint|init|session|discovery.",
    inputSchema: {
      type: z.enum(["ingest", "feature", "query", "lint", "init", "session", "discovery"]),
      summary: z.string().describe("Resumo em uma linha"),
      details: z.string().optional().describe("Detalhes adicionais (markdown livre)"),
      date: z.string().optional().describe("YYYY-MM-DD, padrão: hoje"),
    },
  },
  async ({ type, summary, details, date }) => {
    return json(appendLog({ type, summary, details, date }));
  }
);

server.registerTool(
  "wiki_log_recent",
  {
    title: "Recent log entries",
    description: "Retorna as últimas N entradas do log cronológico (padrão 20).",
    inputSchema: {
      limit: z.number().int().min(1).max(200).optional().default(20),
    },
  },
  async ({ limit }) => json(recentLogs(limit))
);

server.registerTool(
  "wiki_overview_get",
  {
    title: "Get project overview",
    description: "Retorna a página 'overview' (visão geral e estado atual do projeto).",
    inputSchema: {},
  },
  async () => {
    const page = getPage("overview");
    return json(page ?? { error: "overview não encontrada" });
  }
);

server.registerTool(
  "wiki_overview_update",
  {
    title: "Update project overview",
    description:
      "Atualiza o body da página 'overview'. Mantém title/metadata existentes se não informados.",
    inputSchema: {
      body: z.string(),
      title: z.string().optional(),
    },
  },
  async ({ body, title }) => {
    const existing = getPage("overview");
    const page = await upsertPage({
      slug: "overview",
      type: "project",
      title: title ?? existing?.title ?? "Visão Geral do Projeto",
      status: existing?.status ?? null,
      area: existing?.area ?? null,
      priority: existing?.priority ?? null,
      metadata: existing?.metadata ?? null,
      body,
    });
    return json(page);
  }
);

server.registerTool(
  "wiki_session_pending_get",
  {
    title: "Get pending session marker",
    description:
      "Retorna o timestamp da última sessão não consolidada, ou null se não houver pendência.",
    inputSchema: {},
  },
  async () => json({ pending_since: getSessionPending() })
);

server.registerTool(
  "wiki_session_pending_clear",
  {
    title: "Clear pending session marker",
    description: "Limpa o marcador de sessão pendente (chamado por /wiki-consolidate).",
    inputSchema: {},
  },
  async () => {
    clearSessionPending();
    return json({ cleared: true });
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Wiki MCP server error:", error);
  process.exit(1);
});
