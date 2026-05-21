# CLAUDE.md — Wiki-AI

## O que é este projeto

Wiki-AI é um **repositório de conhecimento persistente** construído incrementalmente por LLM. Baseado no padrão LLM Wiki de Karpathy: fontes brutas → compilação → síntese estruturada.

Ideia central: em vez de responder a mesma pergunta toda vez, compilar o conhecimento uma vez em páginas wiki. O conhecimento se acumula com o tempo.

---

## Princípio fundamental

Este projeto é uma wiki construída exclusivamente a partir de conhecimento fornecido pelo usuário e sessões de trabalho registradas. Você não é uma fonte de conhecimento — você é um organizador e sintetizador.

**Nunca use conhecimento externo para gerar conteúdo deste projeto.**

---

## Fronteiras de conhecimento

### Permitido
- Conteúdo presente em `docs/wiki/pages/`
- Fontes registradas em `docs/fontes/catalogo.md` e arquivos em `docs/fontes/`
- Resumos de sessões em `docs/sessoes/`
- Instruções explícitas do usuário no chat

### Proibido sem aprovação explícita
- Busca na internet
- Uso de conhecimento geral do modelo para gerar conteúdo da wiki
- Criar arquivos fora da estrutura do projeto
- Inferir ou expandir conteúdo além do que está nas fontes locais

Se faltar informação: *"Não encontrei isso nas fontes locais. Você quer adicionar uma fonte ou registrar isso numa sessão?"*

---

## Pipeline obrigatório

Todo chat segue este pipeline. Não pule nenhuma etapa.

### Passo 1 — abrir sessão (sempre)

Ao iniciar qualquer conversa, acione o `agent-sessoes` para abrir uma sessão.
Não responda nenhuma solicitação do usuário antes de confirmar que a sessão está aberta.

```
agent-sessoes → "inicia sessão"
aguarda confirmação: "Sessão [ID] iniciada."
```

### Passo 2 — rota por tipo de atividade

#### Rota A — conversa ou tarefa sem commit

```
1. Execute a tarefa normalmente
2. agent-sessoes → registra a interação (pedido / raciocínio / resultado)
3. Confirme ao usuário que a interação foi registrada
```

#### Rota B — commit

```
1. agent-sessoes  → encerra a sessão com resumo completo
2. agent-wiki     → processa a sessão e atualiza as páginas da wiki
3. Aguarda confirmação do usuário de que a wiki está ok
4. agent-commits  → monta a mensagem de commit no padrão semântico
5. Aguarda confirmação do usuário da mensagem de commit
6. Executa o git commit
```

**Nunca faça o commit antes de a sessão estar encerrada, processada na wiki e com a mensagem validada pelo agent-commits.**

---

## Agentes

| Contexto | Agente | Definição |
|---|---|---|
| Catalogar, buscar ou atualizar fontes | `agent-fontes` | `.cursor/rules/agent-fontes.mdc` |
| Iniciar, registrar, encerrar ou descartar sessões | `agent-sessoes` | `.cursor/rules/agent-sessoes.mdc` |
| Criar ou atualizar páginas da wiki | `agent-wiki` | `.cursor/rules/agent-wiki.mdc` |
| Arquitetura, DDD, TDD, Clean Code, Docker, refatoração | `agent-dev` | `.cursor/rules/agent-dev.mdc` |
| Compor, validar ou consultar padrão de commits | `agent-commits` | `.cursor/rules/agent-commits.mdc` |
| Analisar repositório (somente quando solicitado) | `agent-analise` | `.cursor/rules/agent-analise.mdc` |

---

## Estrutura do projeto

```
wiki-ai/
├── .cursorrules              # Regras globais (espelho deste arquivo)
├── .cursor/rules/            # Definições dos agentes (Cursor + Claude)
├── .instructions.md          # Pipeline detalhado
├── README.md                 # Visão geral
├── CLAUDE.md                 # Este arquivo
│
└── docs/                     # Pasta de trabalho principal
    ├── fontes/               # Fontes brutas (imutável)
    │   └── catalogo.md
    │
    ├── sessoes/              # Sessões de trabalho
    │   └── indice.md
    │
    └── wiki/                 # Conhecimento compilado
        ├── index.md
        └── pages/
```

---

## Arquitetura em três camadas

| Camada | Local | Responsável |
|--------|-------|-------------|
| Fontes (bruto) | `docs/fontes/` | Humano adiciona, `agent-fontes` cataloga |
| Sessões (trabalho) | `docs/sessoes/` | `agent-sessoes` |
| Wiki (compilado) | `docs/wiki/pages/` | `agent-wiki` |

---

## Checklist de qualidade — páginas wiki

Antes de confirmar compilação:

- [ ] Página tem resumo de 1-2 linhas
- [ ] Seção "Por quê?" explica a motivação
- [ ] "Como aplicar" tem orientação prática
- [ ] Nenhuma página está órfã (toda página tem referência cruzada)
- [ ] Índice atualizado com nova página
- [ ] Nenhuma contradição com páginas existentes
- [ ] Todas as fontes usadas estão em `docs/fontes/catalogo.md`

---

## Git workflow

### Branch
Sempre trabalhar em branch de feature a partir de `main`:
```bash
git checkout -b claude/feature-name
```

### Commits
Formato: `[tipo]: [o que mudou] — sessão #X`

Exemplos:
```
feat: add wiki page on retry strategies — session #5
fix: resolve contradiction between error handling pages — session #7
refactor: reorganize wiki index — maintenance
```

### Push & PR
Após validação humana:
```bash
git push -u origin claude/feature-name
# Depois criar PR para revisão
```

---

## Restrições importantes

1. **Sem conhecimento externo** — tudo vem das fontes ou sessões
2. **Validar antes de compilar** — humano aprova antes de atualizar a wiki
3. **Uma ideia por página** — sem mega-páginas
4. **Sempre citar fontes** — (Fonte ID: X) ou (Sessão #X)
5. **Nunca deletar** — arquivar em vez de deletar
6. **Versionar tudo** — git é a verdade

---

## Feedback e mudanças

Se notar:
- **Contradição** entre páginas → sinalizar para revisão
- **Página órfã** (sem referência) → mesclar ou deletar
- **Padrão ausente** → sugerir nova página
- **Fonte obsoleta** → marcar como depreciada no catálogo

Toda mudança flui pelo `agent-wiki` + validação humana.

---

## Comportamento padrão

- Idioma: português brasileiro
- Antes de escrever qualquer arquivo, confirme com o usuário o que será criado ou alterado
- Cite sempre qual fonte local embasa cada afirmação
- Nunca delete arquivos sem as travas definidas em cada agente
- Se o pedido não se encaixar em nenhum agente, pergunte antes de agir

---

**Atualizado em:** 2026-05-21  
**Padrão base:** Karpathy LLM Wiki
