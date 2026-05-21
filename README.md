# Wiki-AI — Sistema de Conhecimento Persistente

Uma wiki viva mantida por LLM, baseada na arquitetura de Karpathy: fontes brutas → compilação em conhecimento estruturado → síntese persistente.

## O Que É Isto?

Este projeto implementa um **repositório de conhecimento que cresce incrementalmente**. Ao invés de responder a mesma pergunta repetidamente, compilamos decisões e aprendizados em páginas wiki que servem como referência futura.

### O Problema
- Mesmos insights descobertos múltiplas vezes
- Conhecimento disperso em conversas antigas
- Contradições aparecem sem serem detectadas
- Sem rastreabilidade de origem

### A Solução
- **Compilar uma vez** → nunca re-derive
- **Indexar tudo** → fácil encontrar
- **Rastrear origem** → saber de onde vem cada ideia
- **Versionar em Git** → histórico de decisões

---

## Estrutura

```
wiki-ai/
├── .cursorrules              # Regras globais para LLM
├── .instructions.md          # Instruções detalhadas
├── fontes/
│   ├── catalogo.md          # Índice de fontes
│   └── [arquivos de fonte]  # Documentos, código, etc
├── sessoes/
│   ├── indice.md            # Índice de sessões
│   └── sessao-*.md          # Conversas registradas
├── wiki/
│   ├── index.md             # Mapa principal
│   └── pages/
│       ├── principios-desenvolvimento.md
│       ├── arquitetura.md
│       ├── gestao-fontes.md
│       └── [outras páginas]
└── README.md
```

### Três Camadas

1. **Fontes** (`fontes/`) — documentação, código, artigos. Imutável. Catalogada.
2. **Sessões** (`sessoes/`) — conversas de trabalho. Cada sessão alimenta wiki.
3. **Wiki** (`wiki/pages/`) — síntese compilada. Conhecimento estruturado e indexado.

---

## Como Funciona

### Fluxo Normal de Trabalho

```
1. Usuário traz conhecimento novo (pergunta, decisão, código)
                    ↓
2. Conversa é registrada em sessão
                    ↓
3. Agent-wiki compila em página wiki (nova ou atualiza existente)
                    ↓
4. Referências cruzadas e índices são atualizados
                    ↓
5. Humano valida mudanças
                    ↓
6. Commit com referência à sessão
```

### Ao Responder Perguntas

1. **Primeiro** → procure em `wiki/pages/`
2. **Se não encontrar** → procure em `fontes/`
3. **Se ainda não souber** → registre para compilação futura
4. **Nunca** use conhecimento externo sem catalogar

---

## Lendo Agora?

- **Novo no projeto?** → Comece por `wiki/pages/principios-desenvolvimento.md`
- **Entender arquitetura?** → Leia `wiki/pages/arquitetura.md`
- **Como as fontes funcionam?** → Veja `wiki/pages/gestao-fontes.md`
- **Instruções completas?** → Abra `.instructions.md`

---

## Princípios Chave

✓ **Conhecimento Persistente** — compile uma vez, reutilize sempre
✓ **Rastreabilidade** — cada página aponta suas fontes
✓ **Validação Humana** — LLM propõe, humano aprova
✓ **Síntese Incremental** — wiki cresce, nunca fica estagnada
✓ **Sem Redundância** — uma ideia por página, cruzar não duplicar

---

## Agents Principais

- **agent-sessoes** → abre/fecha sessões, registra conversas
- **agent-wiki** → compila sessões em páginas, faz linting
- **agent-fontes** → cataloga e rastreia fontes

---

## Primeiro Passo?

Se está começando:

1. Leia `.instructions.md` para entender pipeline
2. Explore `wiki/pages/` para ver exemplos
3. Comece uma conversa — agent-sessoes abre sessão automaticamente
4. Peça para compilar em wiki quando tiver novo conhecimento

---

## Filosofia

Baseado em princípios de Andrej Karpathy sobre LLM wikis:

> "Ao invés de apenas recuperar de documentos brutos em cada query, a LLM constrói incrementalmente e mantém um repositório persistente de conhecimento."

Conhecimento não é resposta instantânea — é síntese que compõe no tempo.

---

**Última atualização:** 2026-05-20  
**Versão base:** 1.0 — Karpathy LLM Wiki Pattern
