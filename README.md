# doc-wiki-ai

Modelo de gestão de conhecimento para projetos de software, baseado no padrão [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) de Andrej Karpathy.

## Como funciona

O LLM mantém uma wiki estruturada (`wiki/`) a partir de documentos brutos que você fornece (`raw/`). Você nunca escreve na wiki diretamente — o LLM faz isso. Você fornece contexto, faz perguntas, e a wiki cresce.

## Estrutura

```
doc-wiki-ai/
├── CLAUDE.md              ← instruções para o LLM (leia primeiro)
├── wiki/
│   ├── index.md           ← catálogo de tudo na wiki
│   ├── log.md             ← histórico cronológico
│   ├── overview.md        ← visão geral do projeto
│   ├── features/          ← uma página por feature
│   ├── requirements/      ← requisitos funcionais e não-funcionais
│   ├── architecture/      ← documentos de arquitetura
│   ├── entities/          ← entidades de domínio
│   └── decisions/         ← ADRs (Architecture Decision Records)
└── raw/
    ├── requirements/      ← seus documentos de requisitos
    ├── meetings/          ← transcrições de reuniões
    ├── research/          ← pesquisas e referências
    └── assets/            ← imagens e diagramas
```

## Fluxo de Uso

### 1. Iniciar um projeto novo

Abra Claude Code neste diretório e diga:
> "Leia o CLAUDE.md. Vamos iniciar um projeto chamado X. O objetivo é Y. A stack é Z."

O LLM preencherá `wiki/overview.md` e criará as primeiras páginas.

### 2. Ingerir requisitos

Coloque um documento em `raw/requirements/` e diga:
> "Ingira o arquivo raw/requirements/meu-documento.md na wiki."

O LLM criará páginas de requisitos, features e entidades a partir do documento.

### 3. Detalhar uma feature

> "Detalhe a feature de exportação de relatórios PDF. Quais são os critérios de aceite e o guia de implementação?"

O LLM consultará requisitos e entidades relacionados, e preencherá ou atualizará a página da feature.

### 4. Consultar antes de implementar

> "Vou implementar a autenticação. O que a wiki diz sobre requisitos, decisões arquiteturais e entidades envolvidas?"

O LLM sintetiza tudo que é relevante, com links para as páginas exatas.

### 5. Registrar uma decisão técnica

> "Decidimos usar PostgreSQL com JSONB para dados flexíveis em vez de MongoDB. Registre como ADR."

O LLM cria `wiki/decisions/adr-use-postgresql.md` e vincula às features afetadas.

### 6. Fazer lint da wiki

> "Faça um lint da wiki e liste problemas."

O LLM verifica: páginas órfãs, features sem requisitos, requisitos sem features, entidades sem página própria.

---

## Dicas

- Use [Obsidian](https://obsidian.md/) para navegar a wiki — a pasta `wiki/` é um vault válido.
- O graph view do Obsidian mostra as conexões entre páginas via `[[links]]`.
- Respostas valiosas a queries podem ser salvas como novas páginas wiki.
- O `wiki/log.md` é filtrável: `grep "^## \[" wiki/log.md | tail -10`
