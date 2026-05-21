# CLAUDE.md — Wiki-AI Project Context

## What This Project Is

Wiki-AI is a **persistent knowledge repository** built incrementally by LLM. Based on Karpathy's LLM Wiki pattern: raw sources → compilation → structured synthesis.

Core idea: Instead of answering the same question every time, compile knowledge once in wiki pages. Knowledge compounds over time.

---

## Quick Navigation

| File | Purpose |
|------|---------|
| `.cursorrules` | Global rules, pipeline, git workflow, agent routing |
| `.claude/agents/agent-sessoes.md` | Session manager agent |
| `.claude/agents/agent-fontes.md` | Sources manager agent |
| `.claude/agents/agent-wiki.md` | Wiki builder agent |
| `.instructions.md` | Detailed pipeline explanation |
| `fontes/catalogo.md` | Registered sources index |
| `sessoes/indice.md` | Sessions index |
| `wiki/index.md` | Wiki master index |

---

## Project Structure

```
wiki-ai/
├── .cursorrules              # Global rules & agent routing (source of truth)
├── .claude/agents/           # Agent definitions
├── .instructions.md          # Detailed pipeline
├── README.md                 # Project overview
├── CLAUDE.md                 # This file
│
├── fontes/                   # Raw sources (immutable)
│   └── catalogo.md
│
├── sessoes/                  # Work sessions
│   └── indice.md
│
└── wiki/                     # Compiled knowledge
    ├── index.md
    └── pages/
```

---

## Three-Layer Architecture

| Layer | Location | Who manages |
|-------|----------|-------------|
| Fontes (raw) | `fontes/` | Human adds, agent-fontes catalogs |
| Sessões (work) | `sessoes/` | agent-sessoes |
| Wiki (compiled) | `wiki/pages/` | agent-wiki |

---

**Rules and pipeline:** see `.cursorrules`  
**Agent behavior:** see `.claude/agents/`  
**Language:** português brasileiro  
**Last updated:** 2026-05-20
