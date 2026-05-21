# Wiki-AI — Sistema de Conhecimento Persistente

Uma wiki viva mantida por LLM, baseada na arquitetura de Karpathy: fontes brutas → compilação → síntese persistente que cresce com o tempo.

---

## O Problema

- Os mesmos insights são redescobertos em toda conversa nova
- Conhecimento fica disperso em históricos de chat que ninguém relê
- Contradições surgem sem ser detectadas
- Decisões não têm rastreabilidade de origem

## A Solução

Em vez de responder a mesma pergunta repetidamente, o Wiki-AI **compila o conhecimento uma vez** em páginas estruturadas que servem de referência permanente.

```
Conhecimento bruto  →  Sessão registrada  →  Página wiki  →  Referência futura
```

> *"Ao invés de apenas recuperar documentos brutos em cada query, a LLM constrói incrementalmente e mantém um repositório persistente de conhecimento."*
> — Andrej Karpathy

---

## Arquitetura em Três Camadas

| Camada | Local | Papel |
|--------|-------|-------|
| **Fontes** | `docs/fontes/` | Documentação, código, artigos. Imutável. Catalogada com ID. |
| **Sessões** | `docs/sessoes/` | Conversas de trabalho registradas. Cada sessão alimenta a wiki. |
| **Wiki** | `docs/wiki/pages/` | Conhecimento compilado, indexado e com citação de origem. |

---

## Estrutura do Projeto

```
wiki-ai/
├── .cursorrules              # Regras globais (Cursor)
├── .claude/
│   └── agents/               # Agentes (Claude Code)
│       ├── agent-sessoes.md
│       ├── agent-fontes.md
│       ├── agent-wiki.md
│       └── agent-dev.md
├── .instructions.md          # Pipeline detalhado
├── CLAUDE.md                 # Contexto para Claude Code
├── README.md
│
└── docs/                     # Pasta de trabalho principal
    ├── fontes/
    │   └── catalogo.md       # Índice de fontes
    │
    ├── sessoes/
    │   └── indice.md         # Índice de sessões
    │
    └── wiki/
        ├── index.md          # Mapa principal
        └── pages/            # Páginas compiladas
```

---

## Agentes

| Agente | Responsabilidade |
|--------|-----------------|
| `agent-sessoes` | Abre, registra interações e encerra sessões |
| `agent-fontes` | Cataloga e consulta fontes |
| `agent-wiki` | Compila sessões em páginas wiki, faz lint |
| `agent-dev` | Arquitetura (DDD, Clean Architecture), TDD, Clean Code, Docker, refatoração (Fowler) |

---

## Fluxo de Trabalho

```
1. Usuário traz conhecimento (pergunta, decisão, código)
             ↓
2. agent-sessoes → abre sessão e registra cada interação
             ↓
3. Trabalho acontece normalmente na conversa
             ↓
4. agent-sessoes → encerra sessão com resumo
             ↓
5. agent-wiki → compila em páginas, atualiza índices
             ↓
6. Humano valida as mudanças
             ↓
7. Commit referenciando a sessão
```

**Regra fundamental:** nunca commitar antes de a sessão estar encerrada e processada na wiki.

---

## Instalação

### Pré-requisitos

- [Cursor](https://cursor.sh) ou [Claude Code](https://claude.ai/code)
- Git

---

### Opção A — Cursor

1. Clone o repositório dentro do seu projeto ou na raiz de um workspace novo:

```bash
git clone https://github.com/seu-usuario/wiki-ai.git .
```

2. Abra o projeto no Cursor. As regras em `.cursorrules` são carregadas automaticamente.

3. As regras dos agentes ficam em `.cursor/rules/` e são ativadas por contexto (via `globs`).

4. Para verificar que está funcionando, abra um chat no Cursor e diga:
   ```
   inicia sessão
   ```
   O `agent-sessoes` deve responder com a confirmação de sessão aberta.

**Arquivos relevantes para o Cursor:**

| Arquivo | Função |
|---------|--------|
| `.cursorrules` | Regras globais carregadas em todo chat |
| `.cursor/rules/agent-sessoes.mdc` | Agente de sessões |
| `.cursor/rules/agent-fontes.mdc` | Agente de fontes |
| `.cursor/rules/agent-wiki.mdc` | Agente da wiki |

---

### Opção B — Claude Code

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/wiki-ai.git .
```

2. Abra o projeto com o Claude Code CLI:

```bash
claude
```

3. O `CLAUDE.md` é carregado automaticamente como contexto do projeto.

4. Os agentes em `.claude/agents/` ficam disponíveis para invocação automática pelo Claude Code conforme o contexto da tarefa.

5. Para verificar que está funcionando:
   ```
   inicia sessão
   ```
   O `agent-sessoes` deve confirmar a sessão aberta.

**Arquivos relevantes para o Claude Code:**

| Arquivo | Função |
|---------|--------|
| `CLAUDE.md` | Contexto e regras do projeto |
| `.claude/agents/agent-sessoes.md` | Agente de sessões |
| `.claude/agents/agent-fontes.md` | Agente de fontes |
| `.claude/agents/agent-wiki.md` | Agente da wiki |
| `.claude/agents/agent-dev.md` | Agente de arquitetura e desenvolvimento |

---

### Opção C — Usar em projeto existente

Para adicionar o Wiki-AI a um projeto que já existe, copie apenas os arquivos de configuração:

**Para Cursor:**
```bash
cp .cursorrules /seu-projeto/
cp -r .cursor/rules /seu-projeto/.cursor/
```

**Para Claude Code:**
```bash
cp CLAUDE.md /seu-projeto/
cp -r .claude/agents /seu-projeto/.claude/
```

Em seguida, crie a estrutura de pastas no seu projeto:

```bash
mkdir -p docs/fontes docs/sessoes docs/wiki/pages
touch docs/fontes/catalogo.md docs/sessoes/indice.md docs/wiki/index.md
```

---

## Primeiros Passos

Após instalar, o fluxo recomendado para começar:

1. **Abra uma sessão** — diga `inicia sessão` no chat
2. **Faça perguntas ou traga decisões** — o agente registra tudo
3. **Ao final, encerre** — diga `encerra sessão`
4. **Compile na wiki** — diga `processa a sessão S001 na wiki`
5. **Valide e commite** — revise as páginas geradas e faça o commit

---

## Princípios

| Princípio | Descrição |
|-----------|-----------|
| **Compilar uma vez** | Nunca re-derive o mesmo conhecimento |
| **Rastreabilidade** | Cada página cita sua sessão e fonte de origem |
| **Validação humana** | LLM propõe, humano aprova antes do commit |
| **Síntese incremental** | A wiki só cresce, nunca regride |
| **Sem redundância** | Uma ideia por página — cruzar referências, não duplicar |
| **Sem conhecimento externo** | Todo conteúdo vem de fontes ou sessões registradas |

---

**Última atualização:** 2026-05-20  
**Padrão base:** Karpathy LLM Wiki
