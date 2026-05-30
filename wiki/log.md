# Wiki Log

Log cronológico append-only de todas as operações realizadas nesta wiki.

Formato de cada entrada:
```
## [YYYY-MM-DD] <tipo> | <descrição>
Detalhes da operação.
```

Tipos: `ingest`, `feature`, `query`, `lint`, `init`, `session`

Para listar as últimas 10 entradas:
```bash
grep "^## \[" wiki/log.md | tail -10
```

---

## [2026-05-30] feature | Captura automática de sessão via hooks

Arquivos criados:
- `.claude/settings.json` — ativa hooks `UserPromptSubmit` e `Stop`
- `.claude/hooks/session-start.sh` — injeta contexto da wiki no primeiro prompt de cada sessão
- `.claude/hooks/session-end.sh` — grava `wiki/.session-pending` ao final de cada resposta
- `.claude/commands/wiki-consolidate.md` — novo skill para consolidar sessão no log

Arquivos atualizados:
- `CLAUDE.md` — adicionado workflow 6 (consolidação) e seção sobre captura automática
- `wiki/log.md` — tipo `session` adicionado aos tipos válidos

Comportamento: no início de cada sessão, `overview.md`, `index.md` e as últimas 50 linhas
do `log.md` são injetados automaticamente como contexto. Sessões não consolidadas geram aviso
no briefing da próxima sessão.

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
