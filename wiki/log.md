# Wiki Log

Log cronológico append-only de todas as operações realizadas nesta wiki.

Formato de cada entrada:
```
## [YYYY-MM-DD] <tipo> | <descrição>
Detalhes da operação.
```

Tipos: `ingest`, `feature`, `query`, `lint`, `init`

Para listar as últimas 10 entradas:
```bash
grep "^## \[" wiki/log.md | tail -10
```

---

## [2026-05-27] init | Inicialização da wiki

Wiki criada com estrutura base baseada no padrão LLM Wiki (Karpathy).

Arquivos criados:
- `CLAUDE.md` — schema com instruções para o LLM
- `wiki/index.md` — índice central
- `wiki/log.md` — este arquivo
- `wiki/overview.md` — visão geral do projeto (template)
- Diretórios: `wiki/features/`, `wiki/requirements/`, `wiki/architecture/`, `wiki/entities/`, `wiki/decisions/`
- Diretórios: `raw/requirements/`, `raw/meetings/`, `raw/research/`, `raw/assets/`

Próximos passos: adicionar documentos de requisitos em `raw/requirements/` e pedir ao LLM para ingeri-los.
