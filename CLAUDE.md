# CLAUDE.md — Wiki-AI Project Context

## What This Project Is

Wiki-AI is a **persistent knowledge repository** built incrementally by LLM. Based on Karpathy's LLM Wiki pattern: raw sources → compilation → structured synthesis.

Core idea: Instead of answering the same question every time, compile knowledge once in wiki pages. Knowledge compounds over time.

---

## Quick Navigation

- **Read First** → `README.md` overview
- **Instructions** → `.instructions.md` for detailed pipeline
- **Rules** → `.cursorrules` global boundaries
- **Wiki Base** → `wiki/pages/` for existing knowledge

---

## Project Structure

```
wiki-ai/
├── .instructions.md          # Detailed instructions for LLM
├── .cursorrules              # Global rules & agent routing
├── README.md                 # Project overview
├── CLAUDE.md                 # This file
│
├── fontes/                   # Raw sources (immutable)
│   ├── catalogo.md          # Source index
│   └── [source files]
│
├── sessoes/                  # Work sessions (conversations)
│   ├── indice.md            # Session index
│   └── sessao-*.md
│
└── wiki/                     # Compiled knowledge (vive & grows)
    ├── index.md             # Master index
    └── pages/
        ├── principios-desenvolvimento.md
        ├── arquitetura.md
        ├── gestao-fontes.md
        ├── qualidade-codigo.md
        └── [future pages]
```

---

## Three-Layer Architecture

### Layer 1: Fontes (Raw)
- Original documentation, code, articles
- **Immutable**
- Cataloged with ID, type, tags

### Layer 2: Sessões (Work)
- Conversations and work sessions
- Each session feeds wiki compilation
- Summarized for agent-wiki

### Layer 3: Wiki (Compiled)
- Synthesized knowledge
- Persistent and indexed
- One idea per page, cross-referenced
- Every claim cites its source

---

## Core Workflow

```
User brings knowledge
         ↓
Session registered (agent-sessoes)
         ↓
Work happens in conversation
         ↓
Session ended with summary
         ↓
Agent-wiki compiles → new/update pages
         ↓
Indices and cross-refs updated
         ↓
Human validates
         ↓
Git commit (references session)
```

**Key rule**: Never commit until session is closed and wiki is processed.

---

## When to Use Each Agent

| Context | Agent | Config |
|---------|-------|--------|
| Start/end/register session | `agent-sessoes` | `.cursor/rules/agent-sessoes.mdc` |
| Catalog/search/update sources | `agent-fontes` | `.cursor/rules/agent-fontes.mdc` |
| Create/update wiki pages | `agent-wiki` | `.cursor/rules/agent-wiki.mdc` |

---

## Knowledge Boundaries

### What's Allowed
- Content in `wiki/pages/` — use it
- Sources in `fontes/` — reference them
- Session summaries in `sessoes/` — build on them
- Explicit user instructions — follow them

### What's Forbidden Without Approval
- External web search
- Using general model knowledge for wiki content
- Creating files outside project structure
- Inferring beyond local sources

**If information is missing**: *"Não encontrei isso nas fontes locais. Você quer adicionar uma fonte ou registrar isso numa sessão?"*

---

## Quality Checklist for Wiki Pages

Before confirming compilation:

- [ ] Page has 1-2 line summary
- [ ] "Why" section explains motivation
- [ ] "How to Apply" has practical guidance
- [ ] No orphaned pages (every page is referenced)
- [ ] Index updated with new page
- [ ] No contradictions with existing pages
- [ ] All sources used are in `fontes/catalogo.md`

---

## Git Workflow

### Branch
Always work on feature branch from `main`:
```bash
git checkout -b claude/feature-name
```

### Commits
Format: `[type]: [what changed] — session #X`

Examples:
```
feat: add wiki page on retry strategies — session #5
fix: resolve contradiction between error handling pages — session #7
refactor: reorganize wiki index — maintenance
```

### Push & PR
After validation:
```bash
git push -u origin claude/feature-name
# Then create PR for review
```

---

## Important Constraints

1. **No external knowledge** — everything comes from sources or sessions
2. **Validate before compile** — human approves before wiki updates
3. **One idea per page** — no mega-pages
4. **Always cite sources** — (Fonte ID: X) or (Sessão #X)
5. **Never delete** — archive instead
6. **Version everything** — git is truth

---

## Session First!

⚠️ **CRITICAL**: Before responding to ANY user request:
1. Check if session is open
2. If not, invoke `agent-sessoes` to open one
3. Only then proceed with request

This ensures all work is tracked and compiles to wiki.

---

## Future Development

Planned additions to wiki:

- [ ] Logging strategies
- [ ] Error handling patterns
- [ ] Testing best practices
- [ ] Performance optimization
- [ ] Deployment workflows
- [ ] Monitoring & observability

Each becomes its own page when ready.

---

## Feedback & Changes

If you notice:
- **Contradiction** between pages → flag for review
- **Orphaned page** (not referenced) → merge or delete
- **Missing pattern** → suggest new page
- **Source obsolete** → mark deprecated in catalog

All changes flow through agent-wiki + human validation.

---

**Last updated**: 2026-05-20  
**Base pattern**: Karpathy LLM Wiki  
**Language**: Portuguese BR (português brasileiro)
